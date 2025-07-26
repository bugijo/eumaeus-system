const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addTestData() {
  try {
    console.log('🚀 Adicionando dados de teste...');

    // Criar tutores de teste
    const tutor1 = await prisma.tutor.create({
      data: {
        name: 'João Silva',
        email: 'joao@email.com',
        phone: '(11) 99999-1111',
        address: 'Rua das Flores, 123'
      }
    });

    const tutor2 = await prisma.tutor.create({
      data: {
        name: 'Maria Santos',
        email: 'maria@email.com',
        phone: '(11) 99999-2222',
        address: 'Av. Principal, 456'
      }
    });

    console.log('✅ Tutores criados');

    // Criar pets de teste
    const pet1 = await prisma.pet.create({
      data: {
        name: 'Rex',
        species: 'Cachorro',
        breed: 'Golden Retriever',
        birthDate: new Date('2020-05-15'),
        tutorId: tutor1.id
      }
    });

    const pet2 = await prisma.pet.create({
      data: {
        name: 'Mimi',
        species: 'Gato',
        breed: 'Persa',
        birthDate: new Date('2021-03-10'),
        tutorId: tutor2.id
      }
    });

    console.log('✅ Pets criados');

    // Criar agendamentos de teste
    const appointment1 = await prisma.appointment.create({
      data: {
        appointmentDate: new Date('2025-01-28T10:00:00'),
        status: 'COMPLETED',
        notes: 'Consulta de rotina',
        petId: pet1.id,
        tutorId: tutor1.id
      }
    });

    const appointment2 = await prisma.appointment.create({
      data: {
        appointmentDate: new Date('2025-01-29T14:00:00'),
        status: 'COMPLETED',
        notes: 'Vacinação',
        petId: pet2.id,
        tutorId: tutor2.id
      }
    });

    console.log('✅ Agendamentos criados');

    // Criar prontuários de teste
    const medicalRecord1 = await prisma.medicalRecord.create({
      data: {
        symptoms: 'Tosse e espirros',
        diagnosis: 'Resfriado canino',
        treatment: 'Repouso e medicação',
        notes: 'Retorno em 7 dias',
        appointmentId: appointment1.id
      }
    });

    const medicalRecord2 = await prisma.medicalRecord.create({
      data: {
        symptoms: 'Prevenção',
        diagnosis: 'Animal saudável',
        treatment: 'Vacinação V4',
        notes: 'Próxima dose em 30 dias',
        appointmentId: appointment2.id
      }
    });

    console.log('✅ Prontuários criados');
    console.log('🎉 Dados de teste adicionados com sucesso!');
    console.log(`📋 Criados: ${tutor1.name} (${pet1.name}) e ${tutor2.name} (${pet2.name})`);

  } catch (error) {
    console.error('❌ Erro ao adicionar dados de teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addTestData();