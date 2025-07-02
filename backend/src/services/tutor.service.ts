import { Tutor } from '../models/tutor.model';

export class TutorService {
  static getAllTutors(): Tutor[] {
    return [
      {
        id: 1,
        name: 'Maria Silva',
        email: 'maria.silva@email.com',
        phone: '(11) 99999-1234',
        address: 'Rua das Flores, 123 - São Paulo, SP'
      },
      {
        id: 2,
        name: 'João Santos',
        email: 'joao.santos@email.com',
        phone: '(11) 88888-5678',
        address: 'Av. Paulista, 456 - São Paulo, SP'
      },
      {
        id: 3,
        name: 'Ana Costa',
        email: 'ana.costa@email.com',
        phone: '(11) 77777-9012',
        address: 'Rua da Consolação, 789 - São Paulo, SP'
      }
    ];
  }

  static createTutor(newTutorData: Omit<Tutor, 'id'>): Tutor {
    console.log('Recebido para criação:', newTutorData);
    
    const createdTutor: Tutor = {
      id: Math.floor(Math.random() * 1000) + 100,
      ...newTutorData
    };
    
    console.log('Tutor criado:', createdTutor);
    return createdTutor;
  }

  static getTutorById(id: number): Tutor | null {
    const tutors = this.getAllTutors();
    return tutors.find(tutor => tutor.id === id) || null;
  }

  static updateTutor(id: number, updatedData: Omit<Tutor, 'id'>): Tutor | null {
    console.log('Recebido para atualização:', { id, updatedData });
    
    const tutors = this.getAllTutors();
    const tutorIndex = tutors.findIndex(tutor => tutor.id === id);
    
    if (tutorIndex === -1) {
      return null;
    }
    
    const updatedTutor: Tutor = {
      id,
      ...updatedData
    };
    
    console.log('Tutor atualizado:', updatedTutor);
    return updatedTutor;
  }

  static deleteTutor(id: number): boolean {
    console.log('Recebido para deleção:', { id });
    
    const tutors = this.getAllTutors();
    const tutorIndex = tutors.findIndex(tutor => tutor.id === id);
    
    if (tutorIndex === -1) {
      return false;
    }
    
    console.log('Tutor deletado com sucesso:', id);
    return true;
  }
}