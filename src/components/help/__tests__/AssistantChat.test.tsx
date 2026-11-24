import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AssistantChat from '../AssistantChat';

const state = { enabled: true, mutate: vi.fn() };
vi.mock('@/api/helpApi', () => ({
  useAssistantStatus: () => ({ data: { enabled: state.enabled } }),
  useAskAssistant: () => ({ mutate: state.mutate, isPending: false }),
}));

const renderChat = () => render(<MemoryRouter initialEntries={['/caixa']}><AssistantChat /></MemoryRouter>);

describe('AssistantChat', () => {
  beforeEach(() => { state.enabled = true; state.mutate = vi.fn(); });

  it('avisa quando o assistente não está ativado', () => {
    state.enabled = false;
    renderChat();
    expect(screen.getByText(/ainda não foi ativado/)).toBeInTheDocument();
  });

  it('envia a pergunta com a tela aberta e mostra a resposta', () => {
    state.mutate = vi.fn((input, opts) => opts.onSuccess({ answer: 'Clique em Cancelar.', remaining: 10 }));
    renderChat();
    fireEvent.change(screen.getByLabelText('Sua pergunta'), { target: { value: 'como cancelo?' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar pergunta' }));
    expect(state.mutate.mock.calls[0][0]).toEqual({ messages: [{ role: 'user', content: 'como cancelo?' }], path: '/caixa' });
    expect(screen.getByText('como cancelo?')).toBeInTheDocument();
    expect(screen.getByText('Clique em Cancelar.')).toBeInTheDocument();
  });

  it('em erro, mostra a mensagem e devolve a pergunta ao campo', () => {
    state.mutate = vi.fn((input, opts) => opts.onError({ response: { data: { error: 'Limite diário atingido.' } } }));
    renderChat();
    fireEvent.change(screen.getByLabelText('Sua pergunta'), { target: { value: 'oi' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar pergunta' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Limite diário atingido.');
    expect(screen.getByLabelText('Sua pergunta')).toHaveValue('oi');
  });
});
