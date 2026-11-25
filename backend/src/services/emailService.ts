import nodemailer from 'nodemailer';
import { config } from '../config/env';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface ReminderEmailData {
  tutorName: string;
  petName: string;
  appointmentDate: string;
  appointmentTime: string;
  clinicName?: string;
  clinicPhone?: string;
}

export interface VaccineReminderData {
  tutorName: string;
  petName: string;
  vaccineName: string;
  dueDate: string;
  clinicName?: string;
  clinicPhone?: string;
}

/** Escapa texto digitado (nome do tutor, pet, vacina, clínica) antes de entrar no HTML do e-mail. */
export const escapeHtml = (value: unknown): string => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

/** Assunto em uma linha só, sem quebra que possa virar cabeçalho extra. */
const singleLine = (value: unknown): string => String(value ?? '').replace(/[\r\n]+/g, ' ').trim();

const escapeFields = <T extends object>(data: T): T =>
  Object.fromEntries(Object.entries(data).map(([key, value]) => [key, value === undefined ? value : escapeHtml(value)])) as T;

class EmailService {
  private transporter: ReturnType<typeof nodemailer.createTransport> | undefined;
  private from: string;

  constructor(emailConfig = config.email) {
    this.from = emailConfig.from;

    if (!emailConfig.user || !emailConfig.pass) {
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      auth: {
        user: emailConfig.user,
        pass: emailConfig.pass,
      },
    });
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.transporter) {
      console.warn('Envio de e-mail desabilitado: credenciais SMTP não configuradas.');
      return false;
    }

    try {
      const mailOptions = {
        from: this.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('📧 E-mail enviado com sucesso:', result.messageId);
      return true;
    } catch {
      console.error('❌ Erro ao enviar e-mail.');
      return false;
    }
  }

  async sendAppointmentReminder(email: string, raw: ReminderEmailData): Promise<boolean> {
    const subject = singleLine(`🐾 Lembrete: Consulta do ${raw.petName} amanhã`);
    const data = escapeFields(raw);

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0; font-size: 24px;">🐾 Eumaeus</h1>
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
              Este é um lembrete automático do sistema Eumaeus.<br>
              Caso precise reagendar, entre em contato conosco.
            </p>
          </div>
        </div>
      </div>
    `;

    const text = `
      Olá, ${raw.tutorName}!
      
      Lembrete: Não se esqueça da consulta do ${raw.petName} amanhã!
      
      Detalhes:
      - Pet: ${raw.petName}
      - Data: ${raw.appointmentDate}
      - Horário: ${raw.appointmentTime}
      ${raw.clinicName ? `- Clínica: ${raw.clinicName}` : ''}
      ${raw.clinicPhone ? `- Telefone: ${raw.clinicPhone}` : ''}
      
      Chegue com 10 minutos de antecedência e traga a carteirinha de vacinação.
      
      Este é um lembrete automático do sistema Eumaeus.
    `;

    return this.sendEmail({ to: email, subject, html, text });
  }

  async sendVaccineReminder(email: string, raw: VaccineReminderData): Promise<boolean> {
    const subject = singleLine(`💉 Lembrete: Vacina do ${raw.petName} está vencendo`);
    const data = escapeFields(raw);

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0; font-size: 24px;">🐾 Eumaeus</h1>
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
              Este é um lembrete automático do sistema Eumaeus.<br>
              Entre em contato conosco para agendar a revacinação.
            </p>
          </div>
        </div>
      </div>
    `;

    const text = `
      Olá, ${raw.tutorName}!
      
      Lembrete: A vacina do ${raw.petName} está próxima do vencimento!
      
      Detalhes:
      - Pet: ${raw.petName}
      - Vacina: ${raw.vaccineName}
      - Data de Vencimento: ${raw.dueDate}
      ${raw.clinicName ? `- Clínica: ${raw.clinicName}` : ''}
      ${raw.clinicPhone ? `- Telefone: ${raw.clinicPhone}` : ''}
      
      Agende a revacinação para manter a proteção em dia!
      
      Este é um lembrete automático do sistema Eumaeus.
    `;

    return this.sendEmail({ to: email, subject, html, text });
  }

  /** true quando há SMTP configurado; sem isso nenhum e-mail sai. */
  isConfigured(): boolean {
    return Boolean(this.transporter);
  }

  private accountEmail(title: string, paragraphs: string[], link: string, linkLabel: string) {
    const safeLink = escapeHtml(link);
    const body = paragraphs.map((p) => `<p style="margin: 0 0 14px 0; color: #374151; font-size: 15px;">${escapeHtml(p)}</p>`).join('');
    return `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
        <h1 style="color: #1e293b; font-size: 20px; margin: 0 0 18px 0;">${escapeHtml(title)}</h1>
        ${body}
        <p style="margin: 22px 0;"><a href="${safeLink}" style="background: #2563eb; color: #fff; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: bold;">${escapeHtml(linkLabel)}</a></p>
        <p style="margin: 0; color: #64748b; font-size: 13px;">Se o botão não abrir, copie este endereço: ${safeLink}</p>
      </div>`;
  }

  /** Link para criar a conta depois do pagamento confirmado. */
  async sendSignupLink(email: string, data: { planName: string; link: string }): Promise<boolean> {
    const paragraphs = [
      `Recebemos o pagamento do plano ${data.planName}. Obrigado!`,
      'Falta só criar a conta do estabelecimento: nome, responsável e senha de acesso.',
      'O link vale para um único cadastro. Não compartilhe.',
    ];
    return this.sendEmail({
      to: email,
      subject: 'Eumaeus: pagamento confirmado, crie sua conta',
      html: this.accountEmail('Pagamento confirmado', paragraphs, data.link, 'Criar minha conta'),
      text: `${paragraphs.join('\n')}\n\n${data.link}`,
    });
  }

  /** Confirmação do e-mail do dono cadastrado pela contratação online. */
  async sendEmailVerification(email: string, data: { name: string; link: string }): Promise<boolean> {
    const paragraphs = [
      `Olá, ${data.name}.`,
      'Confirme este e-mail para liberar o acesso ao Eumaeus. O link vale por 48 horas.',
      'Se você não criou esta conta, ignore esta mensagem.',
    ];
    return this.sendEmail({
      to: email,
      subject: 'Eumaeus: confirme seu e-mail',
      html: this.accountEmail('Confirme seu e-mail', paragraphs, data.link, 'Confirmar e-mail'),
      text: `${paragraphs.join('\n')}\n\n${data.link}`,
    });
  }

  async testConnection(): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      console.log('✅ Conexão com servidor de e-mail verificada com sucesso!');
      return true;
    } catch {
      console.error('❌ Erro na conexão com servidor de e-mail.');
      return false;
    }
  }
}

export const emailService = new EmailService();
export default EmailService;
