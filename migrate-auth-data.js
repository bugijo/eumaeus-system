import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import scriptSafety from './script-safety.cjs';

const { assertMutationScriptAllowed, requireScriptSecret } = scriptSafety;
assertMutationScriptAllowed('ALLOW_LEGACY_AUTH_MIGRATION');
const migrationTemporaryPassword = requireScriptSecret('MIGRATE_AUTH_TEMP_PASSWORD');

const prisma = new PrismaClient();

async function migrateAuthData() {
  try {
    console.log('🚀 Iniciando migração de dados de autenticação...');

    // Verificar se já existem AuthProfiles
    const existingAuthProfiles = await prisma.authProfile.count();
    if (existingAuthProfiles > 0) {
      console.log('⚠️  AuthProfiles já existem. Pulando migração.');
      return;
    }

    // Buscar todos os usuários que precisam de AuthProfile
    const usersWithoutAuth = await prisma.user.findMany({
      where: {
        authProfileId: null
      }
    });

    console.log(`📊 Encontrados ${usersWithoutAuth.length} usuários para migrar`);

    // Criar AuthProfiles para usuários existentes
    for (const user of usersWithoutAuth) {
      // Gerar email temporário se não existir
      const email = `user${user.id}@clinic.local`;
      const hashedPassword = await bcrypt.hash(migrationTemporaryPassword, 10);

      console.log(`👤 Criando AuthProfile para usuário: ${user.name}`);

      // Criar AuthProfile
      const authProfile = await prisma.authProfile.create({
        data: {
          email,
          password: hashedPassword
        }
      });

      // Atualizar User com authProfileId
      await prisma.user.update({
        where: { id: user.id },
        data: { authProfileId: authProfile.id }
      });

      console.log(`✅ Usuário ${user.name} migrado com email: ${email}`);
    }

    // Criar um usuário admin padrão se não existir
    const adminUser = await prisma.user.findFirst({
      where: { roleName: 'ADMIN' }
    });

    if (!adminUser) {
      console.log('👑 Criando usuário admin padrão...');
      
      const adminAuthProfile = await prisma.authProfile.create({
        data: {
          email: 'admin@clinic.local',
          password: await bcrypt.hash(migrationTemporaryPassword, 10)
        }
      });

      await prisma.user.create({
        data: {
          name: 'Administrador',
          roleName: 'ADMIN',
          authProfileId: adminAuthProfile.id
        }
      });

      console.log('✅ Usuário admin criado; credencial temporária não exibida.');
    }

    // Criar um tutor de exemplo com AuthProfile
    const tutorWithAuth = await prisma.tutor.findFirst({
      where: { authProfileId: { not: null } }
    });

    if (!tutorWithAuth) {
      console.log('🐕 Criando tutor de exemplo...');
      
      const tutorAuthProfile = await prisma.authProfile.create({
        data: {
          email: 'tutor@example.com',
          password: await bcrypt.hash(migrationTemporaryPassword, 10)
        }
      });

      await prisma.tutor.create({
        data: {
          name: 'João Silva',
          email: 'tutor@example.com',
          phone: '(11) 99999-9999',
          address: 'Rua das Flores, 123',
          authProfileId: tutorAuthProfile.id
        }
      });

      console.log('✅ Tutor de exemplo criado; credencial temporária não exibida.');
    }

    console.log('🎉 Migração de dados concluída com sucesso!');
    console.log('Credencial temporária fornecida via MIGRATE_AUTH_TEMP_PASSWORD; valor não exibido.');

  } catch (error) {
    console.error('❌ Erro durante a migração de autenticação.');
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

migrateAuthData();
