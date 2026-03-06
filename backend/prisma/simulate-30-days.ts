import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const SIM_DAYS = Number(process.env.SIM_DAYS || 30);
const DEFAULT_PASSWORD = process.env.SIM_DEFAULT_PASSWORD || '123456';

type StaffUserSeed = {
  email: string;
  name: string;
  roleName: string;
};

const staffUsers: StaffUserSeed[] = [
  { email: 'admin@eumaeus.com', name: 'Administrador', roleName: 'DONO' },
  { email: 'recepcao@eumaeus.com', name: 'Joao da Recepcao', roleName: 'RECEPCAO' },
  { email: 'auxiliar@eumaeus.com', name: 'Ana Auxiliar', roleName: 'AUXILIAR' },
  { email: 'veterinario@eumaeus.com', name: 'Dra. Maria Silva', roleName: 'VETERINARIO' },
  { email: 'financeiro@eumaeus.com', name: 'Ana Costa', roleName: 'FINANCEIRO' },
];

const baseProducts = [
  { name: 'Vacina V10', category: 'Vacina', price: 90, quantity: 200 },
  { name: 'Vacina Antirrabica', category: 'Vacina', price: 70, quantity: 180 },
  { name: 'Vermifugo', category: 'Medicamento', price: 35, quantity: 150 },
  { name: 'Anti-inflamatorio', category: 'Medicamento', price: 42, quantity: 120 },
  { name: 'Kit Curativo', category: 'Material', price: 18, quantity: 300 },
];

const tutorFirstNames = [
  'Carlos', 'Mariana', 'Felipe', 'Patricia', 'Ricardo', 'Juliana', 'Anderson', 'Camila',
  'Lucas', 'Fernanda', 'Rafaela', 'Tiago', 'Amanda', 'Bruno', 'Sofia', 'Daniel',
];

const tutorLastNames = [
  'Silva', 'Santos', 'Souza', 'Oliveira', 'Pereira', 'Costa', 'Melo', 'Almeida',
  'Lima', 'Araujo', 'Nunes', 'Ferreira',
];

const petNames = [
  'Mel', 'Rex', 'Luna', 'Theo', 'Nina', 'Zeus', 'Bidu', 'Belinha',
  'Thor', 'Simba', 'Amora', 'Pandora', 'Bento', 'Maya', 'Fred', 'Kiara',
];

const speciesOptions = ['Cachorro', 'Gato'];
const breedsBySpecies: Record<string, string[]> = {
  Cachorro: ['SRD', 'Labrador', 'Poodle', 'Shih Tzu', 'Pastor Alemao', 'Bulldog Frances'],
  Gato: ['SRD', 'Siamês', 'Persa', 'Maine Coon', 'Angora', 'Bengal'],
};

const recordTexts = {
  symptoms: ['Apatia', 'Prurido leve', 'Febre baixa', 'Anorexia parcial', 'Tosse intermitente'],
  diagnosis: ['Gastroenterite leve', 'Dermatite alérgica', 'Infecção respiratória', 'Consulta de rotina'],
  treatment: ['Hidratação oral e dieta leve', 'Anti-inflamatório por 5 dias', 'Antibiótico por 7 dias', 'Acompanhamento clínico'],
};

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomPick<T>(items: T[]): T {
  return items[randomInt(0, items.length - 1)];
}

function randomDateWithinLastDays(days: number): Date {
  const now = new Date();
  const result = new Date(now);
  result.setDate(now.getDate() - randomInt(0, Math.max(0, days - 1)));
  result.setHours(randomInt(8, 18), randomPick([0, 15, 30, 45]), 0, 0);
  return result;
}

async function ensureRoles() {
  const roles = [
    { name: 'DONO', description: 'Acesso total ao sistema.' },
    { name: 'VETERINARIO', description: 'Acesso clinico e gerencial completo.' },
    { name: 'RECEPCAO', description: 'Acesso a agenda e cadastros.' },
    { name: 'AUXILIAR', description: 'Acesso operacional sem edicao de prontuario.' },
    { name: 'FINANCEIRO', description: 'Acesso financeiro.' },
    { name: 'FUNCIONARIO', description: 'Perfil legado.' },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name as any },
      update: { description: role.description },
      create: role as any,
    });
  }
}

