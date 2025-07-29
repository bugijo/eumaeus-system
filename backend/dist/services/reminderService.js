"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reminderService = void 0;
const client_1 = require("@prisma/client");
const emailService_1 = require("./emailService");
const prisma = new client_1.PrismaClient();
class ReminderService {
    async findAppointmentsForTomorrow() {
        try {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);
            const endOfTomorrow = new Date(tomorrow);
            endOfTomorrow.setHours(23, 59, 59, 999);
            console.log(`🔍 Buscando agendamentos para: ${tomorrow.toLocaleDateString()}`);
            const appointments = await prisma.appointment.findMany({
                where: {
                    appointmentDate: {
                        gte: tomorrow,
                        lte: endOfTomorrow
                    },
                    status: {
                        in: ['SCHEDULED', 'CONFIRMED']
                    }
                },
                include: {
                    pet: true,
                    tutor: true
                }
            });
            const reminders = appointments
                .filter(appointment => appointment.tutor?.email)
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
        }
        catch (error) {
            console.error('❌ Erro ao buscar agendamentos para lembrete:', error);
            return [];
        }
    }
    async findPetsNeedingVaccineReminders() {
        try {
            console.log('⚠️ Funcionalidade de lembretes de vacina temporariamente desabilitada - modelos não encontrados');
            return [];
        }
        catch (error) {
            console.error('❌ Erro ao buscar vacinas para lembrete:', error);
            return [];
        }
    }
    async sendAppointmentReminders() {
        const appointments = await this.findAppointmentsForTomorrow();
        let sent = 0;
        let failed = 0;
        console.log(`📧 Iniciando envio de ${appointments.length} lembretes de agendamento...`);
        for (const appointment of appointments) {
            try {
                const reminderData = {
                    tutorName: appointment.tutorName,
                    petName: appointment.petName,
                    appointmentDate: appointment.appointmentDate.toLocaleDateString('pt-BR'),
                    appointmentTime: appointment.appointmentTime,
                    clinicName: 'PulseVet Clínica Veterinária',
                    clinicPhone: '(11) 99999-9999'
                };
                const success = await emailService_1.emailService.sendAppointmentReminder(appointment.tutorEmail, reminderData);
                if (success) {
                    sent++;
                    console.log(`✅ Lembrete enviado para ${appointment.tutorName} (${appointment.petName})`);
                }
                else {
                    failed++;
                    console.log(`❌ Falha ao enviar lembrete para ${appointment.tutorName} (${appointment.petName})`);
                }
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            catch (error) {
                failed++;
                console.error(`❌ Erro ao processar lembrete para ${appointment.tutorName}:`, error);
            }
        }
        console.log(`📊 Resumo dos lembretes de agendamento: ${sent} enviados, ${failed} falharam`);
        return { sent, failed };
    }
    async sendVaccineReminders() {
        const vaccines = await this.findPetsNeedingVaccineReminders();
        let sent = 0;
        let failed = 0;
        console.log(`💉 Iniciando envio de ${vaccines.length} lembretes de vacinação...`);
        for (const vaccine of vaccines) {
            try {
                const reminderData = {
                    tutorName: vaccine.tutorName,
                    petName: vaccine.petName,
                    vaccineName: vaccine.vaccineName,
                    dueDate: vaccine.dueDate.toLocaleDateString('pt-BR'),
                    clinicName: 'PulseVet Clínica Veterinária',
                    clinicPhone: '(11) 99999-9999'
                };
                const success = await emailService_1.emailService.sendVaccineReminder(vaccine.tutorEmail, reminderData);
                if (success) {
                    sent++;
                    console.log(`✅ Lembrete de vacina enviado para ${vaccine.tutorName} (${vaccine.petName})`);
                }
                else {
                    failed++;
                    console.log(`❌ Falha ao enviar lembrete de vacina para ${vaccine.tutorName} (${vaccine.petName})`);
                }
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            catch (error) {
                failed++;
                console.error(`❌ Erro ao processar lembrete de vacina para ${vaccine.tutorName}:`, error);
            }
        }
        console.log(`📊 Resumo dos lembretes de vacinação: ${sent} enviados, ${failed} falharam`);
        return { sent, failed };
    }
    async sendAllReminders() {
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
    async testReminderSystem() {
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
exports.reminderService = new ReminderService();
exports.default = ReminderService;
//# sourceMappingURL=reminderService.js.map