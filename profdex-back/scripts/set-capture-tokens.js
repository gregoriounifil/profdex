/**
 * Rotaciona tokens de captura a partir do ambiente e salva somente hashes.
 * Exemplo:
 *   CAPTURE_TOKEN_MARIO=<token> CAPTURE_TOKEN_ERON=<token> \
 *   CAPTURE_TOKEN_GUSTAVO=<token> node scripts/set-capture-tokens.js
 */

const { createHash } = require('node:crypto')
const { PrismaClient } = require('@prisma/client')
const db = new PrismaClient()

const TOKENS = {
  mario: process.env.CAPTURE_TOKEN_MARIO,
  eron: process.env.CAPTURE_TOKEN_ERON,
  gustavo: process.env.CAPTURE_TOKEN_GUSTAVO,
}

async function main() {
  for (const [slug, token] of Object.entries(TOKENS)) {
    if (!token || token.length < 32) {
      throw new Error(`Token ausente ou curto para ${slug}`)
    }

    const captureTokenHash = createHash('sha256').update(token, 'utf8').digest('hex')
    const prof = await db.professor.update({
      where: { slug },
      data: { captureTokenHash },
      select: { name: true, slug: true },
    })
    console.log(`✓ Token rotacionado para ${prof.name}`)
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())
