/**
 * Leitor de XML pequeno e estrito para documentos fiscais (NF-e).
 *
 * Por que não uma biblioteca: a NF-e é XML gerado por máquina, sem DTD, e só precisamos de elementos,
 * atributos e texto. Este leitor não resolve entidades externas nem DTD (recusa <!DOCTYPE>/<!ENTITY>),
 * o que elimina XXE e "bomba de entidades", e tem limites de tamanho, profundidade e número de nós.
 */
export interface XmlNode { name: string; attrs: Record<string, string>; children: XmlNode[]; text: string }

export const XML_LIMITS = { maxBytes: 3_000_000, maxDepth: 64, maxNodes: 200_000 };

export class XmlError extends Error {}

const PREDEFINED: Record<string, string> = { lt: '<', gt: '>', amp: '&', quot: '"', apos: "'" };

function decode(raw: string): string {
  if (!raw.includes('&')) return raw;
  return raw.replace(/&([^;\s&]{1,10});/g, (_, entity: string) => {
    if (entity[0] === '#') {
      const code = entity[1] === 'x' || entity[1] === 'X' ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
      if (!Number.isInteger(code) || code < 0 || code > 0x10ffff) throw new XmlError('Referência de caractere inválida');
      return String.fromCodePoint(code);
    }
    const value = PREDEFINED[entity];
    if (value === undefined) throw new XmlError(`Entidade não suportada: &${entity};`);
    return value;
  });
}

const localName = (qualified: string) => qualified.slice(qualified.indexOf(':') + 1);
const NAME = /^[A-Za-z_][\w.\-:]*/;

export function parseXml(input: string): XmlNode {
  if (typeof input !== 'string' || !input.trim()) throw new XmlError('Arquivo vazio');
  if (input.length > XML_LIMITS.maxBytes) throw new XmlError('Arquivo grande demais');
  const xml = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input;
  const root: XmlNode = { name: '#document', attrs: {}, children: [], text: '' };
  const stack: XmlNode[] = [root];
  let nodes = 0;
  let i = 0;

  const until = (token: string, from: number, what: string) => {
    const end = xml.indexOf(token, from);
    if (end < 0) throw new XmlError(`${what} sem fechamento`);
    return end;
  };

  while (i < xml.length) {
    const lt = xml.indexOf('<', i);
    const textEnd = lt < 0 ? xml.length : lt;
    if (textEnd > i) {
      const text = xml.slice(i, textEnd);
      if (stack.length === 1) { if (text.trim()) throw new XmlError('Texto fora do elemento raiz'); }
      else stack[stack.length - 1].text += decode(text);
    }
    if (lt < 0) break;
    i = lt;

    if (xml.startsWith('<?', i)) { i = until('?>', i + 2, 'Instrução') + 2; continue; }
    if (xml.startsWith('<!--', i)) { i = until('-->', i + 4, 'Comentário') + 3; continue; }
    if (xml.startsWith('<![CDATA[', i)) {
      const end = until(']]>', i + 9, 'CDATA');
      if (stack.length === 1) throw new XmlError('CDATA fora do elemento raiz');
      stack[stack.length - 1].text += xml.slice(i + 9, end);
      i = end + 3;
      continue;
    }
    if (xml.startsWith('<!', i)) throw new XmlError('XML com DTD ou entidades não é aceito');

    if (xml.startsWith('</', i)) {
      const end = until('>', i + 2, 'Tag');
      const name = xml.slice(i + 2, end).trim();
      const open = stack.pop();
      if (!open || open === root || open.name !== localName(name)) throw new XmlError(`Tag </${name}> fora de ordem`);
      i = end + 1;
      continue;
    }

    // Tag de abertura: acha o '>' respeitando aspas dos atributos.
    let j = i + 1;
    let quote = '';
    for (; j < xml.length; j += 1) {
      const c = xml[j];
      if (quote) { if (c === quote) quote = ''; }
      else if (c === '"' || c === "'") quote = c;
      else if (c === '>') break;
      else if (c === '<') throw new XmlError('Tag malformada');
    }
    if (j >= xml.length) throw new XmlError('Tag sem fechamento');
    let body = xml.slice(i + 1, j);
    const selfClosing = body.endsWith('/');
    if (selfClosing) body = body.slice(0, -1);
    const nameMatch = NAME.exec(body);
    if (!nameMatch) throw new XmlError('Nome de tag inválido');
    const node: XmlNode = { name: localName(nameMatch[0]), attrs: {}, children: [], text: '' };
    const attrText = body.slice(nameMatch[0].length);
    const attrPattern = /\s+([A-Za-z_][\w.\-:]*)\s*=\s*("([^"]*)"|'([^']*)')/gy;
    let consumed = 0;
    let match: RegExpExecArray | null;
    while ((match = attrPattern.exec(attrText))) {
      node.attrs[localName(match[1])] = decode(match[3] ?? match[4] ?? '');
      consumed = attrPattern.lastIndex;
    }
    if (attrText.slice(consumed).trim()) throw new XmlError(`Atributos inválidos em <${node.name}>`);

    if (stack.length === 1 && root.children.length) throw new XmlError('Mais de um elemento raiz');
    if (++nodes > XML_LIMITS.maxNodes) throw new XmlError('XML com elementos demais');
    stack[stack.length - 1].children.push(node);
    if (!selfClosing) {
      stack.push(node);
      if (stack.length - 1 > XML_LIMITS.maxDepth) throw new XmlError('XML aninhado demais');
    }
    i = j + 1;
  }
  if (stack.length !== 1) throw new XmlError(`Tag <${stack[stack.length - 1].name}> sem fechamento`);
  if (!root.children.length) throw new XmlError('XML sem elemento raiz');
  return root.children[0];
}

export const child = (node: XmlNode | undefined, name: string) => node?.children.find((c) => c.name === name);
export const childrenNamed = (node: XmlNode | undefined, name: string) => node?.children.filter((c) => c.name === name) ?? [];
export const textOf = (node: XmlNode | undefined, ...path: string[]) => {
  let current = node;
  for (const name of path) current = child(current, name);
  const value = current?.text.trim();
  return value ? value : undefined;
};
export function findFirst(node: XmlNode, name: string): XmlNode | undefined {
  if (node.name === name) return node;
  for (const c of node.children) { const found = findFirst(c, name); if (found) return found; }
  return undefined;
}
