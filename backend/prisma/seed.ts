import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function ensureRoles() {
  const rolesToCreate = [
    { name: 'DONO', description: 'Acesso total ao sistema.' },
    { name: 'VETERINARIO', description: 'Acesso a agendamentos e prontuarios.' },
    { name: 'FUNCIONARIO', description: 'Perfil legado. Equivale a recepcao.' },
    { name: 'RECEPCAO', description: 'Acesso a agendamentos e cadastros basicos.' },
    { name: 'AUXILIAR', description: 'Acesso operacional limitado e sem edicao de prontuario.' },
    { name: 'FINANCEIRO', description: 'Acesso a relatorios e faturamento.' },
  ];

  for (const role of rolesToCreate) {
    await prisma.role.upsert({
      where: { name: role.name as any },
      update: {},
      create: role as any,
    });
  }
}

async function ensureDefaultUsers() {
  const defaultPassword = '123456';
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  const users = [
    { email: 'admin@eumaeus.com', name: 'Admin do Sistema', roleName: 'DONO' },
    { email: 'veterinario@eumaeus.com', name: 'Dra. Maria Silva', roleName: 'VETERINARIO' },
    { email: 'recepcao@eumaeus.com', name: 'Joao da Recepcao', roleName: 'RECEPCAO' },
    { email: 'auxiliar@eumaeus.com', name: 'Ana Auxiliar', roleName: 'AUXILIAR' },
    { email: 'funcionario@eumaeus.com', name: 'Joao Santos', roleName: 'FUNCIONARIO' },
    { email: 'financeiro@eumaeus.com', name: 'Ana Costa', roleName: 'FINANCEIRO' },
  ];

  for (const user of users) {
    const existingAuthProfile = await prisma.authProfile.findUnique({
      where: { email: user.email },
    });

    if (existingAuthProfile) {
      console.log(`Usuario ja existe: ${user.email}`);
      continue;
    }

    const authProfile = await prisma.authProfile.create({
      data: {
        email: user.email,
        password: hashedPassword,
      },
    });

    await prisma.user.create({
      data: {
        name: user.name,
        roleName: user.roleName as any,
        authProfileId: authProfile.id,
      },
    });

    console.log(`Usuario criado: ${user.email}`);
  }

  console.log('Credenciais padrao: senha 123456');
}

async function main() {
  console.log('Iniciando seed do backend...');
  await ensureRoles();
  await ensureDefaultUsers();
  console.log('Seed concluido com sucesso.');
}

main()
  .catch((error) => {
    console.error('Erro no seed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
