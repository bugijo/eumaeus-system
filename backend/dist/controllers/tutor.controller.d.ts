import { Request, Response } from 'express';
export declare class TutorController {
    static getTutorStats(req: Request, res: Response): Promise<Response>;
    static getAllTutors(req: Request, res: Response): Promise<Response>;
    static createTutor(req: Request, res: Response): Promise<Response>;
    static getTutorById(req: Request, res: Response): Promise<Response>;
    static updateTutor(req: Request, res: Response): Promise<Response>;
    static deleteTutor(req: Request, res: Response): Promise<Response>;
}
//# sourceMappingURL=tutor.controller.d.ts.map