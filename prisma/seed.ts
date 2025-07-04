import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // 1. Criar Roles
  console.log('📋 Criando roles...');
  const roles = [
    { name: 'DONO', description: 'Proprietário da clínica' },
    { name: 'VETERINARIO', description: 'Médico veterinário' },
    { name: 'FUNCIONARIO', description: 'Funcionário da clínica' },
    { name: 'FINANCEIRO', description: 'Responsável pelo financeiro' },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name as any },
      update: {},
      create: role as any,
    });
  }

  // 2. Criar Permissões
  console.log('🔐 Criando permissões...');
  const permissions = [
    // Permissões para Tutores
    { action: 'view', subject: 'Tutor' },
    { action: 'create', subject: 'Tutor' },
    { action: 'edit', subject: 'Tutor' },
    { action: 'delete', subject: 'Tutor' },
    
    // Permissões para Pets
    { action: 'view', subject: 'Pet' },
    { action: 'create', subject: 'Pet' },
    { action: 'edit', subject: 'Pet' },
    { action: 'delete', subject: 'Pet' },
    
    // Permissões para Agendamentos
    { action: 'view', subject: 'Appointment' },
    { action: 'create', subject: 'Appointment' },
    { action: 'edit', subject: 'Appointment' },
    { action: 'delete', subject: 'Appointment' },
    
    // Permissões para Prontuários
    { action: 'view', subject: 'MedicalRecord' },
    { action: 'create', subject: 'MedicalRecord' },
    { action: 'edit', subject: 'MedicalRecord' },
    { action: 'delete', subject: 'MedicalRecord' },
    
    // Permissões Financeiras
    { action: 'view', subject: 'Financials' },
    { action: 'create', subject: 'Financials' },
    { action: 'edit', subject: 'Financials' },
    { action: 'delete', subject: 'Financials' },
  ];

  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { action_subject: { action: permission.action, subject: permission.subject } },
      update: {},
      create: permission,
    });
  }

  // 3. Associar permissões aos roles
  console.log('🔗 Associando permissões aos roles...');
  
  // DONO - Todas as permissões
  const allPermissions = await prisma.permission.findMany();
  await prisma.role.update({
    where: { name: 'DONO' },
    data: {
      permissions: {
        connect: allPermissions.map(p => ({ id: p.id }))
      }
    }
  });

  // VETERINARIO - Permissões clínicas (sem financeiro)
  const clinicalPermissions = await prisma.permission.findMany({
    where: {
      subject: {
        in: ['Tutor', 'Pet', 'Appointment', 'MedicalRecord']
      }
    }
  });
  await prisma.role.update({
    where: { name: 'VETERINARIO' },
    data: {
      permissions: {
        connect: clinicalPermissions.map(p => ({ id: p.id }))
      }
    }
  });

  // FUNCIONARIO - Permissões básicas (view e create)
  const basicPermissions = await prisma.permission.findMany({
    where: {
      action: {
        in: ['view', 'create']
      },
      subject: {
        in: ['Tutor', 'Pet', 'Appointment']
      }
    }
  });
  await prisma.role.update({
    where: { name: 'FUNCIONARIO' },
    data: {
      permissions: {
        connect: basicPermissions.map(p => ({ id: p.id }))
      }
    }
  });

  // FINANCEIRO - Permissões financeiras e view de outros
  const financialPermissions = await prisma.permission.findMany({
    where: {
      OR: [
        { subject: 'Financials' },
        { action: 'view', subject: { in: ['Tutor', 'Pet', 'Appointment'] } }
      ]
    }
  });
  await prisma.role.update({
    where: { name: 'FINANCEIRO' },
    data: {
      permissions: {
        connect: financialPermissions.map(p => ({ id: p.id }))
      }
    }
  });

  // 4. Criar usuário de teste
  console.log('👤 Criando usuário de teste...');
  const hashedPassword = await bcrypt.hash('123456', 10);
  
  await prisma.user.upsert({
    where: { email: 'admin@pulsevet.com' },
    update: {},
    create: {
      email: 'admin@pulsevet.com',
      name: 'Dr. Admin PulseVet',
      password: hashedPassword,
      roleName: 'DONO',
    },
  });

  // Criar mais alguns usuários de teste
  const testUsers = [
    {
      email: 'veterinario@pulsevet.com',
      name: 'Dra. Maria Silva',
      password: await bcrypt.hash('123456', 10),
      roleName: 'VETERINARIO',
    },
    {
      email: 'funcionario@pulsevet.com',
      name: 'João Santos',
      password: await bcrypt.hash('123456', 10),
      roleName: 'FUNCIONARIO',
    },
    {
      email: 'financeiro@pulsevet.com',
      name: 'Ana Costa',
      password: await bcrypt.hash('123456', 10),
      roleName: 'FINANCEIRO',
    },
  ];

  for (const user of testUsers) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user as any,
    });
  }

  console.log('✅ Seed concluído com sucesso!');
  console.log('\n📧 Usuários criados:');
  console.log('- admin@pulsevet.com (senha: 123456) - DONO');
  console.log('- veterinario@pulsevet.com (senha: 123456) - VETERINARIO');
  console.log('- funcionario@pulsevet.com (senha: 123456) - FUNCIONARIO');
  console.log('- financeiro@pulsevet.com (senha: 123456) - FINANCEIRO');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });