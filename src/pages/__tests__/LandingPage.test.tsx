import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import LandingPage from '../LandingPage';
import { DOWNLOAD_ITEMS } from '@/components/downloads/DownloadsSection';

describe('Página de venda', () => {
  it('leva o visitante para o login e mostra os aplicativos', () => {
    render(<MemoryRouter><LandingPage /></MemoryRouter>);
    expect(screen.getAllByRole('link', { name: /Entrar/ })[0]).toHaveAttribute('href', '/login');
    expect(screen.getByRole('heading', { name: 'Aplicativos' })).toBeInTheDocument();
  });

  it('só publica link de download para instalador que existe no release', () => {
    const available = DOWNLOAD_ITEMS.filter((item) => item.status === 'disponivel');
    expect(available.map((item) => item.title)).toEqual(['Navegador (todos os aparelhos)', 'Windows', 'macOS', 'Linux']);
    const installers = available.filter((item) => item.title !== 'Navegador (todos os aparelhos)');
    expect(installers.map((item) => item.href)).toEqual([
      'https://github.com/bugijo/eumaeus-system/releases/latest/download/Eumaeus-windows.exe',
      'https://github.com/bugijo/eumaeus-system/releases/latest/download/Eumaeus-mac.dmg',
      'https://github.com/bugijo/eumaeus-system/releases/latest/download/Eumaeus-linux.AppImage',
    ]);
    expect(DOWNLOAD_ITEMS.filter((item) => item.status === 'em-breve').every((item) => !item.href)).toBe(true);
  });

  it('os botões Contratar levam à contratação online com o plano escolhido', () => {
    render(<MemoryRouter><LandingPage /></MemoryRouter>);
    const hrefs = screen.getAllByRole('link', { name: /^Contratar/ }).map((link) => link.getAttribute('href'));
    expect(hrefs).toEqual(expect.arrayContaining(['/assinar', '/assinar?plano=PETSHOP', '/assinar?plano=CLINICA', '/assinar?plano=CLINICA_PETSHOP']));
  });

  it('mostra os três planos e as telas reais do sistema', () => {
    render(<MemoryRouter><LandingPage /></MemoryRouter>);
    for (const plan of ['Pet Shop', 'Clínica', 'Clínica + Pet Shop']) expect(screen.getByRole('heading', { level: 3, name: plan })).toBeInTheDocument();
    const shots = screen.getAllByRole('img').filter((img) => img.getAttribute('src')?.startsWith('/landing/'));
    expect(shots.length).toBeGreaterThanOrEqual(8);
    shots.forEach((img) => expect(img).toHaveAccessibleName());
  });
});
