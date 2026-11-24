import { PERMISSIONS, requiredPermissions, resolvePermissions, sanitizePermissions } from '../access/permissions';

describe('Permissões por módulo', () => {
  it('dono recebe tudo o que o plano libera', () => {
    expect(resolvePermissions({ role: 'DONO', plan: 'CLINICA_PETSHOP' })).toEqual([...PERMISSIONS]);
    const petshop = resolvePermissions({ role: 'DONO', plan: 'PETSHOP' });
    expect(petshop).not.toContain('atendimento');
    expect(petshop).not.toContain('internacao');
    expect(petshop).toContain('caixa');
  });

  it('lista própria do dono substitui o padrão do cargo', () => {
    expect(resolvePermissions({ role: 'RECEPCAO', plan: 'CLINICA_PETSHOP' })).toContain('agenda');
    expect(resolvePermissions({ role: 'RECEPCAO', custom: ['caixa'], plan: 'CLINICA_PETSHOP' })).toEqual(['caixa']);
    expect(resolvePermissions({ role: 'RECEPCAO', custom: [], plan: 'CLINICA_PETSHOP' })).toEqual([]);
  });

  it('o plano corta o que foi liberado ao funcionário', () => {
    expect(resolvePermissions({ role: 'VETERINARIO', custom: ['atendimento', 'caixa'], plan: 'PETSHOP' })).toEqual(['caixa']);
  });

  it('banho e tosa vê agenda, estoque e caixa por padrão', () => {
    expect(resolvePermissions({ role: 'BANHO_TOSA', plan: 'PETSHOP' })).toEqual(['agenda', 'estoque_ver', 'caixa']);
  });

  it('cargo desconhecido não recebe nada; FUNCIONARIO vale como recepção', () => {
    expect(resolvePermissions({ role: 'ADMIN', plan: 'CLINICA' })).toEqual([]);
    expect(resolvePermissions({ role: 'FUNCIONARIO', plan: 'CLINICA' })).toContain('agenda');
  });

  it('recusa chave desconhecida e remove repetição', () => {
    expect(() => sanitizePermissions(['caixa', 'root'])).toThrow('Permissão desconhecida: root');
    expect(sanitizePermissions(['caixa', 'agenda', 'caixa'])).toEqual(['agenda', 'caixa']);
  });

  it('mapeia caminho e método para o módulo exigido', () => {
    expect(requiredPermissions('GET', '/products')).toContain('estoque_ver');
    expect(requiredPermissions('GET', '/products')).toContain('caixa');
    expect(requiredPermissions('POST', '/products')).toEqual(['estoque_movimentar']);
    expect(requiredPermissions('POST', '/inventory/receive')).toEqual(['estoque_movimentar']);
    expect(requiredPermissions('POST', '/sales')).toEqual(['caixa']);
    expect(requiredPermissions('POST', '/sales/12/cancel')).toEqual(['caixa_cancelar']);
    expect(requiredPermissions('GET', '/financial/expenses')).toEqual(['financeiro']);
    expect(requiredPermissions('GET', '/financial/centers')).toContain('caixa');
    expect(requiredPermissions('POST', '/records/3/prescriptions')).toEqual(['atendimento']);
    expect(requiredPermissions('PUT', '/settings/notifications')).toEqual(['configuracoes']);
    expect(requiredPermissions('GET', '/dashboard/stats')).toBeNull();
    expect(requiredPermissions('GET', '/users')).toBeNull();
    expect(requiredPermissions('POST', '/auth/login')).toBeNull();
  });
});
