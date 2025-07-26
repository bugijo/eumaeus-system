const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createTutorTest() {
  console.log('🧪 Criando tutor de teste para o portal do cliente...');

  try {
    // 1. Verificar se já existe e criar/atualizar AuthProfile para o tutor
    const hashedPassword = await bcrypt.hash('123456', 10);
    
    const authProfile = await prisma.authProfile.upsert({
      where: { email: 'tutor@example.com' },
      update: { password: hashedPassword },
      create: {
        email: 'tutor@example.com',
        password: hashedPassword,
      },
    });

    // 2. Criar/atualizar o Tutor
    const tutor = await prisma.tutor.upsert({
      where: { email: 'tutor@example.com' },
      update: {
        name: 'João Silva',
        phone: '(11) 99999-9999',
        address: 'Rua das Flores, 123 - São Paulo, SP',
        authProfileId: authProfile.id,
      },
      create: {
        name: 'João Silva',
        email: 'tutor@example.com',
        phone: '(11) 99999-9999',
        address: 'Rua das Flores, 123 - São Paulo, SP',
        authProfileId: authProfile.id,
      },
    });

    // 3. Criar pets para o tutor
    const rex = await prisma.pet.create({
      data: {
        name: 'Rex',
        species: 'Cachorro',
        breed: 'Golden Retriever',
        birthDate: new Date('2020-05-15'),
        tutorId: tutor.id,
      },
    });

    const mimi = await prisma.pet.create({
      data: {
        name: 'Mimi',
        species: 'Gato',
        breed: 'SRD',
        birthDate: new Date('2021-08-20'),
        tutorId: tutor.id,
      },
    });

    // 4. Criar alguns agendamentos de exemplo
    const appointment1 = await prisma.appointment.create({
      data: {
        appointmentDate: new Date('2024-01-20T10:00:00'),
        status: 'COMPLETED',
        notes: 'Consulta de rotina',
        petId: rex.id,
        tutorId: tutor.id,
      },
    });

    const appointment2 = await prisma.appointment.create({
      data: {
        appointmentDate: new Date('2024-01-25T14:30:00'),
        status: 'SCHEDULED',
        notes: 'Vacinação anual',
        petId: mimi.id,
        tutorId: tutor.id,
      },
    });

    // 5. Criar prontuário para o agendamento concluído
    await prisma.medicalRecord.create({
      data: {
        symptoms: 'Animal apresentava-se bem, sem sintomas aparentes',
        diagnosis: 'Animal saudável',
        treatment: 'Recomendado manter cuidados de rotina',
        notes: 'Próxima consulta em 6 meses',
        appointmentId: appointment1.id,
      },
    });

    console.log('✅ Tutor de teste criado com sucesso!');
    console.log('\n📧 Dados de login:');
    console.log('- Email: tutor@example.com');
    console.log('- Senha: 123456');
    console.log('\n🐕 Pets criados:');
    console.log('- Rex (Golden Retriever)');
    console.log('- Mimi (Gato SRD)');
    console.log('\n📅 Agendamentos:');
    console.log('- Rex: Consulta concluída (20/01/2024)');
    console.log('- Mimi: Vacinação agendada (25/01/2024)');

  } catch (error) {
    console.error('❌ Erro ao criar tutor de teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTutorTest();