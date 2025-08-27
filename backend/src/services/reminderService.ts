import { PrismaClient } from '@prisma/client';
import { emailService, ReminderEmailData, VaccineReminderData } from './emailService';
import { AppointmentWithRelations } from '../types';

const prisma = new PrismaClient();

export interface AppointmentReminder {
  id: string;
  petName: string;
  tutorName: string;
  tutorEmail: string;
  appointmentDate: Date;
  appointmentTime: string;
  status: string;
}

export interface VaccineReminder {
  id: string;
  petName: string;
  tutorName: string;
  tutorEmail: string;
  vaccineName: string;
  lastVaccineDate: Date;
  dueDate: Date;
}

class ReminderService {
  /**
   * Busca todos os agendamentos para o dia seguinte
   */
  async findAppointmentsForTomorrow(): Promise<AppointmentReminder[]> {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const endOfTomorrow = new Date(tomorrow);
      endOfTomorrow.setHours(23, 59, 59, 999);

      console.log(`🔍 Buscando agendamentos para: ${tomorrow.toLocaleDateString()}`);

      const appointments: AppointmentWithRelations[] = await prisma.appointment.findMany({
        where: {
          appointmentDate: {
            gte: tomorrow,
            lte: endOfTomorrow
          },
          status: {
            in: ['SCHEDULED', 'CONFIRMED'] // Apenas agendamentos confirmados
          }
        },
        include: {
          pet: true,
          tutor: true
        }
      });

      const reminders: AppointmentReminder[] = appointments
        .filter(appointment => appointment.tutor?.email) // Apenas tutores com e-mail
        .map(appointment => ({
          id: appointment.id.toString(),
          petName: appointment.pet?.name || 'Pet',
          tutorName: appointment.tutor?.name || 'Tutor',
          tutorEmail: appointment.tutor?.email || '',
          appointmentDate: appointment.appointmentDate,
          appointmentTime: appointment.time || '00:00',
          status: appointment.status
        }));

      console.log(`📋 Encontrados ${reminders.length} agendamentos para lembrete`);
      return reminders;
    } catch (error) {
      console.error('❌ Erro ao buscar agendamentos para lembrete:', error);
      return [];
    }
  }

  /**
   * Busca pets que precisam de lembrete de vacinação
   * (vacinas que vencem nos próximos 7 dias)
   * TODO: Implementar quando os modelos Vaccination e Vaccine forem criados
   */
  async findPetsNeedingVaccineReminders(): Promise<VaccineReminder[]> {
    try {
      console.log('⚠️ Funcionalidade de lembretes de vacina temporariamente desabilitada - modelos não encontrados');
      return [];
      
      // TODO: Descomentar quando os modelos Vaccination e Vaccine forem adicionados ao schema
      /*
      const today = new Date();
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(today.getDate() + 7);

      console.log(`🔍 Buscando vacinas que vencem até: ${sevenDaysFromNow.toLocaleDateString()}`);

      // Busca todas as vacinas aplicadas
      const vaccinations = await prisma.vaccination.findMany({
        include: {
          pet: {
            include: {
              tutor: true
            }
          },
          vaccine: true
        }
      });

      const reminders: VaccineReminder[] = [];

      // Agrupa vacinas por pet e tipo de vacina
      const petVaccines = new Map<string, Map<string, any>>();
      
      vaccinations.forEach(vaccination => {
        const petId = vaccination.petId.toString();
        const vaccineId = vaccination.vaccineId.toString();
        
        if (!petVaccines.has(petId)) {
          petVaccines.set(petId, new Map());
        }
        
        const currentVaccine = petVaccines.get(petId)!.get(vaccineId);
        if (!currentVaccine || vaccination.applicationDate > currentVaccine.applicationDate) {
          petVaccines.get(petId)!.set(vaccineId, vaccination);
        }
      });

      // Verifica quais vacinas estão próximas do vencimento
      petVaccines.forEach((vaccines, petId) => {
        vaccines.forEach((vaccination, vaccineId) => {
          if (!vaccination.pet?.tutor?.email) return;

          // Calcula a data de vencimento (assumindo 1 ano de validade)
          const dueDate = new Date(vaccination.applicationDate);
          dueDate.setFullYear(dueDate.getFullYear() + 1);

          // Verifica se vence nos próximos 7 dias
          if (dueDate >= today && dueDate <= sevenDaysFromNow) {
            reminders.push({
              id: vaccination.id.toString(),
              petName: vaccination.pet.name,
              tutorName: vaccination.pet.tutor.name,
              tutorEmail: vaccination.pet.tutor.email,
              vaccineName: vaccination.vaccine?.name || 'Vacina',
              lastVaccineDate: vaccination.applicationDate,
              dueDate: dueDate
            });
          }
        });
      });

      console.log(`💉 Encontradas ${reminders.length} vacinas próximas do vencimento`);
      return reminders;
      */
    } catch (error) {
      console.error('❌ Erro ao buscar vacinas para lembrete:', error);
      return [];
    }
  }

  /**
   * Envia lembretes de agendamentos para amanhã
   */
  async sendAppointmentReminders(): Promise<{ sent: number; failed: number }> {
    const appointments = await this.findAppointmentsForTomorrow();
    let sent = 0;
    let failed = 0;

    console.log(`📧 Iniciando envio de ${appointments.length} lembretes de agendamento...`);

    for (const appointment of appointments) {
      try {
        const reminderData: ReminderEmailData = {
          tutorName: appointment.tutorName,
          petName: appointment.petName,
          appointmentDate: appointment.appointmentDate.toLocaleDateString('pt-BR'),
          appointmentTime: appointment.appointmentTime,
          clinicName: 'Eumaeus Clínica Veterinária',
          clinicPhone: '(11) 99999-9999'
        };

        const success = await emailService.sendAppointmentReminder(
          appointment.tutorEmail,
          reminderData
        );

        if (success) {
          sent++;
          console.log(`✅ Lembrete enviado para ${appointment.tutorName} (${appointment.petName})`);
        } else {
          failed++;
          console.log(`❌ Falha ao enviar lembrete para ${appointment.tutorName} (${appointment.petName})`);
        }

        // Pequena pausa entre envios para evitar spam
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        failed++;
        console.error(`❌ Erro ao processar lembrete para ${appointment.tutorName}:`, error);
      }
    }

    console.log(`📊 Resumo dos lembretes de agendamento: ${sent} enviados, ${failed} falharam`);
    return { sent, failed };
  }

  /**
   * Envia lembretes de vacinação
   */
  async sendVaccineReminders(): Promise<{ sent: number; failed: number }> {
    const vaccines = await this.findPetsNeedingVaccineReminders();
    let sent = 0;
    let failed = 0;

    console.log(`💉 Iniciando envio de ${vaccines.length} lembretes de vacinação...`);

    for (const vaccine of vaccines) {
      try {
        const reminderData: VaccineReminderData = {
          tutorName: vaccine.tutorName,
          petName: vaccine.petName,
          vaccineName: vaccine.vaccineName,
          dueDate: vaccine.dueDate.toLocaleDateString('pt-BR'),
          clinicName: 'Eumaeus Clínica Veterinária',
          clinicPhone: '(11) 99999-9999'
        };

        const success = await emailService.sendVaccineReminder(
          vaccine.tutorEmail,
          reminderData
        );

        if (success) {
          sent++;
          console.log(`✅ Lembrete de vacina enviado para ${vaccine.tutorName} (${vaccine.petName})`);
        } else {
          failed++;
          console.log(`❌ Falha ao enviar lembrete de vacina para ${vaccine.tutorName} (${vaccine.petName})`);
        }

        // Pequena pausa entre envios
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        failed++;
        console.error(`❌ Erro ao processar lembrete de vacina para ${vaccine.tutorName}:`, error);
      }
    }

    console.log(`📊 Resumo dos lembretes de vacinação: ${sent} enviados, ${failed} falharam`);
    return { sent, failed };
  }

  /**
   * Executa todos os lembretes (agendamentos e vacinas)
   */
  async sendAllReminders(): Promise<{ appointments: { sent: number; failed: number }, vaccines: { sent: number; failed: number } }> {
    console.log('🚀 Iniciando processo de envio de lembretes automáticos...');
    
    const appointmentResults = await this.sendAppointmentReminders();
    const vaccineResults = await this.sendVaccineReminders();

    console.log('✨ Processo de lembretes concluído!');
    console.log(`📈 Total: ${appointmentResults.sent + vaccineResults.sent} enviados, ${appointmentResults.failed + vaccineResults.failed} falharam`);

    return {
      appointments: appointmentResults,
      vaccines: vaccineResults
    };
  }

  /**
   * Testa o sistema de lembretes (busca dados sem enviar e-mails)
   */
  async testReminderSystem(): Promise<void> {
    console.log('🧪 Testando sistema de lembretes...');
    
    const appointments = await this.findAppointmentsForTomorrow();
    const vaccines = await this.findPetsNeedingVaccineReminders();
    
    console.log('📋 Resultados do teste:');
    console.log(`   - Agendamentos para amanhã: ${appointments.length}`);
    console.log(`   - Vacinas próximas do vencimento: ${vaccines.length}`);
    
    if (appointments.length > 0) {
      console.log('📅 Próximos agendamentos:');
      appointments.forEach(apt => {
        console.log(`   • ${apt.petName} (${apt.tutorName}) - ${apt.appointmentTime}`);
      });
    }
    
    if (vaccines.length > 0) {
      console.log('💉 Vacinas vencendo:');
      vaccines.forEach(vac => {
        console.log(`   • ${vac.petName} (${vac.tutorName}) - ${vac.vaccineName} vence em ${vac.dueDate.toLocaleDateString('pt-BR')}`);
      });
    }
  }
}

export const reminderService = new ReminderService();
export default ReminderService;