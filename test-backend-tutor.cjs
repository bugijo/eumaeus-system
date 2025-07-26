const { PrismaClient } = require('./backend/node_modules/.prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function testBackendTutor() {
  try {
    console.log('🔍 Verificando tutor no banco do backend...');
    
    // Buscar o AuthProfile do tutor
    const authProfile = await prisma.authProfile.findUnique({
      where: { email: 'tutor@example.com' },
      include: {
        tutor: true,
        user: true
      }
    });
    
    if (!authProfile) {
      console.log('❌ AuthProfile não encontrado para tutor@example.com');
      
      // Listar todos os AuthProfiles
      const allProfiles = await prisma.authProfile.findMany({
        include: {
          tutor: true,
          user: true
        }
      });
      
      console.log('📋 Todos os AuthProfiles encontrados:');
      allProfiles.forEach(profile => {
        console.log(`  - Email: ${profile.email}`);
        console.log(`  - Tem tutor: ${!!profile.tutor}`);
        console.log(`  - Tem user: ${!!profile.user}`);
        if (profile.tutor) {
          console.log(`  - Nome do tutor: ${profile.tutor.name}`);
        }
        console.log('  ---');
      });
      
      return;
    }
    
    console.log('✅ AuthProfile encontrado!');
    console.log(`📧 Email: ${authProfile.email}`);
    console.log(`👤 Tem tutor: ${!!authProfile.tutor}`);
    console.log(`🏢 Tem user: ${!!authProfile.user}`);
    
    if (authProfile.tutor) {
      console.log(`📝 Nome do tutor: ${authProfile.tutor.name}`);
    }
    
    // Testar a senha
    const testPassword = '123456';
    const isPasswordValid = await bcrypt.compare(testPassword, authProfile.password);
    
    console.log(`🔐 Teste de senha '${testPassword}': ${isPasswordValid ? '✅ Válida' : '❌ Inválida'}`);
    console.log(`🔑 Hash armazenado: ${authProfile.password}`);
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testBackendTutor();