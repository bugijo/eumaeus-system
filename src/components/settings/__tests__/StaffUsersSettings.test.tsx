import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import StaffUsersSettings from '../StaffUsersSettings';
import { useCreateStaffUser, useMyAccess, useResetStaffPassword, useStaffRoles, useStaffUsers, useUpdateStaffUser } from '@/api/userApi';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/api/userApi', async (importOriginal) => {
  const actual: any = await importOriginal();
  return { ...actual, useStaffUsers: vi.fn(), useStaffRoles: vi.fn(), useCreateStaffUser: vi.fn(), useUpdateStaffUser: vi.fn(), useResetStaffPassword: vi.fn(), useMyAccess: vi.fn() };
});

describe('Equipe e acessos', () => {
  const create = vi.fn().mockResolvedValue({});
  const update = vi.fn().mockResolvedValue({});
  beforeEach(() => {
    vi.mocked(useStaffUsers).mockReturnValue({ data: [
      { id: 1, name: 'Dona Ana', email: 'ana@x.com', role: 'DONO', active: true, createdAt: '' },
      { id: 2, name: 'Bia Recepção', email: 'bia@x.com', role: 'RECEPCAO', active: true, createdAt: '' },
    ], isLoading: false, error: null } as any);
    vi.mocked(useStaffRoles).mockReturnValue({ data: [
      { name: 'RECEPCAO', description: 'Agenda e caixa', defaultPermissions: ['agenda', 'caixa'] },
    ] } as any);
    // Plano Pet Shop: prontuário fica fora do plano
    vi.mocked(useMyAccess).mockReturnValue({ data: {
      plan: 'PETSHOP', planPermissions: ['agenda', 'caixa', 'estoque_movimentar'],
      catalog: [
        { key: 'agenda', label: 'Agenda', description: '', group: 'Dia a dia' },
        { key: 'caixa', label: 'Caixa', description: '', group: 'Dia a dia' },
        { key: 'atendimento', label: 'Prontuários, receitas e vacinas', description: '', group: 'Clínica' },
        { key: 'estoque_movimentar', label: 'Dar entrada e ajustar estoque', description: '', group: 'Estoque' },
      ],
    } } as any);
    vi.mocked(useCreateStaffUser).mockReturnValue({ mutateAsync: create, isPending: false } as any);
    vi.mocked(useUpdateStaffUser).mockReturnValue({ mutateAsync: update, isPending: false } as any);
    vi.mocked(useResetStaffPassword).mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as any);
  });

  it('lista a equipe real e bloqueia alterar o próprio acesso', () => {
    render(<StaffUsersSettings currentUserId={1} />);
    expect(screen.getByText('Bia Recepção')).toBeInTheDocument();
    expect(screen.getByLabelText('Cargo de Dona Ana')).toBeDisabled();
    expect(screen.getByLabelText('Cargo de Bia Recepção')).toBeEnabled();
  });

  it('muda cargo e cria novo acesso', async () => {
    const user = userEvent.setup();
    render(<StaffUsersSettings currentUserId={1} />);
    await user.selectOptions(screen.getByLabelText('Cargo de Bia Recepção'), 'FINANCEIRO');
    expect(update).toHaveBeenCalledWith({ id: 2, role: 'FINANCEIRO' });
    await user.click(screen.getByRole('button', { name: /Novo acesso/ }));
    await user.type(screen.getByLabelText('Nome'), 'Caio');
    await user.type(screen.getByLabelText('E-mail'), 'caio@x.com');
    await user.selectOptions(screen.getByLabelText('Cargo'), 'VETERINARIO');
    await user.type(screen.getByLabelText('Senha inicial'), 'Cavalo7Azul9');
    await user.click(screen.getByRole('button', { name: 'Criar acesso' }));
    expect(create).toHaveBeenCalledWith({ name: 'Caio', email: 'caio@x.com', role: 'VETERINARIO', password: 'Cavalo7Azul9' });
  });

  it('dono escolhe os módulos da recepção; o que está fora do plano fica travado', async () => {
    const user = userEvent.setup();
    render(<StaffUsersSettings currentUserId={1} />);
    expect(screen.getByText('Acesso total')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Padrão do cargo/ }));
    expect(screen.getByRole('checkbox', { name: /Agenda/ })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /Prontuários/ })).toBeDisabled();
    await user.click(screen.getByRole('checkbox', { name: /Agenda/ }));
    await user.click(screen.getByRole('checkbox', { name: /Dar entrada/ }));
    await user.click(screen.getByRole('button', { name: 'Salvar acessos' }));
    expect(update).toHaveBeenCalledWith({ id: 2, permissions: ['caixa', 'estoque_movimentar'] });
  });
});
