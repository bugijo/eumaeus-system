import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import OnboardingTour from '../OnboardingTour';
import { startTour, tourDoneKey } from '../tourEvents';

afterEach(() => vi.mocked(localStorage.setItem).mockClear());

describe('OnboardingTour', () => {
  it('pula passos cujo item não está na tela e grava a conclusão', () => {
    render(<><a data-tour="nav-/caixa">Caixa</a><button data-tour="help">?</button><OnboardingTour userId={7} autoStart={false} /></>);
    act(() => startTour());
    // Introdução + Caixa + Ajuda: os demais módulos não estão no menu.
    expect(screen.getByText('1 de 3')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Próximo' }));
    expect(screen.getByRole('heading', { name: 'Caixa' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Próximo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Concluir' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(localStorage.setItem).toHaveBeenCalledWith(tourDoneKey(7), '1');
  });

  it('Pular fecha e não volta sozinho', () => {
    render(<OnboardingTour userId={8} autoStart={false} />);
    act(() => startTour());
    fireEvent.click(screen.getByRole('button', { name: 'Pular' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(localStorage.setItem).toHaveBeenCalledWith(tourDoneKey(8), '1');
  });
});
