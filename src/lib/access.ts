/**
 * Espelho, no frontend, das permissões por módulo do backend (backend/src/access/permissions.ts).
 * Aqui só decide o que aparece no menu e qual tela abre; quem barra de verdade é a API.
 */
export type PermissionKey =
  | 'agenda' | 'cadastros' | 'atendimento' | 'internacao' | 'especialistas'
  | 'estoque_ver' | 'estoque_movimentar' | 'caixa' | 'caixa_cancelar'
  | 'financeiro' | 'lembretes' | 'pacotes' | 'configuracoes';

export type PlanKey = 'CLINICA' | 'PETSHOP' | 'CLINICA_PETSHOP';

export interface MyAccess {
  plan: PlanKey;
  planLabel: string;
  units: 1 | 2;
  separateUnits: boolean;
  role: string;
  customized: boolean;
  permissions: PermissionKey[];
  planPermissions: PermissionKey[];
  catalog: Array<{ key: PermissionKey; label: string; description: string; group: string }>;
}

// Primeira regra que casar vale. null = qualquer funcionário logado.
const PATH_RULES: Array<{ pattern: RegExp; anyOf: PermissionKey[] | null }> = [
  { pattern: /^\/$/, anyOf: null },
  { pattern: /^\/configuracoes/, anyOf: null },
  { pattern: /^\/agendamentos/, anyOf: ['agenda'] },
  { pattern: /^\/caixa/, anyOf: ['caixa'] },
  { pattern: /^\/pets\/[^/]+\/prontuario/, anyOf: ['atendimento'] },
  { pattern: /^\/prontuario/, anyOf: ['atendimento'] },
  { pattern: /^\/(tutores|pets)/, anyOf: ['cadastros', 'atendimento', 'agenda'] },
  { pattern: /^\/assistencia/, anyOf: ['internacao'] },
  { pattern: /^\/especialistas/, anyOf: ['especialistas'] },
  { pattern: /^\/estoque\/(novo|editar)/, anyOf: ['estoque_movimentar'] },
  { pattern: /^\/estoque/, anyOf: ['estoque_ver', 'estoque_movimentar'] },
  { pattern: /^\/(financeiro|invoices)/, anyOf: ['financeiro'] },
  { pattern: /^\/operacao/, anyOf: ['pacotes', 'agenda'] },
];

export function canAccessPath(path: string, permissions: readonly PermissionKey[] | undefined): boolean {
  const rule = PATH_RULES.find((item) => item.pattern.test(path));
  if (!rule || rule.anyOf === null) return true;
  if (!permissions) return true; // ainda carregando: a API continua barrando
  return rule.anyOf.some((key) => permissions.includes(key));
}

export const hasPermission = (access: MyAccess | undefined, key: PermissionKey) =>
  Boolean(access?.permissions.includes(key));
