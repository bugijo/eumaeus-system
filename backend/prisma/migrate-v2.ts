// Script de Migração de Dados V2.0
// Este script migra dados da V1.0 para V2.0, criando AuthProfiles para usuários existentes

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { assertMutationScriptAllowed, requireScriptSecret } from '../src/config/scriptSafety';

assertMutationScriptAllowed('ALLOW_LEGACY_AUTH_MIGRATION');
const migrationTemporaryPassword = requireScriptSecret('MIGRATE_V2_TEMP_PASSWORD');
const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Iniciando migração de dados V1.0 → V2.0...');
  
  try {
    // 1. Verificar se há usuários e AuthProfiles no banco
    const totalUsers = await prisma.user.count();
    const totalAuthProfiles = await prisma.authProfile.count();
    
    console.log(`📊 Total de usuários: ${totalUsers}`);
    console.log(`📊 Total de AuthProfiles: ${totalAuthProfiles}`);
    
    // 2. Verificar se todos os usuários têm AuthProfile válido
    const usersWithAuthProfile = await prisma.user.findMany({
      include: {
        authProfile: true
      }
    });
    
    const usersWithoutValidAuth = usersWithAuthProfile.filter(user => !user.authProfile);
    
    console.log(`📊 Usuários sem AuthProfile válido: ${usersWithoutValidAuth.length}`);

    if (usersWithoutValidAuth.length === 0) {
      console.log('✅ Todos os usuários já possuem AuthProfile válido. Migração não necessária.');
      return;
    }

    // 3. Migrar cada usuário sem AuthProfile válido
    for (const user of usersWithoutValidAuth) {
      console.log(`🔄 Migrando usuário: ${user.name}`);
      
      // Criar novo AuthProfile com email baseado no nome do usuário
      const email = `${user.name.toLowerCase().replace(/\s+/g, '.')}@eumaeus.com`;
      const hashedPassword = await bcrypt.hash(migrationTemporaryPassword, 10);
      
      try {
        const authProfile = await prisma.authProfile.create({
          data: {
            email: email,
            password: hashedPassword,
          },
        });
        
        console.log(`✅ AuthProfile criado para ${email}`);

        // 4. Vincular AuthProfile ao User
        await prisma.user.update({
          where: { id: user.id },
          data: { authProfileId: authProfile.id },
        });
        
        console.log(`🔗 AuthProfile vinculado ao usuário ${user.name}`);
      } catch (error) {
        console.error(`❌ Erro ao migrar usuário ${user.name}:`, error);
        // Se o email já existe, tentar com um sufixo
        const fallbackEmail = `${user.name.toLowerCase().replace(/\s+/g, '.')}.${user.id}@eumaeus.com`;
        
        try {
          const authProfile = await prisma.authProfile.create({
            data: {
              email: fallbackEmail,
              password: hashedPassword,
            },
          });
          
          await prisma.user.update({
            where: { id: user.id },
            data: { authProfileId: authProfile.id },
          });
          
          console.log(`✅ AuthProfile criado com email alternativo: ${fallbackEmail}`);
        } catch (fallbackError) {
          console.error(`❌ Falha total na migração do usuário ${user.name}:`, fallbackError);
        }
      }
    }

    // 5. Verificar integridade dos dados após migração
    const finalCheck = await prisma.user.findMany({
      include: {
        authProfile: true
      }
    });
    
    const stillWithoutAuth = finalCheck.filter(user => !user.authProfile);

    if (stillWithoutAuth.length === 0) {
      console.log('✅ Migração concluída com sucesso!');
      console.log('📋 Resumo da migração:');
      console.log(`   - ${usersWithoutValidAuth.length} usuários migrados`);
      console.log('   - Todos os usuários agora possuem AuthProfile válido');
      console.log('⚠️  IMPORTANTE: a senha temporária foi fornecida via MIGRATE_V2_TEMP_PASSWORD e não será exibida');
      console.log('   - Solicite que os usuários alterem a senha no primeiro login');
    } else {
      console.error(`❌ Erro: ${stillWithoutAuth.length} usuários ainda sem AuthProfile`);
      stillWithoutAuth.forEach(user => {
        console.error(`   - ${user.name} (ID: ${user.id})`);
      });
    }

  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
    throw error;
  }
}

// Executar migração
main()
  .catch((e) => {
    console.error('💥 Falha na migração:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('🔌 Conexão com banco encerrada');
  });

// Exportar para uso em outros scripts se necessário
export { main as migrateV2Data };
