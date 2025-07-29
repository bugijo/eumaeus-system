import { Request, Response } from 'express';
export declare const dashboardController: {
    getStats(req: Request, res: Response): Promise<void>;
    getUpcomingAppointments(req: Request, res: Response): Promise<Response | void>;
    getRecentActivities(req: Request, res: Response): Promise<Response | void>;
    getRecentActivity(req: Request, res: Response): Promise<void>;
};
//# sourceMappingURL=dashboardController.d.ts.map