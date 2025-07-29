"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
class EmailService {
    constructor() {
        this.transporter = nodemailer_1.default.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER || 'seu-email@gmail.com',
                pass: process.env.EMAIL_PASSWORD || 'sua-senha-de-app'
            }
        });
    }
    async sendEmail(options) {
        try {
            const mailOptions = {
                from: process.env.EMAIL_USER || 'PulseVet System <seu-email@gmail.com>',
                to: options.to,
                subject: options.subject,
                html: options.html,
                text: options.text
            };
            const result = await this.transporter.sendMail(mailOptions);
            console.log('📧 E-mail enviado com sucesso:', result.messageId);
            return true;
        }
        catch (error) {
            console.error('❌ Erro ao enviar e-mail:', error);
            return false;
        }
    }
    async sendAppointmentReminder(email, data) {
        const subject = `🐾 Lembrete: Consulta do ${data.petName} amanhã`;
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0; font-size: 24px;">🐾 PulseVet</h1>
            <p style="color: #64748b; margin: 5px 0 0 0;">Sistema Veterinário</p>
          </div>
          
          <h2 style="color: #1e293b; margin-bottom: 20px;">Olá, ${data.tutorName}! 👋</h2>
          
          <div style="background-color: #dbeafe; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 0; font-size: 16px; color: #1e40af;">
              <strong>🗓️ Lembrete de Consulta</strong>
            </p>
            <p style="margin: 10px 0 0 0; color: #374151;">
              Não se esqueça da consulta do <strong>${data.petName}</strong> amanhã!
            </p>
          </div>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 15px 0; color: #374151;">📋 Detalhes da Consulta:</h3>
            <p style="margin: 5px 0; color: #4b5563;"><strong>Pet:</strong> ${data.petName}</p>
            <p style="margin: 5px 0; color: #4b5563;"><strong>Data:</strong> ${data.appointmentDate}</p>
            <p style="margin: 5px 0; color: #4b5563;"><strong>Horário:</strong> ${data.appointmentTime}</p>
            ${data.clinicName ? `<p style="margin: 5px 0; color: #4b5563;"><strong>Clínica:</strong> ${data.clinicName}</p>` : ''}
            ${data.clinicPhone ? `<p style="margin: 5px 0; color: #4b5563;"><strong>Telefone:</strong> ${data.clinicPhone}</p>` : ''}
          </div>
          
          <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
              💡 <strong>Dica:</strong> Chegue com 10 minutos de antecedência e traga a carteirinha de vacinação do ${data.petName}.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #6b7280; font-size: 12px;">
              Este é um lembrete automático do sistema PulseVet.<br>
              Caso precise reagendar, entre em contato conosco.
            </p>
          </div>
        </div>
      </div>
    `;
        const text = `
      Olá, ${data.tutorName}!
      
      Lembrete: Não se esqueça da consulta do ${data.petName} amanhã!
      
      Detalhes:
      - Pet: ${data.petName}
      - Data: ${data.appointmentDate}
      - Horário: ${data.appointmentTime}
      ${data.clinicName ? `- Clínica: ${data.clinicName}` : ''}
      ${data.clinicPhone ? `- Telefone: ${data.clinicPhone}` : ''}
      
      Chegue com 10 minutos de antecedência e traga a carteirinha de vacinação.
      
      Este é um lembrete automático do sistema PulseVet.
    `;
        return this.sendEmail({ to: email, subject, html, text });
    }
    async sendVaccineReminder(email, data) {
        const subject = `💉 Lembrete: Vacina do ${data.petName} está vencendo`;
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0; font-size: 24px;">🐾 PulseVet</h1>
            <p style="color: #64748b; margin: 5px 0 0 0;">Sistema Veterinário</p>
          </div>
          
          <h2 style="color: #1e293b; margin-bottom: 20px;">Olá, ${data.tutorName}! 👋</h2>
          
          <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #ef4444;">
            <p style="margin: 0; font-size: 16px; color: #dc2626;">
              <strong>💉 Lembrete de Vacinação</strong>
            </p>
            <p style="margin: 10px 0 0 0; color: #374151;">
              A vacina do <strong>${data.petName}</strong> está próxima do vencimento!
            </p>
          </div>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 15px 0; color: #374151;">📋 Detalhes da Vacinação:</h3>
            <p style="margin: 5px 0; color: #4b5563;"><strong>Pet:</strong> ${data.petName}</p>
            <p style="margin: 5px 0; color: #4b5563;"><strong>Vacina:</strong> ${data.vaccineName}</p>
            <p style="margin: 5px 0; color: #4b5563;"><strong>Data de Vencimento:</strong> ${data.dueDate}</p>
            ${data.clinicName ? `<p style="margin: 5px 0; color: #4b5563;"><strong>Clínica:</strong> ${data.clinicName}</p>` : ''}
            ${data.clinicPhone ? `<p style="margin: 5px 0; color: #4b5563;"><strong>Telefone:</strong> ${data.clinicPhone}</p>` : ''}
          </div>
          
          <div style="background-color: #dbeafe; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 0; color: #1e40af; font-size: 14px;">
              💡 <strong>Importante:</strong> Agende a revacinação do ${data.petName} para manter a proteção em dia!
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #6b7280; font-size: 12px;">
              Este é um lembrete automático do sistema PulseVet.<br>
              Entre em contato conosco para agendar a revacinação.
            </p>
          </div>
        </div>
      </div>
    `;
        const text = `
      Olá, ${data.tutorName}!
      
      Lembrete: A vacina do ${data.petName} está próxima do vencimento!
      
      Detalhes:
      - Pet: ${data.petName}
      - Vacina: ${data.vaccineName}
      - Data de Vencimento: ${data.dueDate}
      ${data.clinicName ? `- Clínica: ${data.clinicName}` : ''}
      ${data.clinicPhone ? `- Telefone: ${data.clinicPhone}` : ''}
      
      Agende a revacinação para manter a proteção em dia!
      
      Este é um lembrete automático do sistema PulseVet.
    `;
        return this.sendEmail({ to: email, subject, html, text });
    }
    async testConnection() {
        try {
            await this.transporter.verify();
            console.log('✅ Conexão com servidor de e-mail verificada com sucesso!');
            return true;
        }
        catch (error) {
            console.error('❌ Erro na conexão com servidor de e-mail:', error);
            return false;
        }
    }
}
exports.emailService = new EmailService();
exports.default = EmailService;
//# sourceMappingURL=emailService.js.map