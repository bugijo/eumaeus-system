import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { withSerializableRetry } from '../lib/serializableRetry';
import { getCurrentClinicId, getCurrentUserId } from '../tenantContext';
import { NfeError, parseNfe, type NfeItem, type ParsedNfe } from '../nfe/parseNfe';
import { receiveWithin } from './inventory.service';
import { inferCategory } from './product.service';

export type LineAction = 'link' | 'create' | 'skip';
export interface LineDecision { nItem: number; action: LineAction; productId?: number; unitsPerPackage?: number; name?: string; salePrice?: number | null }
export interface ImportOptions { updateCost?: boolean; createExpense?: boolean; resultCenterId?: number }

const reais = (cents: number) => (cents / 100).toFixed(2);
const digits = (value?: string | null) => (value ?? '').replace(/\D/g, '');
const MAX_UNITS = 10_000;

function authorship() {
  const clinicId = getCurrentClinicId();
  const userId = getCurrentUserId();
  if (!clinicId || !userId) throw new Error('Autoria autenticada obrigatória');
  return { clinicId, userId };
}

async function userName(id?: number | null) {
  if (!id) return null;
  const user = await (prisma.user as any).findFirst({ where: { id }, select: { name: true } });
  return user?.name ?? null;
}

/** Quantidade que entra no estoque: quantidade comprada × unidades por embalagem. Precisa dar número inteiro. */
export function stockQuantity(item: Pick<NfeItem, 'quantity' | 'nItem'>, unitsPerPackage: number): number {
  const total = item.quantity * unitsPerPackage;
  const rounded = Math.round(total);
  if (Math.abs(total - rounded) > 1e-6 || rounded <= 0) {
    throw new Error(`Item ${item.nItem}: ${item.quantity} × ${unitsPerPackage} não dá um número inteiro de unidades. Ajuste as unidades por embalagem.`);
  }
  return rounded;
}

/** Divide a entrada entre os lotes informados na nota (rastro). Sem lote, usa "NF-<número>". */
export function splitLots(item: NfeItem, unitsPerPackage: number, invoiceNumber: string) {
  const fallback = `NF-${invoiceNumber || 's-n'}`;
  const total = stockQuantity(item, unitsPerPackage);
  const lotSum = item.lots.reduce((sum, lot) => sum + lot.quantity, 0);
  if (item.lots.length && Math.abs(lotSum - item.quantity) < 1e-6) {
    const parts = item.lots.map((lot) => ({ code: lot.code, quantity: stockQuantity({ quantity: lot.quantity, nItem: item.nItem }, unitsPerPackage), expiresAt: lot.expiresAt }));
    return { parts, note: null as string | null };
  }
  // Lotes que não fecham com a quantidade: entra tudo no primeiro lote (ou no lote da nota) e avisa.
  const first = item.lots[0];
  return {
    parts: [{ code: first?.code ?? fallback, quantity: total, expiresAt: first?.expiresAt ?? null }],
    note: item.lots.length ? 'Quantidade dos lotes não bate com a do item: tudo entrou no primeiro lote.' : null,
  };
}

function parse(xml: unknown): ParsedNfe {
  if (typeof xml !== 'string') throw new NfeError('Envie o conteúdo do arquivo XML');
  return parseNfe(xml);
}

export class PurchaseInvoiceService {
  /** Lê o XML e sugere o que fazer com cada item. Não grava nada. */
  static async preview(xml: unknown) {
    const nfe = parse(xml);
    const existing = await (prisma.purchaseInvoice as any).findFirst({ where: { accessKey: nfe.accessKey }, select: { id: true, createdAt: true, importedById: true } });
    const settings = await (prisma.clinicSettings as any).findFirst({ select: { clinicDocument: true } });
    const warnings = [...nfe.warnings];
    const ownDocument = digits(settings?.clinicDocument);
    if (ownDocument && nfe.recipientDocument && digits(nfe.recipientDocument) !== ownDocument) {
      warnings.push(`A nota foi emitida para outro CNPJ/CPF (${nfe.recipientDocument}), diferente do cadastrado em Configurações.`);
    }

    const codes = nfe.items.map((item) => item.code).filter(Boolean);
    const links = codes.length ? await (prisma.supplierProductLink as any).findMany({
      where: { supplierDocument: nfe.supplier.document, supplierCode: { in: codes } },
      include: { product: { select: { id: true, name: true } } },
    }) : [];
    const eans = nfe.items.map((item) => item.ean).filter(Boolean) as string[];
    const byBarcode = eans.length ? await (prisma.product as any).findMany({ where: { barcode: { in: eans } }, select: { id: true, name: true, barcode: true } }) : [];

    return {
      accessKey: nfe.accessKey,
      number: nfe.number,
      series: nfe.series,
      issuedAt: nfe.issuedAt,
      supplier: nfe.supplier,
      recipientDocument: nfe.recipientDocument,
      total: reais(nfe.totalCents),
      authorized: nfe.authorized,
      warnings,
      alreadyImported: existing ? { id: existing.id, at: existing.createdAt, by: await userName(existing.importedById) } : null,
      lines: nfe.items.map((item) => {
        const link = links.find((l: any) => l.supplierCode === item.code);
        const barcode = item.ean ? byBarcode.find((p: any) => p.barcode === item.ean) : undefined;
        const suggestion = link?.product
          ? { productId: link.product.id, productName: link.product.name, unitsPerPackage: link.unitsPerPackage, source: 'fornecedor' as const }
          : barcode ? { productId: barcode.id, productName: barcode.name, unitsPerPackage: 1, source: 'codigo_barras' as const } : null;
        return {
          nItem: item.nItem, code: item.code, ean: item.ean, name: item.name, ncm: item.ncm, unit: item.unit,
          quantity: item.quantity, unitCost: item.unitCost, total: reais(item.totalCents), anvisa: item.anvisa,
          lots: item.lots, suggestion,
        };
      }),
    };
  }

