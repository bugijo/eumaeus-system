import { beforeEach, describe, expect, it, vi } from 'vitest';
import apiClient from '../../api/apiClient';
import { MedicalRecordService } from '../medicalRecordService';

vi.mock('../../api/apiClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const recordData = {
  petId: 40,
  symptoms: 'Sintoma sintético',
  diagnosis: 'Diagnóstico sintético',
  treatment: 'Tratamento sintético',
};

describe('MedicalRecordService active contracts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses the mounted pet history route', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: [] } as any);

    await MedicalRecordService.getRecordsByPetId(40);

    expect(apiClient.get).toHaveBeenCalledWith('/records/pets/40/records');
  });

  it('uses the appointment route for the legacy form', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: { id: 60 } } as any);

    await MedicalRecordService.createRecord(30, recordData);

    expect(apiClient.post).toHaveBeenCalledWith('/records/30', recordData);
  });
});
