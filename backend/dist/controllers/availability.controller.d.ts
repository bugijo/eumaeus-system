import { Request, Response } from 'express';
export declare class AvailabilityController {
    static getAvailability(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static checkSlotAvailability(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=availability.controller.d.ts.map