import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

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
      const password = '***REMOVIDO***'; // Senha temporária
      const hashedPassword = await bcrypt.hash(password, 10);

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
          password: await bcrypt.hash('***REMOVIDO***', 10)
        }
      });

      await prisma.user.create({
        data: {
          name: 'Administrador',
          roleName: 'ADMIN',
          authProfileId: adminAuthProfile.id
        }
      });

      console.log('✅ Usuário admin criado com email: admin@clinic.local e senha: admin123');
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
          password: await bcrypt.hash('***REMOVIDO***', 10)
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

      console.log('✅ Tutor de exemplo criado com email: tutor@example.com e senha: tutor123');
    }

    console.log('🎉 Migração de dados concluída com sucesso!');
    console.log('\n📋 Credenciais de teste:');
    console.log('   Admin: admin@clinic.local / admin123');
    console.log('   Tutor: tutor@example.com / tutor123');

  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateAuthData();