const { PrismaClient } = require('./backend/node_modules/.prisma/client');

async function listAuthProfiles() {
  const prisma = new PrismaClient();
  
  try {
    console.log('📋 Listando todos os AuthProfiles...');
    
    const authProfiles = await prisma.authProfile.findMany({
      include: {
        user: true,
        tutor: true
      }
    });
    
    console.log(`✅ Encontrados ${authProfiles.length} AuthProfiles:`);
    
    authProfiles.forEach((profile, index) => {
      console.log(`\n${index + 1}. AuthProfile ID: ${profile.id}`);
      console.log(`   - Email: ${profile.email}`);
      console.log(`   - Senha: ${profile.password ? 'Presente' : 'NULL'}`);
      console.log(`   - User associado: ${profile.user ? 'SIM' : 'NÃO'}`);
      console.log(`   - Tutor associado: ${profile.tutor ? 'SIM' : 'NÃO'}`);
      
      if (profile.tutor) {
        console.log(`   - Nome do Tutor: ${profile.tutor.nome}`);
      }
    });
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

listAuthProfiles();