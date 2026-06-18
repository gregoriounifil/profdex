/**
 * Salva os captureTokens dos professores no banco.
 * Rode uma vez: node scripts/set-capture-tokens.js
 */

const { PrismaClient } = require('@prisma/client')
const db = new PrismaClient()

const TOKENS = {
  mario:   '2f257167-c20a-4f1c-b513-8a0d0bfb7e52',
  eron:    '90c0b3f6-21a1-47f4-9cc8-d51a23f0dfbf',
  gustavo: 'f6cf062f-b4b4-4756-bfe4-0fc3d7bbfdfb',
}

async function main() {
  for (const [slug, captureToken] of Object.entries(TOKENS)) {
    const prof = await db.professor.update({
      where: { slug },
      data: { captureToken },
      select: { name: true, slug: true, captureToken: true },
    })
    console.log(`✓ ${prof.name} — token: ${prof.captureToken}`)
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())
