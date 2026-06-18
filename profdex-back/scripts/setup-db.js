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
    captureToken: '2f257167-c20a-4f1c-b513-8a0d0bfb7e52',
    marker1Index: 0,
    marker2Index: 1,
  },
  {
    id: 'prof-eron',
    name: 'Eron',
    slug: 'eron',
    captureToken: '90c0b3f6-21a1-47f4-9cc8-d51a23f0dfbf',
    marker1Index: 2,
    marker2Index: 3,
  },
  {
    id: 'prof-gustavo',
    name: 'Gustavo',
    slug: 'gustavo',
    captureToken: 'f6cf062f-b4b4-4756-bfe4-0fc3d7bbfdfb',
    marker1Index: 4,
    marker2Index: 5,
  },
]

async function main() {
  for (const prof of PROFESSORS) {
    await db.professor.upsert({
      where: { slug: prof.slug },
      update: { captureToken: prof.captureToken },
      create: prof,
    })
    console.log(`✓ Prof. ${prof.name} — token: ${prof.captureToken}`)
  }
  console.log('\n✅ Banco populado!')
}

main()
  .catch((e) => { console.error('Erro:', e.message); process.exit(1) })
  .finally(() => db.$disconnect())
