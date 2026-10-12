import { Router } from 'express';
import { AvailabilityController } from '../controllers/availability.controller';
import { requireRoles, ROLE } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @route GET /api/availability
 * @desc Busca horários disponíveis para um mês/ano específico
 * @query year - Ano (obrigatório)
 * @query month - Mês de 1-12 (obrigatório)
 * @query serviceType - Tipo de serviço (opcional)
 * @example /api/availability?year=2025&month=1
 * @example /api/availability?year=2025&month=2&serviceType=Consulta
 */
router.get('/', requireRoles(ROLE.DONO, ROLE.VETERINARIO, ROLE.RECEPCAO, ROLE.AUXILIAR), AvailabilityController.getAvailability);

/**
 * @route GET /api/availability/check
 * @desc Verifica se um horário específico está disponível
 * @query date - Data no formato YYYY-MM-DD (obrigatório)
 * @query time - Hora no formato HH:mm (obrigatório)
 * @example /api/availability/check?date=2025-01-15&time=09:00
 */
router.get('/check', requireRoles(ROLE.DONO, ROLE.VETERINARIO, ROLE.RECEPCAO, ROLE.AUXILIAR), AvailabilityController.checkSlotAvailability);

export default router;
