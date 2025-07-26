const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function fixTutorPassword() {
  try {
    console.log('🔧 Corrigindo senha do tutor de teste...');
    
    // Gerar hash da senha '***REMOVIDO***'
    const password = '***REMOVIDO***';
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    console.log(`🔐 Gerando hash para senha: ${password}`);
    console.log(`📝 Hash gerado: ${passwordHash.substring(0, 20)}...`);
    
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
    
    console.log('\n🎯 Dados de login atualizados:');
    console.log('   - Email: tutor@example.com');
    console.log('   - Senha: 123456');
    
  } catch (error) {
    console.error('💥 Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixTutorPassword();