import PDFDocument from 'pdfkit';
import fs from 'node:fs';
import path from 'node:path';

const money = (value: string) => `R$ ${value.replace('.', ',')}`;

const render = (write: (doc: any) => void): Promise<Buffer> => new Promise((resolve, reject) => {
  const doc = new PDFDocument({ size: 'A4', margin: 48, info: { Producer: 'Eumaeus local' } });
  const candidates = [process.env.EUMAEUS_PDF_FONT, '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'].filter(Boolean) as string[];
  const fontPath = candidates.find((candidate) => fs.existsSync(path.resolve(candidate)));
  if (fontPath) { doc.registerFont('EumaeusSans', fontPath); doc.font('EumaeusSans'); }
  const chunks: Buffer[] = [];
  doc.on('data', (chunk: Buffer) => chunks.push(chunk));
  doc.on('end', () => resolve(Buffer.concat(chunks)));
  doc.on('error', reject);
  write(doc);
  doc.end();
});

export class PdfService {
  static accounting(report: any) {
    const labels: Record<string, string> = {
      billed: 'Faturado (serviços)', sales: 'Vendas no caixa (produtos)', received: 'Recebido de faturas', reversed: 'Estornado',
      pending: 'A receber', discounts: 'Descontos concedidos', expenses: 'Despesas',
    };
    const methodLabels: Record<string, string> = { DINHEIRO: 'Dinheiro', PIX: 'PIX', DEBITO: 'Cartão de débito', CREDITO: 'Cartão de crédito', OUTRO: 'Outro' };
    const day = (value: unknown) => (value instanceof Date ? value.toISOString() : String(value)).slice(0, 10).split('-').reverse().join('/');
    const section = (doc: any, title: string) => { doc.moveDown(0.8).fontSize(13).fillColor('#0f766e').text(title).fillColor('#000000'); doc.moveDown(0.2).fontSize(9); };
    return render((doc) => {
      doc.fontSize(18).text(report.clinicName ? `Resumo contábil — ${report.clinicName}` : 'Resumo contábil');
      doc.moveDown(0.3).fontSize(10).text(`Período: ${day(report.period.from)} a ${day(report.period.to)}`);
      doc.text(`Gerado em ${new Date(report.generatedAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
      section(doc, 'Totais do período');
      doc.fontSize(10);
      for (const [key, value] of Object.entries(report.totals || {})) doc.text(`${labels[key] || key}: ${money(String(value))}`);
      if (report.salesByMethod && Object.keys(report.salesByMethod).length) {
        section(doc, 'Vendas do caixa por forma de pagamento');
        for (const [method, value] of Object.entries(report.salesByMethod)) doc.text(`${methodLabels[method] || method}: ${money(String(value))}`);
      }
      if (Array.isArray(report.byCenter) && report.byCenter.length) {
        section(doc, 'Resultado por unidade / centro');
        report.byCenter.forEach((row: any) => doc.text(`${row.name} (${row.code}) · serviços ${money(row.billed)} · vendas ${money(row.sales)} · despesas ${money(row.expenses)} · resultado ${money(row.result)}`));
      }
      section(doc, 'Pendências');
      doc.text(`Vendas: ${report.counts?.sales ?? 0} · Faturas: ${report.counts?.invoices ?? 0} · Pagamentos: ${report.counts?.payments ?? 0} · Despesas: ${report.counts?.expenses ?? 0}`);
      doc.text(`Despesas sem centro: ${report.pendencies?.unclassifiedExpenses ?? 0} · Faturas sem nota fiscal: ${report.pendencies?.missingFiscalDocuments ?? 0}`);
      if (Array.isArray(report.sales) && report.sales.length) {
        section(doc, 'Vendas do caixa');
        report.sales.forEach((sale: any) => doc.text(`Venda ${sale.number} · ${day(sale.createdAt)} · ${sale.status === 'CANCELLED' ? 'CANCELADA' : 'concluída'} · ${money(sale.total)} · ${sale.methods || '-'} · ${sale.resultCenter?.code || 'SEM_CENTRO'}${sale.fiscalDocument ? ` · NF ${sale.fiscalDocument}` : ''}`));
      }
      section(doc, 'Faturas de serviços');
      if (!report.invoices?.length) doc.text('Nenhuma fatura no período.');
      (report.invoices || []).forEach((invoice: any) => doc.text(`Fatura ${invoice.id} · ${day(invoice.createdAt)} · ${invoice.status} · total ${money(invoice.totalAmount)} · recebido ${money(invoice.received)} · desconto ${money(invoice.discount)}${invoice.fiscalDocument ? ` · NFS-e ${invoice.fiscalDocument.id}` : ''}`));
      section(doc, 'Despesas');
      if (!report.expenses?.length) doc.text('Nenhuma despesa no período.');
      (report.expenses || []).forEach((expense: any) => doc.text(`${day(expense.incurredAt)} · ${expense.description} · ${money(expense.amount)} · ${expense.resultCenter?.name || 'Sem centro'}${expense.allocationGroup ? ' · rateio' : ''}`));
    });
  }

  static prescription(prescription: any) {
    if (prescription.status !== 'APPROVED') throw new Error('Somente receitas aprovadas podem gerar documento PDF');
    return render((doc) => {
      doc.fontSize(18).text(prescription.clinicNameSnapshot);
      doc.moveDown(0.6).fontSize(12).text('Receita veterinária');
      doc.fontSize(10).text(`Receita #${prescription.id} · versão ${prescription.currentVersion}`);
      doc.text(`Pet: ${prescription.petNameSnapshot}`);
      doc.text(`Tutor: ${prescription.tutorNameSnapshot}`);
      doc.text(`Veterinária: ${prescription.veterinarianNameSnapshot}`);
      doc.text(`Status: ${prescription.status} · Assinatura: ${prescription.signatureMode}`);
      doc.moveDown().fontSize(12).text('Itens prescritos');
      doc.fontSize(10);
      (prescription.items || []).forEach((item: any, index: number) => {
        doc.moveDown(0.3).text(`${index + 1}. ${item.medication} — ${item.dosage}; ${item.frequency}; ${item.duration}${item.instructions ? `; ${item.instructions}` : ''}`);
      });
      doc.moveDown().fontSize(9).text('Documento privado, acessível somente mediante autorização autenticada. A assinatura indicada é visual e não constitui assinatura digital verificável.');
    });
  }
}
