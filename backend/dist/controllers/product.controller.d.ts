import { Request, Response } from 'express';
export declare class ProductController {
    static getAllProducts(req: Request, res: Response): Promise<void>;
    static getProductById(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static createProduct(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static updateProduct(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static deleteProduct(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static getStockStats(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=product.controller.d.ts.map