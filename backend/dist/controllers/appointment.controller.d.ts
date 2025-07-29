import { Request, Response } from 'express';
export declare class AppointmentController {
    static getAllAppointments(req: Request, res: Response): Promise<Response | void>;
    static createAppointment(req: Request, res: Response): Promise<Response | void>;
    static getAppointmentById(req: Request, res: Response): Promise<Response | void>;
    static updateAppointment(req: Request, res: Response): Promise<Response | void>;
    static deleteAppointment(req: Request, res: Response): Promise<Response | void>;
    static updateAppointmentStatus(req: Request, res: Response): Promise<Response | void>;
}
//# sourceMappingURL=appointment.controller.d.ts.map