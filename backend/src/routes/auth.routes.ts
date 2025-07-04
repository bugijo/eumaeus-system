// Em /src/routes/auth.routes.ts
import { Router } from 'express';
import authController from '../controllers/authController';

const router = Router();

// Quando uma requisição POST chegar em /login, chama a função login do controller
router.post('/login', authController.login);

// Rota para renovar o access token usando o refresh token
router.post('/refresh', authController.refresh);

export default router;