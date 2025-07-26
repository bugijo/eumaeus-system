const bcrypt = require('bcrypt');
const { PrismaClient } = require('./backend/node_modules/.prisma/client');

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
    console.log('   - Hash armazenado:', authProfile.password);
    
    // Testar a senha
    const senhaTexto = '***REMOVIDO***';
    console.log('\n🧪 Testando senha:', senhaTexto);
    
    // Verificar se o hash é válido
    const isValidHash = authProfile.password && authProfile.password.startsWith('$2');
    console.log('   - Hash válido (formato bcrypt):', isValidHash);
    
    if (isValidHash) {
      const isMatch = await bcrypt.compare(senhaTexto, authProfile.password);
      console.log('   - Senha confere:', isMatch ? '✅ SIM' : '❌ NÃO');
    } else {
      console.log('   - ❌ Hash inválido ou não é bcrypt');
    }
    
    // Gerar um novo hash para comparação
    console.log('\n🔄 Gerando novo hash para comparação...');
    const novoHash = await bcrypt.hash(senhaTexto, 10);
    console.log('   - Novo hash:', novoHash);
    
    const novoMatch = await bcrypt.compare(senhaTexto, novoHash);
    console.log('   - Novo hash confere:', novoMatch ? '✅ SIM' : '❌ NÃO');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testBcrypt();