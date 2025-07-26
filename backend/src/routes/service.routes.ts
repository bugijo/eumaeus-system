import { Router } from 'express';
import { ServiceController } from '../controllers/service.controller';

const router = Router();

/**
 * @route GET /api/services
 * @desc Busca todos os serviços disponíveis
 * @query category - Filtrar por categoria (opcional)
 * @query search - Buscar por termo (opcional)
 * @example /api/services
 * @example /api/services?category=Consulta
 * @example /api/services?search=vacina
 */
router.get('/', ServiceController.getAllServices);

/**
 * @route GET /api/services/categories
 * @desc Retorna serviços agrupados por categoria
 * @example /api/services/categories
 */
router.get('/categories', ServiceController.getServicesByCategory);

/**
 * @route GET /api/services/:id
 * @desc Busca um serviço específico por ID
 * @param id - ID do serviço
 * @example /api/services/1
 */
router.get('/:id', ServiceController.getServiceById);

export default router;