async function ensureStaffUsers() {
  for (const staff of staffUsers) {
    const existingAuth = await prisma.authProfile.findUnique({
      where: { email: staff.email },
      include: { user: true },
    });

    let authProfileId = existingAuth?.id;
    if (!existingAuth) {
      const password = await bcrypt.hash(DEFAULT_PASSWORD, 10);
      const created = await prisma.authProfile.create({
        data: {
          email: staff.email,
          password,
        },
      });
      authProfileId = created.id;
    }

    if (!authProfileId) {
      continue;
    }

    if (!existingAuth?.user) {
      await prisma.user.create({
        data: {
          name: staff.name,
          roleName: staff.roleName as any,
          authProfileId,
        },
      });
    } else if (existingAuth.user.roleName !== staff.roleName) {
      await prisma.user.update({
        where: { id: existingAuth.user.id },
        data: { roleName: staff.roleName as any },
      });
    }
  }
}

async function ensureProducts() {
  for (const product of baseProducts) {
    const exists = await prisma.product.findFirst({
      where: { name: product.name },
    });

    if (!exists) {
      await prisma.product.create({
        data: product,
      });
    }
  }
}

async function createTutorsAndPets(days: number) {
  const tutorsToCreate = 45;
  const tutors = [];
  const runSuffix = Date.now().toString().slice(-6);

  for (let i = 0; i < tutorsToCreate; i++) {
    const fullName = `${randomPick(tutorFirstNames)} ${randomPick(tutorLastNames)}`;
    const email = `sim30d-${runSuffix}-${i + 1}@eumaeus.com`;
    const createdAt = randomDateWithinLastDays(days);

    const tutor = await prisma.tutor.create({
      data: {
        name: fullName,
        email,
        phone: `(11) 9${randomInt(1000, 9999)}-${randomInt(1000, 9999)}`,
        address: `Rua Simulada ${randomInt(1, 999)}, São Paulo`,
        createdAt,
        updatedAt: createdAt,
      },
    });
    tutors.push(tutor);

    const petsForTutor = randomInt(1, 3);
    for (let p = 0; p < petsForTutor; p++) {
      const species = randomPick(speciesOptions);
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - randomInt(1, 15));

      await prisma.pet.create({
        data: {
          name: randomPick(petNames),
          species,
          breed: randomPick(breedsBySpecies[species]),
          birthDate,
          tutorId: tutor.id,
          createdAt,
          updatedAt: createdAt,
        },
      });
    }
  }

  return tutors;
}

function generateAppointmentStatus(): string {
  const n = Math.random();
  if (n < 0.68) return 'COMPLETED';
  if (n < 0.82) return 'CONFIRMED';
  if (n < 0.92) return 'SCHEDULED';
  return 'CANCELLED';
}

