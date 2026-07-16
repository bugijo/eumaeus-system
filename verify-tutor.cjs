const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const { assertMutationScriptAllowed, requireScriptSecret } = require('./script-safety.cjs');

assertMutationScriptAllowed('ALLOW_CREDENTIAL_DIAGNOSTICS');
const submittedPassword = requireScriptSecret('TEST_TUTOR_PASSWORD');

const prisma = new PrismaClient();

async function verifyTutor() {
  try {
    console.log('🔍 Verificando dados do tutor de teste...');
    
    // Buscar o AuthProfile do tutor
    const authProfile = await prisma.authProfile.findUnique({
      where: { email: 'tutor@example.com' }
    });
    
    if (!authProfile) {
      console.log('❌ AuthProfile não encontrado para tutor@example.com');
      return;
    }
    
    console.log('✅ AuthProfile encontrado:');
    console.log(`   - ID: ${authProfile.id}`);
    console.log(`   - Email: ${authProfile.email}`);
    console.log(`   - Senha Hash: ${authProfile.password ? 'presente; valor não exibido' : 'NULL'}`);
    
    if (!authProfile.password) {
      console.log('❌ Senha hash está NULL! O usuário não pode fazer login.');
      return;
    }
    
    // Buscar o Tutor associado
    const tutor = await prisma.tutor.findUnique({
      where: { authProfileId: authProfile.id }
    });
    
    if (!tutor) {
      console.log('❌ Tutor não encontrado para este AuthProfile');
      return;
    }
    
    console.log('✅ Tutor encontrado:');
    console.log(`   - ID: ${tutor.id}`);
    console.log(`   - Nome: ${tutor.name}`);
    console.log(`   - Email: ${tutor.email}`);
    console.log(`   - Telefone: ${tutor.phone}`);
    
    const isValid = await bcrypt.compare(submittedPassword, authProfile.password);
    console.log(`\n🔐 Credencial fornecida via ambiente: ${isValid ? '✅ VÁLIDA' : '❌ inválida'}`);
    
    // Buscar pets do tutor
    const pets = await prisma.pet.findMany({
      where: { tutorId: tutor.id }
    });
    
    console.log(`\n🐕 Pets encontrados: ${pets.length}`);
    pets.forEach(pet => {
      console.log(`   - ${pet.name} (${pet.species})`);
    });
    
  } catch {
    console.error('💥 Falha na verificação do tutor.');
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

verifyTutor();
