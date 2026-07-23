/**
 * Popula os professores no banco local (SQLite).
 * Rode APÓS `npx prisma db push`:
 *   node scripts/setup-db.js
 */

const { PrismaClient } = require('@prisma/client')
const db = new PrismaClient()

const PROFESSORS = [
  {
    id: 'prof-mario',
    name: 'Mario',
    slug: 'mario',
    marker1Index: 0,
    marker2Index: 1,
  },
  {
    id: 'prof-eron',
    name: 'Eron',
    slug: 'eron',
    marker1Index: 2,
    marker2Index: 3,
  },
  {
    id: 'prof-gustavo',
    name: 'Gustavo',
    slug: 'gustavo',
    marker1Index: 4,
    marker2Index: 5,
  },
]

async function main() {
  for (const prof of PROFESSORS) {
    await db.professor.upsert({
      where: { slug: prof.slug },
      update: {},
      create: prof,
    })
    console.log(`✓ Prof. ${prof.name}`)
  }
  console.log('\n✅ Banco populado!')
}

main()
  .catch((e) => { console.error('Erro:', e.message); process.exit(1) })
  .finally(() => db.$disconnect())
