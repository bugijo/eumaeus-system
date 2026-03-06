import { Router } from 'express';
import ClinicSettingsController from '../controllers/clinicSettingsController';
import { authenticateUser, requireRoles, ROLE } from '../middlewares/auth.middleware';

const router = Router();
router.use(authenticateUser);
const canManageSettings = requireRoles(ROLE.DONO, ROLE.VETERINARIO);

// GET /api/settings/notifications - Busca configurações de notificação
router.get('/notifications', canManageSettings, ClinicSettingsController.getSettings);

// PUT /api/settings/notifications - Atualiza configurações de notificação
router.put('/notifications', canManageSettings, ClinicSettingsController.updateSettings);

// POST /api/settings/notifications/test - Testa configurações de e-mail
router.post('/notifications/test', canManageSettings, ClinicSettingsController.testEmailSettings);

// POST /api/settings/notifications/reset - Reseta para configurações padrão
router.post('/notifications/reset', canManageSettings, ClinicSettingsController.resetToDefaults);

// GET /api/settings/notifications/stats - Estatísticas de lembretes
router.get('/notifications/stats', canManageSettings, ClinicSettingsController.getReminderStats);

// GET /api/settings/notifications/template-variables - Variáveis disponíveis para templates
router.get('/notifications/template-variables', canManageSettings, ClinicSettingsController.getTemplateVariables);

export { router as clinicSettingsRoutes };
export default router;
