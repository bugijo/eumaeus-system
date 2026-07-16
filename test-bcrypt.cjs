const bcrypt = require('bcrypt');
const { PrismaClient } = require('./backend/node_modules/.prisma/client');
const { assertMutationScriptAllowed, requireScriptSecret } = require('./script-safety.cjs');

assertMutationScriptAllowed('ALLOW_CREDENTIAL_DIAGNOSTICS');
const submittedPassword = requireScriptSecret('TEST_TUTOR_PASSWORD');

async function testBcrypt() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔐 Testando comparação de senha com bcrypt...');
    
    // Buscar o AuthProfile do tutor
    const authProfile = await prisma.authProfile.findUnique({
      where: { email: 'tutor@example.com' }
    });
    
    if (!authProfile) {
      console.log('❌ AuthProfile não encontrado');
      return;
    }
    
    console.log('✅ AuthProfile encontrado:');
    console.log('   - Email:', authProfile.email);
    console.log('   - Hash armazenado: presente; valor não exibido');
    
    // Verificar se o hash é válido
    const isValidHash = authProfile.password && authProfile.password.startsWith('$2');
    console.log('   - Hash válido (formato bcrypt):', isValidHash);
    
    if (isValidHash) {
      const isMatch = await bcrypt.compare(submittedPassword, authProfile.password);
      console.log('   - Senha confere:', isMatch ? '✅ SIM' : '❌ NÃO');
    } else {
      console.log('   - ❌ Hash inválido ou não é bcrypt');
    }
    
    // Gerar um novo hash para comparação
    console.log('\n🔄 Gerando novo hash para comparação...');
    const novoHash = await bcrypt.hash(submittedPassword, 10);
    console.log('   - Novo hash: gerado; valor não exibido');
    
    const novoMatch = await bcrypt.compare(submittedPassword, novoHash);
    console.log('   - Novo hash confere:', novoMatch ? '✅ SIM' : '❌ NÃO');
    
  } catch {
    console.error('❌ Falha no diagnóstico bcrypt.');
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

testBcrypt();
