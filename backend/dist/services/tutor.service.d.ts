import { Tutor } from '../models/tutor.model';
export declare class TutorService {
    static getAllTutors(): Tutor[];
    static createTutor(newTutorData: Omit<Tutor, 'id'>): Tutor;
    static getTutorById(id: number): Tutor | null;
    static updateTutor(id: number, updatedData: Omit<Tutor, 'id'>): Tutor | null;
    static deleteTutor(id: number): boolean;
}
//# sourceMappingURL=tutor.service.d.ts.map