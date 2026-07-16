const { PrismaClient } = require('./backend/node_modules/.prisma/client');
const bcrypt = require('bcrypt');
const { assertMutationScriptAllowed, requireScriptSecret } = require('./script-safety.cjs');

assertMutationScriptAllowed('ALLOW_CREDENTIAL_DIAGNOSTICS');
const submittedPassword = requireScriptSecret('TEST_TUTOR_PASSWORD');

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
    const isPasswordValid = await bcrypt.compare(submittedPassword, authProfile.password);
    
    console.log(`🔐 Credencial fornecida via ambiente: ${isPasswordValid ? '✅ Válida' : '❌ Inválida'}`);
    console.log('🔑 Hash armazenado: presente; valor não exibido');
    
  } catch {
    console.error('❌ Falha no diagnóstico do tutor.');
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

testBackendTutor();
