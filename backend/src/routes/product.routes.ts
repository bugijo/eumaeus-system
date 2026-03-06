import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';
import { authenticateUser, requireRoles, ROLE } from '../middlewares/auth.middleware';

const router = Router();
router.use(authenticateUser);

// GET /api/products - Listar todos os produtos
router.get('/', requireRoles(ROLE.DONO, ROLE.VETERINARIO, ROLE.RECEPCAO, ROLE.AUXILIAR), ProductController.getAllProducts);

// GET /api/products/stats - Obter estatísticas do estoque
router.get('/stats', requireRoles(ROLE.DONO, ROLE.VETERINARIO, ROLE.AUXILIAR), ProductController.getStockStats);

// GET /api/products/:id - Buscar um produto por ID
router.get('/:id', requireRoles(ROLE.DONO, ROLE.VETERINARIO, ROLE.RECEPCAO, ROLE.AUXILIAR), ProductController.getProductById);

// POST /api/products - Criar um novo produto
router.post('/', requireRoles(ROLE.DONO, ROLE.VETERINARIO, ROLE.AUXILIAR), ProductController.createProduct);

// PUT /api/products/:id - Atualizar um produto
router.put('/:id', requireRoles(ROLE.DONO, ROLE.VETERINARIO, ROLE.AUXILIAR), ProductController.updateProduct);

// DELETE /api/products/:id - Deletar um produto
router.delete('/:id', requireRoles(ROLE.DONO, ROLE.VETERINARIO, ROLE.AUXILIAR), ProductController.deleteProduct);

export default router;
