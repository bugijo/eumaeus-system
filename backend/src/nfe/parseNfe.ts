import { child, childrenNamed, findFirst, parseXml, textOf, XmlError, type XmlNode } from './xml';

export interface NfeLot { code: string; quantity: number; expiresAt: string | null; manufacturedAt: string | null }
export interface NfeItem {
  nItem: number;
  code: string;
  ean: string | null;
  name: string;
  ncm: string | null;
  cfop: string | null;
  unit: string;
  quantity: number;
  /** Valor do item já com o desconto do próprio item, em centavos. */
  totalCents: number;
  /** Custo por unidade comprada (antes da conversão de embalagem), em reais com 4 casas. */
  unitCost: number;
  anvisa: string | null;
  lots: NfeLot[];
}
export interface ParsedNfe {
  accessKey: string;
  number: string;
  series: string;
  issuedAt: string;
  supplier: { document: string; name: string; tradeName: string | null };
  recipientDocument: string | null;
  totalCents: number;
  productsCents: number;
  authorized: boolean;
  protocol: string | null;
  items: NfeItem[];
  warnings: string[];
}

export class NfeError extends Error {}

/** Dígito verificador da chave de acesso (módulo 11, pesos 2 a 9 da direita para a esquerda). */
export function accessKeyIsValid(key: string): boolean {
  if (!/^\d{44}$/.test(key)) return false;
  let sum = 0;
  let weight = 2;
  for (let i = 42; i >= 0; i -= 1) {
    sum += Number(key[i]) * weight;
    weight = weight === 9 ? 2 : weight + 1;
  }
  const rest = sum % 11;
  const dv = rest < 2 ? 0 : 11 - rest;
  return dv === Number(key[43]);
}

const toCents = (value: string | undefined) => {
  if (value === undefined) return 0;
  if (!/^-?\d+(\.\d+)?$/.test(value)) throw new NfeError(`Valor inválido no XML: ${value}`);
  return Math.round(Number(value) * 100);
};
const toQuantity = (value: string | undefined, label: string) => {
  if (!value || !/^\d+(\.\d+)?$/.test(value) || Number(value) <= 0) throw new NfeError(`Quantidade inválida em ${label}`);
  return Number(value);
};
const toDate = (value: string | undefined) => {
  if (!value) return null;
  const date = new Date(value.length === 10 ? `${value}T12:00:00Z` : value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};
const cleanEan = (value: string | undefined) => {
  const digits = value?.replace(/\s/g, '');
  return digits && /^(\d{8}|\d{12,14})$/.test(digits) && !/^0+$/.test(digits) ? digits : null;
};

function parseItem(det: XmlNode): NfeItem {
  const nItem = Number(det.attrs.nItem);
  const prod = child(det, 'prod');
  if (!prod || !Number.isInteger(nItem) || nItem < 1) throw new NfeError('Item da nota sem dados de produto');
  const label = `item ${nItem}`;
  const quantity = toQuantity(textOf(prod, 'qCom'), label);
  const totalCents = toCents(textOf(prod, 'vProd')) - toCents(textOf(prod, 'vDesc'));
  const lots = childrenNamed(prod, 'rastro').map((rastro) => ({
    code: (textOf(rastro, 'nLote') ?? '').slice(0, 60),
    quantity: toQuantity(textOf(rastro, 'qLote'), `lote do ${label}`),
    expiresAt: toDate(textOf(rastro, 'dVal')),
    manufacturedAt: toDate(textOf(rastro, 'dFab')),
  })).filter((lot) => lot.code);
  return {
    nItem,
    code: (textOf(prod, 'cProd') ?? '').slice(0, 60),
    ean: cleanEan(textOf(prod, 'cEAN')) ?? cleanEan(textOf(prod, 'cEANTrib')),
    name: (textOf(prod, 'xProd') ?? `Item ${nItem}`).slice(0, 200),
    ncm: textOf(prod, 'NCM') ?? null,
    cfop: textOf(prod, 'CFOP') ?? null,
    unit: (textOf(prod, 'uCom') ?? 'UN').slice(0, 10),
    quantity,
    totalCents,
    unitCost: Math.round((totalCents / 100 / quantity) * 10000) / 10000,
    anvisa: textOf(prod, 'med', 'cProdANVISA') ?? null,
    lots,
  };
}

/** Lê o XML de uma NF-e (modelo 55) de compra. Recusa NFC-e, homologação e chave inválida. */
export function parseNfe(xml: string): ParsedNfe {
  let root: XmlNode;
  try { root = parseXml(xml); } catch (error) {
    if (error instanceof XmlError) throw new NfeError(`XML inválido: ${error.message}`);
    throw error;
  }
  const inf = findFirst(root, 'infNFe');
  if (!inf) throw new NfeError('O arquivo não é o XML de uma NF-e');
  const accessKey = (inf.attrs.Id ?? '').replace(/^NFe/, '');
  if (!accessKeyIsValid(accessKey)) throw new NfeError('Chave de acesso inválida no XML');

  const ide = child(inf, 'ide');
  const model = textOf(ide, 'mod');
  if (model === '65') throw new NfeError('Este XML é de NFC-e (cupom de venda ao consumidor), não de nota de compra');
  if (model !== '55') throw new NfeError('Só é possível importar NF-e modelo 55');
  if (textOf(ide, 'tpAmb') === '2') throw new NfeError('Nota emitida em homologação (teste), sem valor fiscal');

  const emit = child(inf, 'emit');
  const supplierDocument = textOf(emit, 'CNPJ') ?? textOf(emit, 'CPF');
  if (!supplierDocument) throw new NfeError('Nota sem CNPJ/CPF do fornecedor');
  const dest = child(inf, 'dest');

  const items = childrenNamed(inf, 'det').map(parseItem);
  if (!items.length) throw new NfeError('Nota sem itens');
  if (items.length > 990) throw new NfeError('Nota com itens demais');

  const icms = child(child(inf, 'total'), 'ICMSTot');
  const warnings: string[] = [];
  const prot = findFirst(root, 'infProt');
  const status = textOf(prot, 'cStat');
  const protocolKey = textOf(prot, 'chNFe');
  if (protocolKey && protocolKey !== accessKey) throw new NfeError('Protocolo de autorização não corresponde à nota');
  const authorized = status === '100' || status === '150';
  if (!prot) warnings.push('O XML não traz o protocolo de autorização da SEFAZ. Confira se a nota foi autorizada.');
  else if (!authorized) warnings.push(`Situação da nota na SEFAZ: ${status ?? 'desconhecida'} (${textOf(prot, 'xMotivo') ?? 'sem motivo'}). Ela pode não estar autorizada.`);

  const issuedAt = toDate(textOf(ide, 'dhEmi') ?? textOf(ide, 'dEmi'));
  if (!issuedAt) throw new NfeError('Nota sem data de emissão');

  return {
    accessKey,
    number: textOf(ide, 'nNF') ?? '',
    series: textOf(ide, 'serie') ?? '',
    issuedAt,
    supplier: { document: supplierDocument, name: (textOf(emit, 'xNome') ?? 'Fornecedor').slice(0, 200), tradeName: textOf(emit, 'xFant')?.slice(0, 200) ?? null },
    recipientDocument: textOf(dest, 'CNPJ') ?? textOf(dest, 'CPF') ?? null,
    totalCents: toCents(textOf(icms, 'vNF')),
    productsCents: toCents(textOf(icms, 'vProd')),
    authorized,
    protocol: textOf(prot, 'nProt') ?? null,
    items,
    warnings,
  };
}
