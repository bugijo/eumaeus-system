import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { createHmac } from 'node:crypto';
import { createWhatsAppWebhookRouter } from '../routes/whatsappWebhook.routes';
import EmailService, { escapeHtml } from '../services/emailService';

describe('Auditoria: chave do limitador', () => {
  // Carregado com limite de login baixo para medir o 429 sem 180 requisições.
  let server: typeof import('../server');
  beforeAll(() => {
    process.env.RATE_LIMIT_AUTH_MAX_REQUESTS = '3';
    jest.isolateModules(() => { server = require('../server'); });
  });
  afterAll(() => { delete process.env.RATE_LIMIT_AUTH_MAX_REQUESTS; });

  const fakeReq = (path: string, authorization?: string, ip = '203.0.113.9') =>
    ({ path, ip, headers: authorization ? { authorization } : {}, socket: {} }) as unknown as express.Request;

  it('ignora Bearer não verificado e usa o IP', () => {
    const forged = `Bearer ${'x'.repeat(40)}${Math.random()}`;
    expect(server.getClientKey(fakeReq('/api/tutors', forged))).toBe('ip:203.0.113.9');
  });

  it('usa a identidade de token verificado fora do login', () => {
    const valid = jwt.sign({ id: 7, type: 'user', clinicId: 1 }, process.env.JWT_SECRET as string, { algorithm: 'HS256' });
    expect(server.getClientKey(fakeReq('/api/tutors', `Bearer ${valid}`))).toBe('user:1:7');
  });

  it('no login a chave é sempre o IP, em qualquer grafia do caminho', () => {
    const valid = jwt.sign({ id: 7, type: 'user', clinicId: 1 }, process.env.JWT_SECRET as string, { algorithm: 'HS256' });
    expect(server.getClientKey(fakeReq('/api/auth/login', `Bearer ${valid}`))).toBe('ip:203.0.113.9');
    expect(server.getClientKey(fakeReq('/API/AUTH/login', `Bearer ${valid}`))).toBe('ip:203.0.113.9');
  });

  it('trocar o Bearer a cada tentativa não escapa do limite de login', async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 5; i += 1) {
      const res = await request(server.app)
        .post('/api/auth/login')
        .set('Authorization', `Bearer ${'x'.repeat(10)}${String(i).padStart(24, '0')}`)
        .send({ email: 'ninguem@example.invalid', password: 'senha-errada-123' });
      statuses.push(res.status);
    }
    expect(statuses.slice(3)).toEqual([429, 429]);
  });
});

describe('Auditoria: e-mails escapam o texto digitado', () => {
  it('escapeHtml neutraliza tags e aspas', () => {
    expect(escapeHtml('<a href="x">Rex</a> & \'cia\'')).toBe('&lt;a href=&quot;x&quot;&gt;Rex&lt;/a&gt; &amp; &#39;cia&#39;');
  });

  it('o HTML do lembrete não contém a marcação injetada e o assunto fica em uma linha', async () => {
    const sendMail = jest.fn().mockResolvedValue({ messageId: '1' });
    const createTransport = jest.spyOn(nodemailer, 'createTransport').mockReturnValue({ sendMail } as any);
    const log = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    const service = new EmailService({ host: 'smtp.example.invalid', port: 587, secure: false, user: 'u', pass: 'p', from: 'a@example.invalid' } as any);
    await service.sendVaccineReminder('t@example.invalid', {
      tutorName: '<a href="https://phish.example">Clique aqui</a>',
      petName: 'Rex\r\nBcc: alvo@example.invalid',
      vaccineName: '<img src=x onerror=alert(1)>',
      dueDate: '01/12/2026',
    });
    const mail = sendMail.mock.calls[0][0];
    expect(mail.html).not.toContain('<a href="https://phish.example">');
    expect(mail.html).not.toContain('<img');
    expect(mail.html).toContain('&lt;a href=&quot;https://phish.example&quot;&gt;');
    expect(mail.subject).not.toMatch(/[\r\n]/);
    expect(mail.text).toContain('<a href="https://phish.example">Clique aqui</a>');
    createTransport.mockRestore();
    log.mockRestore();
  });
});

describe('Auditoria: webhook WhatsApp só resolve canais configurados', () => {
  const secret = 'local-channel-secret-abcdefghijklmnopqrstuvwxyz-123';
  const verifyToken = 'local-verify-token-123456';
  const store = {
    findTutorByPhone: jest.fn().mockResolvedValue({ id: 90 }),
    findExistingEvent: jest.fn().mockResolvedValue(null),
    persistInboundEvent: jest.fn().mockResolvedValue({ id: 501 }),
  };
  const app = express();
  app.use('/webhooks/whatsapp', createWhatsAppWebhookRouter({ channels: { 'phone-local-1': { clinicId: 11, verifyToken, webhookSecret: secret } } as any, store }));

  it.each(['constructor', '__proto__', 'toString', 'hasOwnProperty'])('channelId herdado (%s) recebe 404 sem lançar erro', async (channelId) => {
    const body = Buffer.from(JSON.stringify({ id: 'e1', type: 'message.text', payload: { from: '5511999999999' } }));
    const signature = `sha256=${createHmac('sha256', 'qualquer').update(body).digest('hex')}`;
    const res = await request(app).post(`/webhooks/whatsapp/${channelId}`).set('Content-Type', 'application/json').set('X-Hub-Signature-256', signature).send(body);
    expect(res.status).toBe(404);
  });

  it('handshake aceita o token certo e recusa token errado ou de outro tamanho', async () => {
    const query = (token: string) => ({ 'hub.mode': 'subscribe', 'hub.verify_token': token, 'hub.challenge': 'c1' });
    await request(app).get('/webhooks/whatsapp/phone-local-1').query(query(verifyToken)).expect(200, 'c1');
    await request(app).get('/webhooks/whatsapp/phone-local-1').query(query(`${verifyToken}x`)).expect(403);
    await request(app).get('/webhooks/whatsapp/phone-local-1').query(query('errado')).expect(403);
    await request(app).get('/webhooks/whatsapp/constructor').query(query(verifyToken)).expect(403);
  });
});