  /** Confirma a importação. O XML é lido de novo aqui: valores vindos da tela não são usados. */
  static async import(xml: unknown, decisionsInput: unknown, options: ImportOptions, canRecordExpense: boolean) {
    const { userId } = authorship();
    const nfe = parse(xml);
    if (!Array.isArray(decisionsInput)) throw new Error('Informe o que fazer com cada item');
    const decisions = new Map<number, LineDecision>();
    for (const raw of decisionsInput as LineDecision[]) {
      const nItem = Number(raw?.nItem);
      if (decisions.has(nItem)) throw new Error(`Item ${nItem} repetido`);
      decisions.set(nItem, raw);
    }
    const plan = nfe.items.map((item) => {
      const decision = decisions.get(item.nItem);
      if (!decision || !['link', 'create', 'skip'].includes(decision.action)) throw new Error(`Decida o que fazer com o item ${item.nItem} (${item.name})`);
      if (decision.action === 'skip') return { item, action: 'skip' as const };
      const units = Number(decision.unitsPerPackage ?? 1);
      if (!Number.isInteger(units) || units < 1 || units > MAX_UNITS) throw new Error(`Item ${item.nItem}: unidades por embalagem inválidas`);
      const lots = splitLots(item, units, nfe.number);
      const unitCost = Math.round((item.unitCost / units) * 100) / 100;
      if (decision.action === 'link') {
        const productId = Number(decision.productId);
        if (!Number.isInteger(productId) || productId <= 0) throw new Error(`Item ${item.nItem}: escolha o produto do estoque`);
        return { item, action: 'link' as const, productId, units, lots, unitCost };
      }
      const name = String(decision.name ?? item.name).trim().slice(0, 200);
      if (!name) throw new Error(`Item ${item.nItem}: informe o nome do produto`);
      const salePrice = decision.salePrice === null || decision.salePrice === undefined || (decision.salePrice as unknown) === '' ? null : Number(decision.salePrice);
      if (salePrice !== null && (!Number.isFinite(salePrice) || salePrice < 0 || salePrice > 1_000_000)) throw new Error(`Item ${item.nItem}: preço de venda inválido`);
      return { item, action: 'create' as const, name, salePrice, units, lots, unitCost };
    });
    if (plan.every((line) => line.action === 'skip')) throw new Error('Todos os itens foram ignorados: nada para importar');
    if (options.createExpense && !canRecordExpense) throw new Error('Seu acesso não permite lançar despesas no Financeiro');
    const resultCenterId = options.resultCenterId ? Number(options.resultCenterId) : undefined;
    const reason = `NF-e ${nfe.number} - ${nfe.supplier.name}`.slice(0, 250);

    return withSerializableRetry(() => prisma.$transaction(async (tx: any) => {
      const existing = await tx.purchaseInvoice.findFirst({ where: { accessKey: nfe.accessKey }, select: { createdAt: true } });
      if (existing) throw new Error(`Esta nota já foi importada em ${existing.createdAt.toLocaleDateString('pt-BR')}`);
      // Cria a nota primeiro: o índice único segura duas importações simultâneas da mesma chave.
      const invoice = await tx.purchaseInvoice.create({
        data: {
          accessKey: nfe.accessKey, number: nfe.number, series: nfe.series, issuedAt: new Date(nfe.issuedAt),
          supplierDocument: nfe.supplier.document, supplierName: nfe.supplier.name, total: new Prisma.Decimal(reais(nfe.totalCents)),
          itemsCount: nfe.items.length, importedById: userId, lines: [], xml: xml as string,
        },
      });

      const applied: any[] = [];
      for (const line of plan) {
        if (line.action === 'skip') { applied.push({ nItem: line.item.nItem, name: line.item.name, action: 'skip' }); continue; }
        let productId: number;
        let productName: string;
        if (line.action === 'link') {
          const product = await tx.product.findFirst({ where: { id: line.productId }, select: { id: true, name: true } });
          if (!product) throw new Error(`Item ${line.item.nItem}: produto não encontrado no estoque`);
          productId = product.id; productName = product.name;
          if (options.updateCost) await tx.product.update({ where: { id: productId }, data: { price: new Prisma.Decimal(line.unitCost.toFixed(2)) } });
        } else {
          const barcodeTaken = line.item.ean ? await tx.product.findFirst({ where: { barcode: line.item.ean }, select: { name: true } }) : null;
          if (barcodeTaken) throw new Error(`Item ${line.item.nItem}: o código de barras ${line.item.ean} já é do produto "${barcodeTaken.name}". Escolha "Vincular" em vez de criar.`);
          const created = await tx.product.create({
            data: {
              name: line.name, quantity: 0, price: new Prisma.Decimal(line.unitCost.toFixed(2)),
              salePrice: line.salePrice === null ? null : new Prisma.Decimal(line.salePrice.toFixed(2)),
              barcode: line.item.ean, category: inferCategory(line.name), description: `Fornecedor: ${nfe.supplier.name}`.slice(0, 500),
            },
          });
          productId = created.id; productName = created.name;
        }
        let stock = 0;
        for (const [index, part] of line.lots.parts.entries()) {
          await receiveWithin(tx, {
            productId, lotCode: part.code, quantity: part.quantity, expiresAt: part.expiresAt ?? undefined, reason,
            idempotencyKey: `nfe:${nfe.accessKey}:${line.item.nItem}:${index}`, authorizedByUserId: userId,
          });
          stock += part.quantity;
        }
        if (line.item.code) {
          const where = { supplierDocument: nfe.supplier.document, supplierCode: line.item.code };
          const link = await tx.supplierProductLink.findFirst({ where });
          if (link) await tx.supplierProductLink.update({ where: { id: link.id }, data: { productId, unitsPerPackage: line.units } });
          else await tx.supplierProductLink.create({ data: { ...where, productId, unitsPerPackage: line.units } });
        }
        applied.push({ nItem: line.item.nItem, name: line.item.name, action: line.action, productId, productName, unitsPerPackage: line.units, stockQuantity: stock, unitCost: line.unitCost.toFixed(2), lots: line.lots.parts, note: line.lots.note });
      }

      let expenseId: number | null = null;
      if (options.createExpense && nfe.totalCents > 0) {
        if (resultCenterId !== undefined) {
          const center = await tx.resultCenter.findFirst({ where: { id: resultCenterId, active: true } });
          if (!center) throw new Error('Centro de resultado não encontrado');
        }
        const { clinicId } = authorship();
        const expense = await tx.expense.create({
          data: { description: reason, amount: new Prisma.Decimal(reais(nfe.totalCents)), resultCenterId: resultCenterId ?? null, incurredAt: new Date(nfe.issuedAt), reason: `Importação da NF-e ${nfe.accessKey}`, createdById: userId },
        });
        await tx.financialAuditEvent.create({ data: { clinicId, eventType: 'EXPENSE_CREATED', expenseId: expense.id, actorUserId: userId, metadata: { amount: expense.amount.toString(), resultCenterId: expense.resultCenterId, source: 'NFE_IMPORT', accessKey: nfe.accessKey } } });
        expenseId = expense.id;
      }

      await tx.purchaseInvoice.update({ where: { id: invoice.id }, data: { lines: applied, expenseId } });
      return {
        id: invoice.id, number: nfe.number, supplierName: nfe.supplier.name, total: reais(nfe.totalCents), expenseId,
        received: applied.filter((l) => l.action !== 'skip').length,
        created: applied.filter((l) => l.action === 'create').length,
        skipped: applied.filter((l) => l.action === 'skip').length,
        units: applied.reduce((sum, l) => sum + (l.stockQuantity ?? 0), 0),
        lines: applied,
      };
    }, { timeout: 30_000 }), { retryOnUnique: true });
  }

  static async list(limit = 30) {
    const rows = await (prisma.purchaseInvoice as any).findMany({
      select: { id: true, createdAt: true, accessKey: true, number: true, series: true, issuedAt: true, supplierName: true, supplierDocument: true, total: true, itemsCount: true, importedById: true, expenseId: true },
      orderBy: { createdAt: 'desc' }, take: Math.min(Math.max(limit, 1), 100),
    });
    const ids = [...new Set(rows.map((r: any) => r.importedById))];
    const users = ids.length ? await (prisma.user as any).findMany({ where: { id: { in: ids } }, select: { id: true, name: true } }) : [];
    return rows.map((r: any) => ({ ...r, total: r.total.toString(), importedBy: users.find((u: any) => u.id === r.importedById)?.name ?? null }));
  }

  static async xml(id: number) {
    const row = await (prisma.purchaseInvoice as any).findFirst({ where: { id }, select: { accessKey: true, xml: true } });
    return row ?? null;
  }
}
