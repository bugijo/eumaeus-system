import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import ReceitaPrintPage from '../ReceitaPrintPage';
import { prescriptionApi } from '../../api/prescriptionApi';

const navigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useParams: () => ({ id: '7' }),
  useNavigate: () => navigate,
}));

vi.mock('../../api/prescriptionApi', () => ({ prescriptionApi: { getPrescriptionById: vi.fn() } }));

describe('ReceitaPrintPage', () => {
  it('carrega dados persistidos e imprime somente após ação explícita', async () => {
    vi.mocked(prescriptionApi.getPrescriptionById).mockResolvedValue({
      id: 7,
      createdAt: '2026-10-12T12:00:00.000Z',
      updatedAt: '2026-10-12T12:00:00.000Z',
      medicalRecordId: 3,
      status: 'APPROVED',
      currentVersion: 2,
      signatureMode: 'VISUAL_ONLY',
      clinicNameSnapshot: 'Clínica Sintética',
      veterinarianNameSnapshot: 'Dra. Teste',
      tutorNameSnapshot: 'Tutor Sintético',
      petNameSnapshot: 'Pet Sintético',
      items: [{ id: 9, medication: 'TESTE', dosage: '1 unidade', frequency: '1x', duration: '1 dia' }],
      medicalRecord: { id: 3, appointment: { id: 4, pet: { id: 5, name: 'Pet Sintético', species: 'Canino', breed: 'Misto', tutor: { id: 6, name: 'Tutor Sintético' } } } },
    } as any);
    const print = vi.spyOn(window, 'print').mockImplementation(() => undefined);

    render(<ReceitaPrintPage />);
    expect(screen.getByRole('status')).toHaveTextContent('Carregando receita persistida');
    await waitFor(() => expect(screen.getByText('Clínica Sintética')).toBeInTheDocument());
    expect(screen.getByText('TESTE')).toBeInTheDocument();
    expect(screen.getByText(/não declara assinatura digital verificável/)).toBeInTheDocument();
    expect(print).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Imprimir' }));
    expect(print).toHaveBeenCalledOnce();
    print.mockRestore();
  });

  it('mostra ausência de receita sem dados fictícios', async () => {
    vi.mocked(prescriptionApi.getPrescriptionById).mockRejectedValue({ response: { data: { error: 'Receita não encontrada' } } });
    render(<ReceitaPrintPage />);
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Receita não encontrada'));
    expect(screen.queryByText('Dr. João Silva')).not.toBeInTheDocument();
  });
});
