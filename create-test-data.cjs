const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const { assertMutationScriptAllowed, requireScriptSecret } = require('./script-safety.cjs');

assertMutationScriptAllowed('ALLOW_DESTRUCTIVE_TEST_DATA');
const adminPassword = requireScriptSecret('TEST_ADMIN_PASSWORD');
const veterinarianPassword = requireScriptSecret('TEST_VET_PASSWORD');

const prisma = new PrismaClient();

async function createTestData() {
  try {
    console.log('🚀 Criando dados de teste para autenticação dual...');

    // Limpar dados existentes (respeitando ordem de dependências)
    await prisma.pet.deleteMany();
    await prisma.user.deleteMany();
    await prisma.tutor.deleteMany();
    await prisma.authProfile.deleteMany();
    await prisma.permission.deleteMany();
    await prisma.role.deleteMany();

    console.log('🧹 Dados existentes removidos');

    // Criar Permissions
    const permissions = await Promise.all([
      prisma.permission.create({ data: { action: 'view', subject: 'User' } }),
      prisma.permission.create({ data: { action: 'create', subject: 'User' } }),
      prisma.permission.create({ data: { action: 'edit', subject: 'User' } }),
      prisma.permission.create({ data: { action: 'delete', subject: 'User' } }),
      prisma.permission.create({ data: { action: 'view', subject: 'Appointment' } }),
      prisma.permission.create({ data: { action: 'edit', subject: 'Appointment' } }),
      prisma.permission.create({ data: { action: 'create', subject: 'MedicalRecord' } }),
      prisma.permission.create({ data: { action: 'view', subject: 'MedicalRecord' } }),
      // Permissões financeiras
      prisma.permission.create({ data: { action: 'view', subject: 'Invoice' } }),
      prisma.permission.create({ data: { action: 'create', subject: 'Invoice' } }),
      prisma.permission.create({ data: { action: 'edit', subject: 'Invoice' } }),
      prisma.permission.create({ data: { action: 'view', subject: 'FinancialStats' } })
    ]);

    console.log('✅ Permissions criadas');

    // Criar Roles
    const funcionarioRole = await prisma.role.create({
      data: {
        name: 'FUNCIONARIO',
        description: 'Funcionário administrativo',
        permissions: {
          connect: [
            ...permissions.slice(0, 4).map(p => ({ id: p.id })), // Permissões de usuário
            ...permissions.slice(8).map(p => ({ id: p.id })) // Permissões financeiras
          ]
        }
      }
    });

    const vetRole = await prisma.role.create({
      data: {
        name: 'VETERINARIO',
        description: 'Veterinário',
        permissions: {
          connect: [
            ...permissions.slice(4, 8).map(p => ({ id: p.id })), // Permissões médicas
            permissions[8], // view Invoice
            permissions[11] // view FinancialStats
          ].map(p => ({ id: p.id }))
        }
      }
    });

    console.log('✅ Roles criadas');

    // Criar AuthProfiles com senhas hash
    const adminAuthProfile = await prisma.authProfile.create({
      data: {
        email: 'admin@clinic.local',
        password: await bcrypt.hash(adminPassword, 10)
      }
    });

    const vetAuthProfile = await prisma.authProfile.create({
      data: {
        email: 'vet@clinic.local',
        password: await bcrypt.hash(veterinarianPassword, 10)
      }
    });



    console.log('✅ AuthProfiles criados');

    // Criar Users
    const adminUser = await prisma.user.create({
      data: {
        name: 'Administrador',
        roleName: 'FUNCIONARIO',
        authProfileId: adminAuthProfile.id
      }
    });

    const vetUser = await prisma.user.create({
      data: {
        name: 'Dr. Maria Silva',
        roleName: 'VETERINARIO',
        authProfileId: vetAuthProfile.id
      }
    });

    console.log('✅ Users criados');





    console.log('\n🎉 Dados de teste criados com sucesso!');
    console.log('\n📋 Credenciais definidas por variáveis de ambiente; valores não exibidos.');
    console.log('\n🔗 Teste a API em: http://localhost:3333/api/auth/login');

  } catch (error) {
    console.error('❌ Erro ao criar dados de teste.');
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

createTestData();