function timeStringFromDate(date: Date): string {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

async function createAppointmentsForLastDays(days: number) {
  const pets = await prisma.pet.findMany({
    include: { tutor: true },
  });
  const products = await prisma.product.findMany();
  const vaccineProducts = products.filter((p) => p.category === 'Vacina');

  const counters = {
    appointments: 0,
    completed: 0,
    vaccines: 0,
    records: 0,
    invoices: 0,
    revenue: 0,
  };

  for (let day = days - 1; day >= 0; day--) {
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() - day);
    baseDate.setHours(0, 0, 0, 0);

    const appointmentsToday = randomInt(4, 10);
    for (let i = 0; i < appointmentsToday; i++) {
      const pet = randomPick(pets);
      const appointmentDate = new Date(baseDate);
      appointmentDate.setHours(randomInt(8, 18), randomPick([0, 15, 30, 45]), 0, 0);

      const status = generateAppointmentStatus();
      const appointment = await prisma.appointment.create({
        data: {
          appointmentDate,
          date: appointmentDate,
          time: timeStringFromDate(appointmentDate),
          status,
          notes: 'Agendamento gerado por simulacao de 30 dias.',
          petId: pet.id,
          tutorId: pet.tutorId,
          createdAt: appointmentDate,
          updatedAt: appointmentDate,
        },
      });
      counters.appointments += 1;
      if (status === 'COMPLETED') counters.completed += 1;

      const services = [
        { name: 'Consulta Clinica', price: 120 },
      ];

      if (Math.random() < 0.45) {
        services.push({ name: 'Vacinacao', price: 95 });
        counters.vaccines += 1;
      }
      if (Math.random() < 0.35) {
        services.push({ name: 'Exame Laboratorial', price: 140 });
      }
      if (Math.random() < 0.25) {
        services.push({ name: 'Procedimento de Curativo', price: 65 });
      }

      let totalAmount = 0;
      for (const service of services) {
        totalAmount += service.price;
        await prisma.service.create({
          data: {
            name: service.name,
            price: service.price,
            appointmentId: appointment.id,
          },
        });
      }

      if (status === 'COMPLETED') {
        const record = await prisma.medicalRecord.create({
          data: {
            appointmentId: appointment.id,
            symptoms: randomPick(recordTexts.symptoms),
            diagnosis: randomPick(recordTexts.diagnosis),
            treatment: randomPick(recordTexts.treatment),
            notes: 'Prontuario gerado na simulacao de 30 dias.',
            createdAt: appointmentDate,
            updatedAt: appointmentDate,
          },
        });
        counters.records += 1;

        if (services.some((s) => s.name === 'Vacinacao') && vaccineProducts.length > 0) {
          const vaccine = randomPick(vaccineProducts);
          await prisma.medicalRecordProduct.create({
            data: {
              medicalRecordId: record.id,
              productId: vaccine.id,
              quantityUsed: 1,
            },
          });

          await prisma.product.update({
            where: { id: vaccine.id },
            data: {
              quantity: {
                decrement: 1,
              },
            },
          });
        }
      }

      if (status === 'COMPLETED' || status === 'CONFIRMED') {
        const invoiceStatus = Math.random() < 0.78 ? 'PAID' : 'PENDING';
        const invoice = await prisma.invoice.create({
          data: {
            appointmentId: appointment.id,
            totalAmount,
            status: invoiceStatus,
            createdAt: appointmentDate,
          },
        });
        counters.invoices += 1;
        counters.revenue += totalAmount;

        for (const service of services) {
          await prisma.invoiceItem.create({
            data: {
              invoiceId: invoice.id,
              description: service.name,
              quantity: 1,
              unitPrice: service.price,
              totalPrice: service.price,
            },
          });
        }
      }
    }
  }

  return counters;
}

async function main() {
  console.log(`Iniciando simulacao de ${SIM_DAYS} dias...`);

  await ensureRoles();
  await ensureStaffUsers();
  await ensureProducts();
  await createTutorsAndPets(SIM_DAYS);
  const counters = await createAppointmentsForLastDays(SIM_DAYS);

  console.log('--- Simulacao finalizada ---');
  console.log(`Dias simulados: ${SIM_DAYS}`);
  console.log(`Agendamentos: ${counters.appointments}`);
  console.log(`Atendimentos concluidos: ${counters.completed}`);
  console.log(`Prontuarios criados: ${counters.records}`);
  console.log(`Aplicacoes de vacina: ${counters.vaccines}`);
  console.log(`Faturas geradas: ${counters.invoices}`);
  console.log(`Receita total simulada: R$ ${counters.revenue.toFixed(2)}`);
  console.log('Logins para demonstracao (senha padrao 123456):');
  for (const user of staffUsers) {
    console.log(`- ${user.email} (${user.roleName})`);
  }
}

main()
  .catch((error) => {
    console.error('Erro na simulacao de 30 dias:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
