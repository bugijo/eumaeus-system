// Em prisma/seed.ts
import { PrismaClient, RoleName } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando o processo de seeding...');

  // 1. Criar os Cargos (Roles) se eles não existirem
  const rolesToCreate = [
    { name: RoleName.DONO, description: 'Acesso total ao sistema.' },
    { name: RoleName.VETERINARIO, description: 'Acesso a agendamentos e prontuários.' },
    { name: RoleName.FUNCIONARIO, description: 'Acesso a agendamentos e cadastros básicos.' },
    { name: RoleName.FINANCEIRO, description: 'Acesso a relatórios e faturamento.' },
  ];

  for (const role of rolesToCreate) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
  }
  console.log('Cargos criados/verificados com sucesso.');

  // 2. Criar um Usuário Administrador Padrão
  const adminEmail = 'admin@pulsevet.com';
  const plainPassword = '***REMOVIDO***'; // Lembre-se, esta é uma senha apenas para desenvolvimento!

  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: 'Admin do Sistema',
      password: hashedPassword,
      roleName: RoleName.DONO,
    },
  });

  console.log(`Usuário administrador criado/verificado: ${adminUser.email}`);
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