/**
 * Controle de acesso por módulo.
 *
 * Três camadas, nesta ordem:
 *  1. o plano contratado pelo estabelecimento libera um conjunto de módulos;
 *  2. o cargo do funcionário traz um padrão de permissões;
 *  3. o dono pode trocar esse padrão por uma lista própria para cada funcionário.
 * O dono sempre tem todos os módulos do plano.
 */

export const PERMISSIONS = [
  'agenda',
  'cadastros',
  'atendimento',
  'internacao',
  'especialistas',
  'estoque_ver',
  'estoque_movimentar',
  'caixa',
  'caixa_cancelar',
  'financeiro',
  'lembretes',
  'pacotes',
  'configuracoes',
] as const;
export type PermissionKey = (typeof PERMISSIONS)[number];

export const PERMISSION_INFO: Record<PermissionKey, { label: string; description: string; group: string }> = {
  agenda: { label: 'Agenda', description: 'Ver e marcar consultas, banho e tosa e retornos.', group: 'Dia a dia' },
  cadastros: { label: 'Tutores e pets', description: 'Cadastrar e editar tutores e pets.', group: 'Dia a dia' },
  caixa: { label: 'Caixa', description: 'Vender produtos e serviços e receber pagamentos.', group: 'Dia a dia' },
  caixa_cancelar: { label: 'Cancelar vendas', description: 'Cancelar uma venda já finalizada.', group: 'Dia a dia' },
  atendimento: { label: 'Prontuários, receitas e vacinas', description: 'Registrar atendimentos, medicamentos aplicados, receitas e vacinas.', group: 'Clínica' },
  internacao: { label: 'Internação e cirurgia', description: 'Internações, tarefas, cirurgias e termos.', group: 'Clínica' },
  especialistas: { label: 'Especialistas', description: 'Agenda e encaminhamento para especialistas.', group: 'Clínica' },
  estoque_ver: { label: 'Ver estoque', description: 'Consultar produtos, saldo e validade.', group: 'Estoque' },
  estoque_movimentar: { label: 'Dar entrada e ajustar estoque', description: 'Cadastrar produtos, receber mercadoria e corrigir saldo.', group: 'Estoque' },
  financeiro: { label: 'Financeiro', description: 'Receitas, despesas, contas e relatório do contador.', group: 'Gestão' },
  lembretes: { label: 'Lembretes', description: 'Lembretes de consulta e vacina para os tutores.', group: 'Gestão' },
  pacotes: { label: 'Pacotes de serviço', description: 'Pacotes de banho e outros serviços recorrentes.', group: 'Gestão' },
  configuracoes: { label: 'Configurações', description: 'Dados do estabelecimento, serviços e lembretes.', group: 'Gestão' },
};

export const PLANS = ['CLINICA', 'PETSHOP', 'CLINICA_PETSHOP'] as const;
export type PlanKey = (typeof PLANS)[number];

const CLINIC_ONLY: PermissionKey[] = ['atendimento', 'internacao', 'especialistas'];

export const PLAN_INFO: Record<PlanKey, { label: string; permissions: readonly PermissionKey[]; units: 1 | 2 }> = {
  CLINICA: { label: 'Clínica', permissions: PERMISSIONS, units: 1 },
  PETSHOP: { label: 'Pet Shop', permissions: PERMISSIONS.filter((key) => !CLINIC_ONLY.includes(key)), units: 1 },
  CLINICA_PETSHOP: { label: 'Clínica + Pet Shop', permissions: PERMISSIONS, units: 2 },
};

export const DEFAULT_PLAN: PlanKey = 'CLINICA_PETSHOP';

export const STAFF_ROLES = ['DONO', 'VETERINARIO', 'RECEPCAO', 'AUXILIAR', 'BANHO_TOSA', 'FINANCEIRO'] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

/** Padrão de cada cargo. O dono pode trocar por funcionário. */
export const ROLE_DEFAULTS: Record<StaffRole, readonly PermissionKey[]> = {
  DONO: PERMISSIONS,
  VETERINARIO: ['agenda', 'cadastros', 'atendimento', 'internacao', 'especialistas', 'estoque_ver', 'estoque_movimentar', 'caixa', 'lembretes', 'pacotes'],
  RECEPCAO: ['agenda', 'cadastros', 'caixa', 'estoque_ver', 'estoque_movimentar', 'lembretes', 'pacotes'],
  AUXILIAR: ['agenda', 'atendimento', 'internacao', 'estoque_ver', 'caixa'],
  BANHO_TOSA: ['agenda', 'estoque_ver', 'caixa'],
  FINANCEIRO: ['financeiro', 'caixa', 'caixa_cancelar', 'estoque_ver'],
};

const ROLE_ALIAS: Record<string, StaffRole> = { FUNCIONARIO: 'RECEPCAO' };

export const normalizeRole = (role: unknown): StaffRole | null => {
  const value = String(role || '').toUpperCase();
  const resolved = (ROLE_ALIAS[value] || value) as StaffRole;
  return STAFF_ROLES.includes(resolved) ? resolved : null;
};

export const normalizePlan = (plan: unknown): PlanKey => (
  PLANS.includes(String(plan || '').toUpperCase() as PlanKey) ? (String(plan).toUpperCase() as PlanKey) : DEFAULT_PLAN
);

/** Aceita só chaves conhecidas, sem repetição, na ordem da lista oficial. */
export function sanitizePermissions(input: unknown): PermissionKey[] {
  if (!Array.isArray(input)) throw new Error('Permissões devem ser uma lista');
  const wanted = new Set(input.map((item) => String(item)));
  for (const key of wanted) {
    if (!PERMISSIONS.includes(key as PermissionKey)) throw new Error(`Permissão desconhecida: ${key}`);
  }
  return PERMISSIONS.filter((key) => wanted.has(key));
}

/** Permissões efetivas: (personalizadas ou padrão do cargo) ∩ plano. Dono: tudo do plano. */
export function resolvePermissions(input: { role: unknown; custom?: unknown; plan: unknown }): PermissionKey[] {
  const role = normalizeRole(input.role);
  const plan = PLAN_INFO[normalizePlan(input.plan)];
  if (!role) return [];
  if (role === 'DONO') return [...plan.permissions];
  let base: readonly PermissionKey[] = ROLE_DEFAULTS[role];
  if (Array.isArray(input.custom)) {
    try { base = sanitizePermissions(input.custom); } catch { base = []; }
  }
  return base.filter((key) => plan.permissions.includes(key));
}

type Rule = { pattern: RegExp; read: PermissionKey[]; write: PermissionKey[] };

const any = (...keys: PermissionKey[]) => keys;
const PEOPLE_READERS = any('cadastros', 'agenda', 'atendimento', 'internacao', 'caixa', 'pacotes', 'especialistas', 'lembretes');
const STOCK_READERS = any('estoque_ver', 'estoque_movimentar', 'caixa', 'atendimento', 'internacao');

/**
 * Regras por caminho (sem o prefixo /api). A primeira que casar vale.
 * read = GET/HEAD; write = os demais métodos. Basta ter uma das chaves da lista.
 * Caminhos que não casam com nenhuma regra ficam com a checagem de cargo da própria rota.
 */
export const ROUTE_RULES: Rule[] = [
  { pattern: /^\/tutors\/[^/]+\/communication-/, read: any('lembretes', 'cadastros'), write: any('lembretes') },
  { pattern: /^\/communication(\/|$)/, read: any('lembretes'), write: any('lembretes') },
  { pattern: /^\/(tutors|pets)(\/|$)/, read: PEOPLE_READERS, write: any('cadastros') },
  { pattern: /^\/(appointments|availability)(\/|$)/, read: any('agenda'), write: any('agenda') },
  { pattern: /^\/services(\/|$)/, read: any('agenda', 'caixa', 'pacotes', 'configuracoes', 'atendimento'), write: any('configuracoes') },
  { pattern: /^\/(records|prescriptions|prescription-shares|vaccinations)(\/|$)/, read: any('atendimento'), write: any('atendimento') },
  { pattern: /^\/care(\/|$)/, read: any('internacao'), write: any('internacao') },
  { pattern: /^\/specialists(\/|$)/, read: any('especialistas', 'agenda'), write: any('especialistas') },
  { pattern: /^\/(products|inventory)(\/|$)/, read: STOCK_READERS, write: any('estoque_movimentar') },
  { pattern: /^\/sales\/[^/]+\/cancel$/, read: any('caixa_cancelar'), write: any('caixa_cancelar') },
  { pattern: /^\/sales(\/|$)/, read: any('caixa', 'financeiro'), write: any('caixa') },
  { pattern: /^\/cash(\/|$)/, read: any('caixa', 'financeiro'), write: any('caixa') },
  { pattern: /^\/financial\/centers$/, read: any('financeiro', 'caixa', 'estoque_movimentar'), write: any('financeiro') },
  { pattern: /^\/(financial|invoices)(\/|$)/, read: any('financeiro'), write: any('financeiro') },
  { pattern: /^\/packages(\/|$)/, read: any('pacotes', 'agenda'), write: any('pacotes') },
  { pattern: /^\/settings(\/|$)/, read: any('configuracoes', 'lembretes'), write: any('configuracoes') },
];

/** Chaves que liberam a requisição, ou null quando o caminho não é controlado por módulo. */
export function requiredPermissions(method: string, path: string): PermissionKey[] | null {
  // O Express roteia sem diferenciar maiúsculas: /API/TUTORS chega à mesma rota que /api/tutors.
  // Sem normalizar, a grafia em maiúsculas não casava nenhuma regra e passava sem checagem de módulo.
  const clean = (path.split('?')[0].replace(/\/+$/, '') || '/').toLowerCase();
  const rule = ROUTE_RULES.find((item) => item.pattern.test(clean));
  if (!rule) return null;
  return ['GET', 'HEAD'].includes(method.toUpperCase()) ? rule.read : rule.write;
}
