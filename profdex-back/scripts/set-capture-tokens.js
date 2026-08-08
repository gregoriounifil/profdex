/**
 * Rotaciona tokens de captura a partir do ambiente e salva somente hashes.
 * Exemplo:
 *   CAPTURE_TOKEN_MARIO=<token> CAPTURE_TOKEN_ERON=<token> \
 *   CAPTURE_TOKEN_GUSTAVO=<token> node scripts/set-capture-tokens.js
 */

const { createHash } = require('node:crypto')
const { PrismaClient } = require('@prisma/client')
const { requireDatabaseUrl } = require('./db-url')

const db = new PrismaClient({
  datasources: { db: { url: requireDatabaseUrl() } },
})

const TOKENS = {
  mario: process.env.CAPTURE_TOKEN_MARIO,
  eron: process.env.CAPTURE_TOKEN_ERON,
  gustavo: process.env.CAPTURE_TOKEN_GUSTAVO,
}

const hash = (token) => createHash('sha256').update(token, 'utf8').digest('hex')

async function main() {
  // Valida TODOS antes de gravar QUALQUER um: validar dentro do laço de escrita
  // deixava a rotação pela metade (os primeiros professores já gravados, os
  // últimos não), o que invalida os QR Codes impressos de uns e mantém os
  // antigos de outros — sem nenhum aviso de qual é qual.
  const invalid = Object.entries(TOKENS)
    .filter(([, token]) => !token || token.length < 32)
    .map(([slug]) => `CAPTURE_TOKEN_${slug.toUpperCase()}`)

  if (invalid.length) {
    throw new Error(
      `Token ausente ou com menos de 32 caracteres: ${invalid.join(', ')}.\n` +
        'Gere um com:\n' +
        '  node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64url\'))"',
    )
  }

  // Uma transação pelo mesmo motivo: ou os três rotacionam, ou nenhum.
  const updated = await db.$transaction(
    Object.entries(TOKENS).map(([slug, token]) =>
      db.professor.update({
        where: { slug },
        data: { captureTokenHash: hash(token) },
        select: { name: true },
      }),
    ),
  )

  for (const prof of updated) console.log(`✓ Token rotacionado para ${prof.name}`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())
