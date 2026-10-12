import ClinicSettingsController from '../controllers/clinicSettingsController';
import { clinicSettingsService } from '../services/clinicSettingsService';

jest.mock('../services/clinicSettingsService', () => ({
  clinicSettingsService: {
    getSettings: jest.fn(),
  },
}));

const response = () => {
  const res = {
    status: jest.fn(),
    json: jest.fn(),
  } as any;
  res.status.mockReturnValue(res);
  return res;
};

describe('clinic settings tenant context', () => {
  beforeEach(() => jest.clearAllMocks());

  it('ignores a client-supplied clinicId and uses the signed token context', async () => {
    (clinicSettingsService.getSettings as jest.Mock).mockResolvedValue({ clinicId: 7 });
    const res = response();

    await ClinicSettingsController.getSettings({
      query: { clinicId: '999' },
      user: { id: 10, type: 'user', role: 'DONO', clinicId: 7 },
    } as any, res);

    expect(clinicSettingsService.getSettings).toHaveBeenCalledWith(7);
    expect(clinicSettingsService.getSettings).not.toHaveBeenCalledWith(999);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('fails closed when a legacy token has no clinic context', async () => {
    const res = response();

    await ClinicSettingsController.getSettings({
      query: { clinicId: '1' },
      user: { id: 10, type: 'user', role: 'DONO' },
    } as any, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(clinicSettingsService.getSettings).not.toHaveBeenCalled();
  });
});
