"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const product_controller_1 = require("../controllers/product.controller");
const router = (0, express_1.Router)();
router.get('/', product_controller_1.ProductController.getAllProducts);
router.get('/stats', product_controller_1.ProductController.getStockStats);
router.get('/:id', product_controller_1.ProductController.getProductById);
router.post('/', product_controller_1.ProductController.createProduct);
router.put('/:id', product_controller_1.ProductController.updateProduct);
router.delete('/:id', product_controller_1.ProductController.deleteProduct);
exports.default = router;
//# sourceMappingURL=product.routes.js.map