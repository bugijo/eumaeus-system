import nodemailer from 'nodemailer';
import EmailService from '../services/emailService';

describe('email credential safety', () => {
  it('keeps email disabled when optional credentials are absent', async () => {
    const createTransport = jest.spyOn(nodemailer, 'createTransport');
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const service = new EmailService({
      host: 'smtp.example.invalid',
      port: 587,
      secure: false,
      user: '',
      pass: '',
      from: '',
    });

    await expect(service.sendEmail({
      to: 'recipient@example.invalid',
      subject: 'test',
      html: '<p>test</p>',
    })).resolves.toBe(false);

    expect(createTransport).not.toHaveBeenCalled();
    warn.mockRestore();
    createTransport.mockRestore();
  });
});
