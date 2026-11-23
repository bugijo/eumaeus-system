import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import LandingPage from '../LandingPage';
import { DOWNLOAD_ITEMS } from '@/components/downloads/DownloadsSection';
import { SplitDemo } from '@/components/landing/SplitDemo';

describe('Página de venda', () => {
  it('leva o visitante para o login e mostra os aplicativos', () => {
    render(<MemoryRouter><LandingPage /></MemoryRouter>);
    expect(screen.getAllByRole('link', { name: /Entrar/ })[0]).toHaveAttribute('href', '/login');
    expect(screen.getByRole('heading', { name: 'Aplicativos' })).toBeInTheDocument();
  });

  it('não publica link de download antes do instalador existir', () => {
    const available = DOWNLOAD_ITEMS.filter((item) => item.status === 'disponivel');
    const withHref = DOWNLOAD_ITEMS.filter((item) => item.href);
    expect(available.map((item) => item.title)).toEqual(['Navegador (todos os aparelhos)']);
    expect(withHref).toHaveLength(1);
    expect(DOWNLOAD_ITEMS.filter((item) => item.status === 'em-breve').every((item) => !item.href)).toBe(true);
  });

  it('divide a conta de exemplo pela regra escolhida, em centavos', () => {
    render(<SplitDemo />);
    expect(screen.getByText('R$ 220,00')).toBeInTheDocument();
    expect(screen.getByText('R$ 660,00')).toBeInTheDocument();
    fireEvent.change(screen.getByRole('slider', { name: /Parte da clínica/ }), { target: { value: '35' } });
    expect(screen.getByText('R$ 308,00')).toBeInTheDocument();
    expect(screen.getByText('R$ 572,00')).toBeInTheDocument();
  });
});
