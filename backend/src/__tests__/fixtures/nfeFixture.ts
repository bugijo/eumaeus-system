import { accessKeyIsValid } from '../../nfe/parseNfe';

/** Completa 43 dígitos com o dígito verificador. */
export function withCheckDigit(base43: string): string {
  for (let dv = 0; dv <= 9; dv += 1) if (accessKeyIsValid(base43 + dv)) return base43 + dv;
  throw new Error('sem DV');
}

export interface FixtureItem { code: string; ean?: string; name: string; unit?: string; qty: string; total: string; discount?: string; lots?: Array<{ code: string; qty: string; val?: string }> }

export function buildNfeXml(options: { key?: string; model?: string; tpAmb?: string; cStat?: string; dest?: string; supplier?: string; items?: FixtureItem[]; total?: string; extra?: string } = {}) {
  const key = options.key ?? withCheckDigit('3526111234567800019955001000001234100001234');
  const items = options.items ?? [
    { code: 'RAC-01', ean: '7891000100103', name: 'Ração Premium 15kg', unit: 'UN', qty: '2.0000', total: '300.00' },
    { code: 'VERM-9', ean: 'SEM GTIN', name: 'Vermífugo &amp; antipulgas', unit: 'CX', qty: '1.0000', total: '120.00', discount: '20.00', lots: [{ code: 'L123', qty: '1.0000', val: '2027-06-30' }] },
  ];
  const det = items.map((item, index) => `<det nItem="${index + 1}"><prod><cProd>${item.code}</cProd><cEAN>${item.ean ?? 'SEM GTIN'}</cEAN><xProd>${item.name}</xProd><NCM>23091000</NCM><CFOP>5102</CFOP><uCom>${item.unit ?? 'UN'}</uCom><qCom>${item.qty}</qCom><vUnCom>1</vUnCom><vProd>${item.total}</vProd>${item.discount ? `<vDesc>${item.discount}</vDesc>` : ''}${(item.lots ?? []).map((lot) => `<rastro><nLote>${lot.code}</nLote><qLote>${lot.qty}</qLote><dFab>2026-01-01</dFab><dVal>${lot.val ?? '2027-01-01'}</dVal></rastro>`).join('')}</prod><imposto/></det>`).join('');
  return `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00"><NFe><infNFe Id="NFe${key}" versao="4.00">
<ide><cUF>35</cUF><mod>${options.model ?? '55'}</mod><serie>1</serie><nNF>1234</nNF><dhEmi>2026-11-20T10:30:00-03:00</dhEmi><tpNF>1</tpNF><tpAmb>${options.tpAmb ?? '1'}</tpAmb></ide>
<emit><CNPJ>${options.supplier ?? '12345678000199'}</CNPJ><xNome>Distribuidora Pet Ltda</xNome><xFant>PetDist</xFant></emit>
<dest><CNPJ>${options.dest ?? '11222333000181'}</CNPJ><xNome>Clinica</xNome></dest>
${det}
<total><ICMSTot><vProd>420.00</vProd><vDesc>20.00</vDesc><vNF>${options.total ?? '400.00'}</vNF></ICMSTot></total>${options.extra ?? ''}
</infNFe><Signature xmlns="http://www.w3.org/2000/09/xmldsig#"><SignatureValue>abc==</SignatureValue></Signature></NFe>
<protNFe versao="4.00"><infProt><tpAmb>1</tpAmb><chNFe>${key}</chNFe><nProt>135260000000001</nProt><cStat>${options.cStat ?? '100'}</cStat><xMotivo>Autorizado o uso da NF-e</xMotivo></infProt></protNFe></nfeProc>`;
}
