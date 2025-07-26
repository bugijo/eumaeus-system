import { Router } from 'express';
import ClinicSettingsController from '../controllers/clinicSettingsController';

const router = Router();

// GET /api/settings/notifications - Busca configurações de notificação
router.get('/notifications', ClinicSettingsController.getSettings);

// PUT /api/settings/notifications - Atualiza configurações de notificação
router.put('/notifications', ClinicSettingsController.updateSettings);

// POST /api/settings/notifications/test - Testa configurações de e-mail
router.post('/notifications/test', ClinicSettingsController.testEmailSettings);

// POST /api/settings/notifications/reset - Reseta para configurações padrão
router.post('/notifications/reset', ClinicSettingsController.resetToDefaults);

// GET /api/settings/notifications/stats - Estatísticas de lembretes
router.get('/notifications/stats', ClinicSettingsController.getReminderStats);

// GET /api/settings/notifications/template-variables - Variáveis disponíveis para templates
router.get('/notifications/template-variables', ClinicSettingsController.getTemplateVariables);

export { router as clinicSettingsRoutes };
export default router;