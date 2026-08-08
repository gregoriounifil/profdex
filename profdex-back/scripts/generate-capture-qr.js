/**
 * Recria os QR Codes de captura: gera tokens novos, salva apenas o hash no
 * banco e escreve os PNG/SVG prontos para impressão em `qr-out/`.
 *
 * Uso:
 *   node scripts/generate-capture-qr.js --yes                  # todos os professores
 *   node scripts/generate-capture-qr.js --yes --only=gustavo   # apenas um
 *   node scripts/generate-capture-qr.js                        # simulação (não grava)
 *
 * O token vai em texto puro só para dentro do QR e do `qr-out/tokens.txt`.
 * No banco fica apenas `sha256(token)` — ver src/captures/capture-token.ts.
 * Gerar de novo invalida o QR anterior daquele professor.
 */

const fs = require('node:fs')
const path = require('node:path')
const { createHash, randomBytes } = require('node:crypto')
const QRCode = require('qrcode')
const { PrismaClient } = require('@prisma/client')
const { requireDatabaseUrl } = require('./db-url')

const db = new PrismaClient({
  datasources: { db: { url: requireDatabaseUrl() } },
})

const OUT_DIR = path.resolve(__dirname, '..', 'qr-out')
const args = process.argv.slice(2)
const commit = args.includes('--yes')
const onlyArg = args.find((a) => a.startsWith('--only='))
const only = onlyArg ? onlyArg.slice('--only='.length).split(',').map((s) => s.trim()).filter(Boolean) : null

// 32 bytes em base64url = 43 caracteres [A-Za-z0-9_-], dentro das regras de
// CaptureByTokenDto (mín. 32, máx. 256, sem caracteres fora do conjunto).
function generateToken() {
  return randomBytes(32).toString('base64url')
}

function hash(token) {
  return createHash('sha256').update(token, 'utf8').digest('hex')
}

function describeDatabase() {
  const url = process.env.DATABASE_URL || ''
  try {
    const { host, pathname } = new URL(url)
    return `${host}${pathname}`
  } catch {
    return '(DATABASE_URL não reconhecida)'
  }
}

function printSheet(entries) {
  const cards = entries
    .map(
      ({ name, slug }) => `    <figure class="card">
      <img src="${slug}.png" alt="QR Code de captura do professor ${name}" />
      <figcaption>
        <strong>Prof. ${name}</strong>
        <span>Aponte o scanner do ProfDex para capturar</span>
      </figcaption>
    </figure>`,
    )
    .join('\n')

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>ProfDex — QR Codes de captura</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 24px; font-family: system-ui, sans-serif; background: #fff; color: #111; }
    h1 { font-size: 20px; margin: 0 0 4px; }
    p.sub { margin: 0 0 24px; color: #555; font-size: 14px; }
    .grid { display: flex; flex-wrap: wrap; gap: 24px; }
    .card { margin: 0; width: 320px; padding: 16px; border: 2px solid #111; border-radius: 12px; text-align: center; break-inside: avoid; }
    .card img { width: 100%; height: auto; display: block; }
    figcaption { margin-top: 12px; display: flex; flex-direction: column; gap: 4px; }
    figcaption strong { font-size: 18px; }
    figcaption span { font-size: 12px; color: #555; }
    @media print { body { padding: 0; } p.sub, h1 { display: none; } }
  </style>
</head>
<body>
  <h1>ProfDex — QR Codes de captura</h1>
  <p class="sub">Gerado em ${new Date().toLocaleString('pt-BR')}. Imprima e distribua.</p>
  <div class="grid">
${cards}
  </div>
</body>
</html>
`
}

async function main() {
  const where = only ? { slug: { in: only } } : {}
  const professors = await db.professor.findMany({
    where,
    select: { id: true, name: true, slug: true },
    orderBy: { slug: 'asc' },
  })

  if (professors.length === 0) {
    throw new Error(only ? `Nenhum professor com slug: ${only.join(', ')}` : 'Nenhum professor no banco')
  }

  if (only) {
    const missing = only.filter((slug) => !professors.some((p) => p.slug === slug))
    if (missing.length) throw new Error(`Slug inexistente: ${missing.join(', ')}`)
  }

  console.log(`Banco     : ${describeDatabase()}`)
  console.log(`Professores: ${professors.map((p) => p.slug).join(', ')}`)

  if (!commit) {
    console.log('\nSimulação — nada foi gravado e nenhum arquivo foi criado.')
    console.log('Rode de novo com --yes para gerar de verdade.')
    return
  }

  const entries = professors.map((p) => {
    const token = generateToken()
    return { ...p, token, tokenHash: hash(token), payload: `capture:${token}` }
  })

  // Arquivos primeiro: se o banco falhar, ninguém fica com QR impresso sem par.
  fs.mkdirSync(OUT_DIR, { recursive: true })

  for (const entry of entries) {
    await QRCode.toFile(path.join(OUT_DIR, `${entry.slug}.png`), entry.payload, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 800,
    })
    await QRCode.toFile(path.join(OUT_DIR, `${entry.slug}.svg`), entry.payload, {
      errorCorrectionLevel: 'M',
      margin: 2,
      type: 'svg',
    })
  }

  fs.writeFileSync(
    path.join(OUT_DIR, 'tokens.txt'),
    [
      '# SEGREDO — não versionar, não compartilhar.',
      `# Gerado em ${new Date().toISOString()}`,
      '',
      ...entries.map((e) => `${e.slug}\t${e.token}`),
      '',
    ].join('\n'),
    'utf8',
  )

  fs.writeFileSync(path.join(OUT_DIR, 'index.html'), printSheet(entries), 'utf8')

  // Atualização atômica: ou todos os professores recebem o hash novo, ou nenhum.
  await db.$transaction(
    entries.map((e) =>
      db.professor.update({ where: { id: e.id }, data: { captureTokenHash: e.tokenHash } }),
    ),
  )

  console.log('')
  for (const e of entries) {
    console.log(`✓ ${e.name.padEnd(12)} ${e.slug}.png / ${e.slug}.svg   hash ${e.tokenHash.slice(0, 12)}…`)
  }
  console.log(`\nArquivos em: ${OUT_DIR}`)
  console.log('Folha de impressão: qr-out/index.html')
  console.log('Tokens em texto puro: qr-out/tokens.txt (guarde em local seguro e apague daqui)')
}

main()
  .catch((e) => { console.error(`\n✗ ${e.message}`); process.exitCode = 1 })
  .finally(() => db.$disconnect())
