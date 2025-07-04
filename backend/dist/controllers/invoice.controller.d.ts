import { Request, Response } from 'express';
export declare class InvoiceController {
    private invoiceService;
    constructor();
    createFromAppointment: (req: Request, res: Response) => Promise<Response | void>;
    getById: (req: Request, res: Response) => Promise<Response | void>;
    getByAppointmentId: (req: Request, res: Response) => Promise<Response | void>;
    updateStatus: (req: Request, res: Response) => Promise<Response | void>;
    getAll: (req: Request, res: Response) => Promise<Response | void>;
}
//# sourceMappingURL=invoice.controller.d.ts.map