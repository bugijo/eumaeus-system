import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import OperacaoPage from '../OperacaoPage';
import apiClient from '@/api/apiClient';
import { serviceApi } from '@/api/serviceApi';

vi.mock('@/api/apiClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

vi.mock('@/api/serviceApi', () => ({
  serviceApi: { getAllServices: vi.fn() },
}));

const get = vi.mocked(apiClient.get);
const post = vi.mocked(apiClient.post);
const getAllServices = vi.mocked(serviceApi.getAllServices);

describe('OperacaoPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAllServices.mockResolvedValue([
      { id: '15', name: 'Banho', description: '', duration: 60, price: 80, category: 'PETSHOP', isActive: true },
    ]);
    get.mockImplementation(async (url: string) => {
      if (url === '/packages') return { data: { data: [{ id: 22, name: 'Pacote Banho', price: '200', totalSessions: 3, validityDays: 30 }] } } as never;
      if (url === '/tutors') return { data: { data: [{ id: 7, name: 'Tutor QA', email: 'qa@example.invalid' }] } } as never;
      if (url === '/appointments') return { data: [{ id: 41, appointmentDate: '2026-10-15T12:00:00.000Z', status: 'SCHEDULED', petId: 9, tutorId: 7, services: [{ id: 15, name: 'Banho', price: 80 }] }] } as never;
      if (url === '/tutors/7/pets') return { data: [{ id: 9, name: 'Pet QA', species: 'Cão', tutorId: 7 }] } as never;
      if (url === '/packages/contracts/101') return { data: { data: { id: 101, contractedPrice: '200', totalSessions: 3, remainingSessions: 3, expiresAt: '2026-11-15T00:00:00.000Z', package: { id: 22, name: 'Pacote Banho', price: '200', totalSessions: 3, validityDays: 30 }, sessions: [] } } } as never;
      return { data: { data: [] } } as never;
    });
    post.mockResolvedValue({ data: { data: { id: 101 } } } as never);
  });

  it('seleciona tutor, pet e pacote sem exigir IDs digitados', async () => {
    render(<OperacaoPage />);

    await waitFor(() => expect(screen.getByRole('option', { name: /Tutor QA/ })).toBeInTheDocument());
    fireEvent.change(screen.getByRole('combobox', { name: 'Tutor da operação' }), { target: { value: '7' } });
    await waitFor(() => expect(screen.getByRole('option', { name: /Pet QA/ })).toBeInTheDocument());
    fireEvent.change(screen.getByRole('combobox', { name: 'Pet do tutor' }), { target: { value: '9' } });
    fireEvent.click(screen.getByRole('button', { name: 'Selecionar' }));

    expect(screen.getByText('Pet selecionado: Pet QA')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Contratar pacote selecionado' })).toBeEnabled();
  });

  it('oferece atendimento e serviço vinculados ao pet selecionado para consumo', async () => {
    render(<OperacaoPage />);

    await waitFor(() => expect(screen.getByRole('option', { name: /Tutor QA/ })).toBeInTheDocument());
    fireEvent.change(screen.getByRole('combobox', { name: 'Tutor da operação' }), { target: { value: '7' } });
    await waitFor(() => expect(screen.getByRole('option', { name: /Pet QA/ })).toBeInTheDocument());
    fireEvent.change(screen.getByRole('combobox', { name: 'Pet do tutor' }), { target: { value: '9' } });
    await waitFor(() => expect(screen.getByRole('option', { name: /SCHEDULED/ })).toBeInTheDocument());
    fireEvent.change(screen.getByRole('combobox', { name: 'Atendimento para consumo' }), { target: { value: '41' } });
    fireEvent.click(screen.getByRole('button', { name: 'Selecionar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Contratar pacote selecionado' }));

    await waitFor(() => expect(screen.getByRole('option', { name: /Banho · R\$ 80/ })).toBeInTheDocument());
  });
});
