import { Tutor } from '../models/tutor.model';
export declare class TutorService {
    static getTutorStats(): Promise<{
        total: number;
        active: number;
    }>;
    static getAllTutors(): Promise<Tutor[]>;
    static createTutor(newTutorData: Omit<Tutor, 'id'>): Promise<Tutor>;
    static getTutorById(id: number): Promise<Tutor | null>;
    static updateTutor(id: number, updatedData: Omit<Tutor, 'id'>): Promise<Tutor | null>;
    static deleteTutor(id: number): Promise<boolean>;
}
//# sourceMappingURL=tutor.service.d.ts.map