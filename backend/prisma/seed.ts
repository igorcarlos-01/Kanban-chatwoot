import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const existingPipeline = await prisma.pipeline.findFirst();
  if (existingPipeline) {
    console.log('Pipeline já existe. Pulando seed.');
    return;
  }

  const pipeline = await prisma.pipeline.create({
    data: {
      name: 'Funil de Vendas Principal',
      description: 'Pipeline padrão para leads do Chatwoot',
      stages: {
        create: [
          { name: 'Caixa de Entrada 📥', sortOrder: 1 },
          { name: 'Em Atendimento 💬', sortOrder: 2 },
          { name: 'Qualificação 🔥', sortOrder: 3 },
          { name: 'Fechamento 🎯', sortOrder: 4 },
        ]
      }
    }
  });

  console.log('✅ Pipeline e Estágios criados com sucesso!', pipeline);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
