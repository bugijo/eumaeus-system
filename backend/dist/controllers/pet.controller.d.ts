import { Request, Response } from 'express';
export declare class PetController {
    static getAllPets(req: Request, res: Response): Promise<Response>;
    static createPet(req: Request, res: Response): Promise<Response>;
    static getPetById(req: Request, res: Response): Promise<Response>;
    static updatePet(req: Request, res: Response): Promise<Response>;
    static deletePet(req: Request, res: Response): Promise<Response>;
    static getPetsByTutor(req: Request, res: Response): Promise<Response>;
    static createPetForTutor(req: Request, res: Response): Promise<Response>;
}
//# sourceMappingURL=pet.controller.d.ts.map