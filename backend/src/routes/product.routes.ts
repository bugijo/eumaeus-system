import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';

const router = Router();

// GET /api/products - Listar todos os produtos
router.get('/', ProductController.getAllProducts);

// GET /api/products/stats - Obter estatísticas do estoque
router.get('/stats', ProductController.getStockStats);

// GET /api/products/:id - Buscar um produto por ID
router.get('/:id', ProductController.getProductById);

// POST /api/products - Criar um novo produto
router.post('/', ProductController.createProduct);

// PUT /api/products/:id - Atualizar um produto
router.put('/:id', ProductController.updateProduct);

// DELETE /api/products/:id - Deletar um produto
router.delete('/:id', ProductController.deleteProduct);

export default router;