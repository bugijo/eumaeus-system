const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const { assertMutationScriptAllowed, requireScriptSecret } = require('./script-safety.cjs');

assertMutationScriptAllowed('ALLOW_TEST_DATA_MUTATION');
const password = requireScriptSecret('TEST_TUTOR_PASSWORD');

const prisma = new PrismaClient();

async function fixTutorPassword() {
  try {
    console.log('🔧 Corrigindo senha do tutor de teste...');
    
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    console.log('🔐 Gerando hash a partir de TEST_TUTOR_PASSWORD; valor não exibido.');
    
    // Atualizar o AuthProfile
    const updatedAuth = await prisma.authProfile.update({
      where: { email: 'tutor@example.com' },
      data: { password: passwordHash }
    });
    
    console.log('✅ Senha atualizada com sucesso!');
    console.log(`   - AuthProfile ID: ${updatedAuth.id}`);
    console.log(`   - Email: ${updatedAuth.email}`);
    
    // Verificar se a senha funciona
    const isValid = await bcrypt.compare(password, passwordHash);
    console.log(`🧪 Teste de validação: ${isValid ? '✅ PASSOU' : '❌ FALHOU'}`);
    
    console.log('\n🎯 Dados de login atualizados; senha não exibida.');
    
  } catch (error) {
    console.error('💥 Falha ao atualizar a senha de teste.');
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

fixTutorPassword();
