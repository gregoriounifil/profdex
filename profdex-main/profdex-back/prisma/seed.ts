import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const professors = [
    { name: 'Mário', slug: 'mario', marker1Index: 0, marker2Index: 1 },
    { name: 'Eron', slug: 'eron', marker1Index: 2, marker2Index: 3 },
    { name: 'Gustavo', slug: 'gustavo', marker1Index: 4, marker2Index: 5 },
  ];

  for (const prof of professors) {
    await prisma.professor.upsert({
      where: { slug: prof.slug },
      update: {},
      create: prof,
    });
  }

  console.log('Seed concluído: 3 professores inseridos');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
