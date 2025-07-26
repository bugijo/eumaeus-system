const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function debugTutorAuth() {
  try {
    console.log('🔍 Debug completo da autenticação do tutor...');
    
    // 1. Buscar AuthProfile
    const authProfile = await prisma.authProfile.findUnique({
      where: { email: 'tutor@example.com' },
      include: {
        user: { include: { role: true } },
        tutor: true
      }
    });
    
    if (!authProfile) {
      console.log('❌ AuthProfile não encontrado!');
      return;
    }
    
    console.log('✅ AuthProfile encontrado:');
    console.log(`   - ID: ${authProfile.id}`);
    console.log(`   - Email: ${authProfile.email}`);
    console.log(`   - Senha: ${authProfile.password ? 'Presente' : 'NULL'}`);
    console.log(`   - User associado: ${authProfile.user ? 'SIM' : 'NÃO'}`);
    console.log(`   - Tutor associado: ${authProfile.tutor ? 'SIM' : 'NÃO'}`);
    
    if (authProfile.tutor) {
      console.log('\n👤 Dados do Tutor:');
      console.log(`   - ID: ${authProfile.tutor.id}`);
      console.log(`   - Nome: ${authProfile.tutor.name}`);
      console.log(`   - Email: ${authProfile.tutor.email}`);
      console.log(`   - AuthProfile ID: ${authProfile.tutor.authProfileId}`);
    }
    
    // 2. Testar senha
    if (authProfile.password) {
      const isValid = await bcrypt.compare('123456', authProfile.password);
      console.log(`\n🔐 Teste de senha '123456': ${isValid ? '✅ VÁLIDA' : '❌ INVÁLIDA'}`);
    }
    
    // 3. Buscar tutor diretamente
    const tutor = await prisma.tutor.findUnique({
      where: { email: 'tutor@example.com' }
    });
    
    if (tutor) {
      console.log('\n🔗 Relação Tutor -> AuthProfile:');
      console.log(`   - Tutor ID: ${tutor.id}`);
      console.log(`   - AuthProfile ID no Tutor: ${tutor.authProfileId}`);
      console.log(`   - AuthProfile ID real: ${authProfile.id}`);
      console.log(`   - Relação correta: ${tutor.authProfileId === authProfile.id ? '✅ SIM' : '❌ NÃO'}`);
    }
    
  } catch (error) {
    console.error('💥 Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

debugTutorAuth();