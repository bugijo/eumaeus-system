import { Request, Response } from 'express';
export declare class ProductController {
    static getAllProducts(req: Request, res: Response): Promise<Response | void>;
    static getProductById(req: Request, res: Response): Promise<Response | void>;
    static createProduct(req: Request, res: Response): Promise<Response | void>;
    static updateProduct(req: Request, res: Response): Promise<Response | void>;
    static deleteProduct(req: Request, res: Response): Promise<Response | void>;
    static getStockStats(req: Request, res: Response): Promise<Response | void>;
}
//# sourceMappingURL=product.controller.d.ts.map