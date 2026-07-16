import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import scriptSafety from '../script-safety.cjs';

const { assertMutationScriptAllowed, requireScriptSecret } = scriptSafety;

assertMutationScriptAllowed('ALLOW_TEST_DATA_MUTATION');
const staffPassword = requireScriptSecret('SEED_STAFF_PASSWORD');

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

  // 4. Criar usuários de teste com nova estrutura AuthProfile
  console.log('👤 Criando usuários de teste...');
  const hashedPassword = await bcrypt.hash(staffPassword, 10);
  
  // Definir usuários de teste
  const testUsers = [
    {
      email: 'admin@eumaeus.com',
      name: 'Dr. Admin Eumaeus',
      roleName: 'DONO',
    },
    {
      email: 'veterinario@eumaeus.com',
      name: 'Dra. Maria Silva',
      roleName: 'VETERINARIO',
    },
    {
      email: 'funcionario@eumaeus.com',
      name: 'João Santos',
      roleName: 'FUNCIONARIO',
    },
    {
      email: 'financeiro@eumaeus.com',
      name: 'Ana Costa',
      roleName: 'FINANCEIRO',
    },
  ];

  // Criar cada usuário com AuthProfile + User
  for (const userData of testUsers) {
    // Verificar se o AuthProfile já existe
    const existingAuthProfile = await prisma.authProfile.findUnique({
      where: { email: userData.email }
    });

    if (!existingAuthProfile) {
      // Criar AuthProfile
      const authProfile = await prisma.authProfile.create({
        data: {
          email: userData.email,
          password: hashedPassword,
        }
      });

      // Criar User linkado ao AuthProfile
      await prisma.user.create({
        data: {
          name: userData.name,
          roleName: userData.roleName as any,
          authProfileId: authProfile.id,
        }
      });

      console.log(`✅ Usuário criado: ${userData.email}`);
    } else {
      console.log(`ℹ️  Usuário já existe: ${userData.email}`);
    }
  }

  console.log('✅ Seed concluído com sucesso!');
  console.log('Credenciais de seed configuradas via SEED_STAFF_PASSWORD; valor não exibido.');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
