// Em prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando o processo de seeding...');

  // 1. Criar os Cargos (Roles) se eles não existirem
  const rolesToCreate = [
    { name: 'DONO', description: 'Acesso total ao sistema.' },
    { name: 'VETERINARIO', description: 'Acesso a agendamentos e prontuários.' },
    { name: 'FUNCIONARIO', description: 'Acesso a agendamentos e cadastros básicos.' },
    { name: 'FINANCEIRO', description: 'Acesso a relatórios e faturamento.' },
  ];

  for (const role of rolesToCreate) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
  }
  console.log('Cargos criados/verificados com sucesso.');

  // 2. Criar um Usuário Administrador Padrão com nova estrutura AuthProfile
  const adminEmail = 'admin@eumaeus.com';
  const plainPassword = '***REMOVIDO***'; // Lembre-se, esta é uma senha apenas para desenvolvimento!

  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  // Verificar se o AuthProfile já existe
  const existingAuthProfile = await prisma.authProfile.findUnique({
    where: { email: adminEmail }
  });

  if (!existingAuthProfile) {
    // Criar AuthProfile
    const authProfile = await prisma.authProfile.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
      }
    });

    // Criar User linkado ao AuthProfile
    const adminUser = await prisma.user.create({
      data: {
        name: 'Admin do Sistema',
        roleName: 'DONO',
        authProfileId: authProfile.id,
      }
    });

    console.log(`Usuário administrador criado: ${authProfile.email}`);
  } else {
    console.log(`Usuário administrador já existe: ${adminEmail}`);
  }
  console.log('Seeding concluído com sucesso! 🌱');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });