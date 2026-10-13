#!/usr/bin/env node
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const required = (name) => {
  const value = process.env[name];
  if (!value || value.trim() !== value) throw new Error(`${name} é obrigatória`);
  return value;
};

const env = (process.env.NODE_ENV || '').trim().toLowerCase();
if (!['development', 'test'].includes(env) || process.env.ALLOW_TEST_DATA_MUTATION !== 'true') {
  throw new Error('Fixture QA bloqueada: use NODE_ENV development/test e ALLOW_TEST_DATA_MUTATION=true');
}
const databaseUrl = required('DATABASE_URL');
const parsed = new URL(databaseUrl);
if (!['127.0.0.1', 'localhost', '::1'].includes(parsed.hostname) || parsed.pathname !== '/eumaeus_local') {
  throw new Error('Fixture QA bloqueada: DATABASE_URL não aponta para eumaeus_local local');
}
const email = required('QA_EMAIL').toLowerCase();
const name = required('QA_NAME');
const roleName = required('QA_ROLE');
const clinicId = Number(required('QA_CLINIC_ID'));
const password = required('QA_PASSWORD');
if (!email.endsWith('@example.invalid') || !/^QA\s+SINTETICO/i.test(name) || !Number.isInteger(clinicId) || clinicId <= 0) throw new Error('Fixture QA deve ser sintética, clínica válida e nome identificado');
if (!['DONO', 'FINANCEIRO', 'RECEPCAO', 'VETERINARIO', 'AUXILIAR'].includes(roleName)) throw new Error('Papel QA não permitido');
if (password.length < 16) throw new Error('QA_PASSWORD deve ter pelo menos 16 caracteres');

const prisma = new PrismaClient();
try {
  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.authProfile.findUnique({ where: { email }, select: { id: true } });
    if (existing) throw new Error('Identidade QA já existe; nenhuma conta foi alterada');
    await tx.role.upsert({ where: { name: roleName }, update: {}, create: { name: roleName, description: 'Papel sintético local de QA' } });
    const auth = await tx.authProfile.create({ data: { email, password: await bcrypt.hash(password, 12) }, select: { id: true } });
    return tx.user.create({ data: { name, clinicId, roleName, authProfileId: auth.id }, select: { id: true, clinicId: true, roleName: true, active: true, authProfile: { select: { email: true } } } });
  });
  console.log(JSON.stringify({ created: true, userId: result.id, clinicId: result.clinicId, role: result.roleName, email: result.authProfile.email }));
} finally { await prisma.$disconnect(); }
