import { PrismaClient } from '@prisma/client';
import scriptSafety from '../script-safety.cjs';

const { assertMutationScriptAllowed } = scriptSafety;
assertMutationScriptAllowed('ALLOW_TEST_DATA_MUTATION');

const prisma = new PrismaClient();

async function seedProducts() {
  console.log('🌱 Criando produtos de exemplo...');

  const products = [
    {
      name: 'Vacina V10',
      description: 'Vacina múltipla para cães',
      quantity: 50,
      price: 45.00,
      category: 'Vacina'
    },
    {
      name: 'Vacina Tríplice Felina',
      description: 'Vacina para gatos',
      quantity: 30,
      price: 40.00,
      category: 'Vacina'
    },
    {
      name: 'Antibiótico Amoxicilina',
      description: 'Antibiótico de amplo espectro',
      quantity: 100,
      price: 25.00,
      category: 'Medicamento'
    },
    {
      name: 'Anti-inflamatório Meloxicam',
      description: 'Anti-inflamatório para dor',
      quantity: 75,
      price: 30.00,
      category: 'Medicamento'
    },
    {
      name: 'Seringa 3ml',
      description: 'Seringa descartável',
      quantity: 200,
      price: 2.50,
      category: 'Material'
    },
    {
      name: 'Luvas Descartáveis',
      description: 'Luvas de procedimento',
      quantity: 500,
      price: 0.50,
      category: 'Material'
    },
    {
      name: 'Vermífugo Drontal',
      description: 'Vermífugo para cães e gatos',
      quantity: 60,
      price: 35.00,
      category: 'Medicamento'
    },
    {
      name: 'Shampoo Medicinal',
      description: 'Shampoo para dermatites',
      quantity: 25,
      price: 28.00,
      category: 'Higiene'
    }
  ];

  for (const product of products) {
    await prisma.product.create({
      data: product
    });
    console.log(`✅ Produto criado: ${product.name}`);
  }

  console.log('🎉 Produtos criados com sucesso!');
}

seedProducts()
  .catch(() => {
    console.error('❌ Erro ao criar produtos.');
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
