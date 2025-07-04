import { MedicalRecord, CreateMedicalRecordRequest } from '../models/medicalRecord.model';

export class MedicalRecordService {
  private static records: MedicalRecord[] = [
    {
      id: 1,
      petId: 1,
      appointmentId: 1,
      recordDate: '2024-01-15',
      notes: 'Consulta de rotina. Pet apresenta boa saúde geral. Peso: 5.2kg. Temperatura: 38.5°C. Vacinação em dia.',
      prescription: 'Vermífugo - Drontal Plus 1 comprimido via oral a cada 3 meses'
    },
    {
      id: 2,
      petId: 1,
      appointmentId: 2,
      recordDate: '2024-02-20',
      notes: 'Retorno para avaliação. Pet com leve irritação na pele. Recomendado banho com shampoo medicinal.',
      prescription: 'Shampoo Dermatológico - uso 2x por semana por 15 dias'
    },
    {
      id: 3,
      petId: 2,
      appointmentId: 3,
      recordDate: '2024-01-10',
      notes: 'Primeira consulta. Filhote de 3 meses. Aplicação de vacinas múltiplas. Orientações sobre alimentação.',
      prescription: 'Ração Premium Filhote - 3x ao dia, 50g por refeição'
    }
  ];

  static getRecordsByPetId(petId: number): MedicalRecord[] {
    return this.records
      .filter(record => record.petId === petId)
      .sort((a, b) => new Date(b.recordDate).getTime() - new Date(a.recordDate).getTime());
  }

  static createRecord(appointmentId: number, data: CreateMedicalRecordRequest): MedicalRecord {
    const newRecord: MedicalRecord = {
      id: Math.floor(Math.random() * 10000) + 1000,
      petId: data.petId,
      appointmentId: appointmentId,
      recordDate: new Date().toISOString().split('T')[0],
      notes: data.notes,
      prescription: data.prescription
    };

    this.records.push(newRecord);
    return newRecord;
  }

  static getRecordById(id: number): MedicalRecord | undefined {
    return this.records.find(record => record.id === id);
  }

  static getAllRecords(): MedicalRecord[] {
    return this.records.sort((a, b) => new Date(b.recordDate).getTime() - new Date(a.recordDate).getTime());
  }

  static updateRecord(recordId: number, updateData: { notes: string; prescription: string }): MedicalRecord | null {
    const recordIndex = this.records.findIndex(record => record.id === recordId);
    
    if (recordIndex === -1) {
      return null;
    }

    this.records[recordIndex] = {
      ...this.records[recordIndex],
      notes: updateData.notes,
      prescription: updateData.prescription
    };

    return this.records[recordIndex];
  }
}