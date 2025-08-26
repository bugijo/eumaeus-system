import { Request, Response } from 'express';
export declare class ServiceController {
    static getAllServices(req: Request, res: Response): Promise<void>;
    static getServicesByCategory(req: Request, res: Response): Promise<void>;
    static getServiceById(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
//# sourceMappingURL=service.controller.d.ts.map