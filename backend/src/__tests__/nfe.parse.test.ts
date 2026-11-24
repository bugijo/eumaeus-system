import { parseXml } from '../nfe/xml';
import { accessKeyIsValid, parseNfe } from '../nfe/parseNfe';
import { buildNfeXml, withCheckDigit } from './fixtures/nfeFixture';

describe('leitor de XML', () => {
  it('lê elementos, atributos, namespaces, CDATA e entidades padrão', () => {
    const root = parseXml(`<?xml version="1.0"?><!-- c --><a:r xmlns:a="x" id='1'><b>x &amp; y &#65;&#x42;</b><c/><d><![CDATA[<cru>]]></d></a:r>`);
    expect(root.name).toBe('r');
    expect(root.attrs.id).toBe('1');
    expect(root.children.map((c) => c.name)).toEqual(['b', 'c', 'd']);
    expect(root.children[0].text).toBe('x & y AB');
    expect(root.children[2].text).toBe('<cru>');
  });

  it.each([
    ['DTD/XXE', '<!DOCTYPE r [<!ENTITY x SYSTEM "file:///etc/passwd">]><r>&x;</r>'],
    ['entidade desconhecida', '<r>&x;</r>'],
    ['tag fora de ordem', '<r><a></r></a>'],
    ['sem fechamento', '<r><a>'],
    ['duas raízes', '<r/><s/>'],
    ['vazio', '   '],
    ['atributo sem aspas', '<r a=1/>'],
  ])('recusa %s', (_, xml) => {
    expect(() => parseXml(xml)).toThrow();
  });

  it('recusa aninhamento profundo demais', () => {
    expect(() => parseXml('<a>'.repeat(100) + '</a>'.repeat(100))).toThrow(/aninhado/);
  });
});

describe('parseNfe', () => {
  it('valida o dígito verificador da chave', () => {
    const key = withCheckDigit('3526111234567800019955001000001234100001234');
    expect(accessKeyIsValid(key)).toBe(true);
    expect(accessKeyIsValid(key.slice(0, 43) + ((Number(key[43]) + 1) % 10))).toBe(false);
    expect(accessKeyIsValid('123')).toBe(false);
  });

  it('extrai cabeçalho, itens, desconto, lote e validade', () => {
    const nfe = parseNfe(buildNfeXml());
    expect(nfe.accessKey).toHaveLength(44);
    expect(nfe.number).toBe('1234');
    expect(nfe.supplier).toEqual({ document: '12345678000199', name: 'Distribuidora Pet Ltda', tradeName: 'PetDist' });
    expect(nfe.recipientDocument).toBe('11222333000181');
    expect(nfe.totalCents).toBe(40000);
    expect(nfe.authorized).toBe(true);
    expect(nfe.warnings).toEqual([]);
    expect(nfe.items).toHaveLength(2);
    expect(nfe.items[0]).toMatchObject({ nItem: 1, code: 'RAC-01', ean: '7891000100103', quantity: 2, totalCents: 30000, unitCost: 150 });
    expect(nfe.items[1]).toMatchObject({ ean: null, name: 'Vermífugo & antipulgas', unit: 'CX', totalCents: 10000, unitCost: 100 });
    expect(nfe.items[1].lots).toEqual([{ code: 'L123', quantity: 1, expiresAt: '2027-06-30T12:00:00.000Z', manufacturedAt: '2026-01-01T12:00:00.000Z' }]);
  });

  it.each([
    ['NFC-e', { model: '65' }, /NFC-e/],
    ['homologação', { tpAmb: '2' }, /homologação/],
    ['chave inválida', { key: '3526111234567800019955001000001234100001230'.slice(0, 43) + 'X' }, /Chave/],
  ])('recusa %s', (_, options, message) => {
    expect(() => parseNfe(buildNfeXml(options as any))).toThrow(message);
  });

  it('avisa quando a nota não está autorizada', () => {
    const nfe = parseNfe(buildNfeXml({ cStat: '110' }));
    expect(nfe.authorized).toBe(false);
    expect(nfe.warnings[0]).toMatch(/pode não estar autorizada/);
  });

  it('recusa arquivo que não é NF-e', () => {
    expect(() => parseNfe('<html><body/></html>')).toThrow(/não é o XML de uma NF-e/);
  });
});

import { splitLots, stockQuantity } from '../services/purchaseInvoice.service';

describe('conversão para o estoque', () => {
  const base = { nItem: 1, code: 'X', ean: null, name: 'X', ncm: null, cfop: null, unit: 'CX', totalCents: 1000, unitCost: 10, anvisa: null };
  it('multiplica pela embalagem e exige inteiro', () => {
    expect(stockQuantity({ nItem: 1, quantity: 2 }, 12)).toBe(24);
    expect(stockQuantity({ nItem: 1, quantity: 0.5 }, 12)).toBe(6);
    expect(() => stockQuantity({ nItem: 1, quantity: 1.5 }, 1)).toThrow(/número inteiro/);
  });
  it('usa os lotes da nota quando a soma bate', () => {
    const r = splitLots({ ...base, quantity: 3, lots: [{ code: 'A', quantity: 1, expiresAt: '2027-01-01T12:00:00.000Z', manufacturedAt: null }, { code: 'B', quantity: 2, expiresAt: null, manufacturedAt: null }] }, 10, '55');
    expect(r.parts).toEqual([{ code: 'A', quantity: 10, expiresAt: '2027-01-01T12:00:00.000Z' }, { code: 'B', quantity: 20, expiresAt: null }]);
    expect(r.note).toBeNull();
  });
  it('sem lote usa NF-<número>; soma errada vai para o primeiro lote com aviso', () => {
    expect(splitLots({ ...base, quantity: 2, lots: [] }, 1, '55').parts).toEqual([{ code: 'NF-55', quantity: 2, expiresAt: null }]);
    const r = splitLots({ ...base, quantity: 5, lots: [{ code: 'A', quantity: 1, expiresAt: null, manufacturedAt: null }] }, 1, '55');
    expect(r.parts).toEqual([{ code: 'A', quantity: 5, expiresAt: null }]);
    expect(r.note).toMatch(/primeiro lote/);
  });
});
