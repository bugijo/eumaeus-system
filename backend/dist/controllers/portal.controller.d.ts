import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
declare const _default: {
    getMyPetById(req: AuthenticatedRequest, res: Response): Promise<Response>;
    getMyPets(req: AuthenticatedRequest, res: Response): Promise<Response>;
    getMyAppointments(req: AuthenticatedRequest, res: Response): Promise<Response>;
    createAppointment(req: AuthenticatedRequest, res: Response): Promise<Response>;
    getPetMedicalHistory(req: AuthenticatedRequest, res: Response): Promise<Response>;
    updateMyProfile(req: AuthenticatedRequest, res: Response): Promise<Response>;
    getMyProfile(req: AuthenticatedRequest, res: Response): Promise<Response>;
};
export default _default;
//# sourceMappingURL=portal.controller.d.ts.map