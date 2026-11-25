import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/api/signupApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/signupApi')>();
  return {
    ...actual,
    signupApi: {
      status: vi.fn().mockResolvedValue({
        status: 'PAID', plan: 'PETSHOP', planName: 'Pet Shop', amountCents: 7900, contactEmail: 'dono@exemplo.com.br',
      }),
      complete: vi.fn().mockResolvedValue({ email: 'dono@exemplo.com.br', requiresEmailVerification: false }),
    },
  };
});

import ContratacaoRetornoPage from '../ContratacaoRetornoPage';
import { rememberCheckoutToken } from '@/api/signupApi';

const CHECKOUT = '5a90db81-369a-45c2-be1c-616db333194b';

describe('ContratacaoRetornoPage', () => {
  const store = new Map<string, string>();
  beforeEach(() => {
    store.clear();
    vi.mocked(localStorage.getItem).mockImplementation((k: string) => store.get(k) ?? null);
    vi.mocked(localStorage.setItem).mockImplementation((k: string, v: string) => { store.set(k, v); });
    vi.mocked(localStorage.removeItem).mockImplementation((k: string) => { store.delete(k); });
  });

  it('mostra "Conta criada" depois do cadastro mesmo com o token vindo do navegador', async () => {
    rememberCheckoutToken(CHECKOUT, 'token-local-de-teste-0123456789');
    render(
      <MemoryRouter initialEntries={[`/assinar/retorno?checkout=${CHECKOUT}`]}>
        <ContratacaoRetornoPage />
      </MemoryRouter>,
    );

    await screen.findByText('Crie a conta do estabelecimento');
    fireEvent.change(screen.getByLabelText('Nome do estabelecimento'), { target: { value: 'Pet Teste' } });
    fireEvent.change(screen.getByLabelText('Seu nome'), { target: { value: 'Dono Teste' } });
    fireEvent.change(screen.getByLabelText(/^Senha/), { target: { value: 'senhaTeste123' } });
    fireEvent.change(screen.getByLabelText('Repita a senha'), { target: { value: 'senhaTeste123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Criar conta' }));

    await waitFor(() => expect(screen.getByText('Conta criada')).toBeInTheDocument());
    expect(screen.queryByText('Link incompleto')).not.toBeInTheDocument();
    expect(store.size).toBe(0);
  });
});
