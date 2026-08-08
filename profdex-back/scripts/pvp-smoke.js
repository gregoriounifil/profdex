/**
 * Smoke test do PvP contra um servidor de DEV rodando (npm run start:dev).
 *
 * Percorre o fluxo inteiro de verdade, pela rede: login → lobby → convite →
 * aceite → pick às cegas → turnos até o nocaute → Elo aplicado → ranking →
 * cooldown de 12h bloqueando o rematch.
 *
 * Uso (na pasta profdex-back, com o backend no ar):
 *   npm run pvp:smoke
 *
 * Cria usuários descartáveis (smoke-*) e capturas para eles no banco local.
 */
const { io } = require('socket.io-client')
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('@node-rs/bcrypt')
const { requireDatabaseUrl } = require('./db-url')

const API = process.env.SMOKE_API || 'http://localhost:3000/api'
const WS = (process.env.SMOKE_API || 'http://localhost:3000').replace(/\/api$/, '') + '/battle'
const DB_URL = requireDatabaseUrl()

const fail = (msg) => { console.error('FALHOU:', msg); process.exit(1) }
const ok = (msg) => console.log('OK:', msg)

const prisma = new PrismaClient({ datasources: { db: { url: DB_URL } } })

const SMOKE_PASSWORD = 'senha123456789'

/**
 * Cria a conta direto no banco e entra por /auth/login.
 *
 * Não existe rota de cadastro: toda conta nasce do login com Google, que o
 * smoke não tem como percorrer sozinho. O que interessa aqui é a sessão — daí
 * a conta ser semeada no banco e só o login passar pela rede.
 */
async function criarConta(name) {
  const matricula = `smoke${Date.now()}${Math.floor(Math.random() * 1000)}`
  const user = await prisma.user.create({
    data: {
      matricula,
      name,
      password: await bcrypt.hash(SMOKE_PASSWORD, 10),
      email: `${matricula}@edu.unifil.br`,
      emailVerified: true,
    },
    select: { id: true, matricula: true, name: true },
  })

  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ matricula, password: SMOKE_PASSWORD }),
  })
  if (res.status !== 200) fail(`login ${name}: HTTP ${res.status}`)
  const cookie = (res.headers.get('set-cookie') || '').split(';')[0]
  return { cookie, user }
}

const connect = (cookie) =>
  io(WS, { path: '/api/socket.io', transports: ['websocket'], extraHeaders: { cookie } })

const waitEvent = (socket, event, ms = 10000) =>
  new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`timeout esperando ${event}`)), ms)
    socket.once(event, (data) => { clearTimeout(t); resolve(data) })
  })

const command = (socket, event, payload) =>
  new Promise((resolve) => socket.emit(event, payload, resolve))

const attackOf = (moves) => moves.find((m) => m.category === 'ataque' && m.power) ?? moves[0]

async function main() {
  const professors = await prisma.professor.findMany({ take: 2, orderBy: { slug: 'asc' } })
  if (professors.length < 2) fail('banco sem professores — rode o seed antes')

  const a = await criarConta('Smoke Ana')
  const b = await criarConta('Smoke Bia')
  await prisma.capture.createMany({
    data: [
      { userId: a.user.id, professorId: professors[0].id },
      { userId: b.user.id, professorId: professors[1].id },
    ],
  })
  ok(`capturas: Ana→${professors[0].slug}, Bia→${professors[1].slug}`)

  const sockA = connect(a.cookie)
  const sockB = connect(b.cookie)
  // A conexão entrega só a contagem; a lista em si exige lobby:subscribe.
  await waitEvent(sockA, 'lobby:count')
  await waitEvent(sockB, 'lobby:count')
  ok('lobby conectado para os dois')

  const recv = waitEvent(sockB, 'invite:received')
  const startA = waitEvent(sockA, 'battle:start')
  const startB = waitEvent(sockB, 'battle:start')
  let ack = await command(sockA, 'invite:send', { toUserId: b.user.id })
  if (!ack.ok) fail('convite: ' + ack.message)
  ack = await command(sockB, 'invite:accept', { inviteId: (await recv).inviteId })
  if (!ack.ok) fail('aceite: ' + ack.message)
  await Promise.all([startA, startB])
  ok('convite aceito, seleção aberta')

  const beginA = waitEvent(sockA, 'battle:begin')
  const beginB = waitEvent(sockB, 'battle:begin')
  ack = await command(sockA, 'battle:pick', { professorId: professors[0].id })
  if (!ack.ok) fail('pick A: ' + ack.message)
  ack = await command(sockB, 'battle:pick', { professorId: professors[1].id })
  if (!ack.ok) fail('pick B: ' + ack.message)
  let stateA = await beginA
  let stateB = await beginB
  ok(`batalha: ${stateA.you.professor.name} vs ${stateA.foe.professor.name}`)

  let finished = null
  for (let round = 1; round <= 60 && !finished; round++) {
    const nextA = Promise.race([
      waitEvent(sockA, 'battle:round', 15000).then((p) => ({ kind: 'round', p })),
      waitEvent(sockA, 'battle:end', 15000).then((p) => ({ kind: 'end', p })),
    ])
    const nextB = Promise.race([
      waitEvent(sockB, 'battle:round', 15000).then((p) => ({ kind: 'round', p })),
      waitEvent(sockB, 'battle:end', 15000).then((p) => ({ kind: 'end', p })),
    ])
    await command(sockA, 'battle:move', { moveId: attackOf(stateA.you.moves).id })
    await command(sockB, 'battle:move', { moveId: attackOf(stateB.you.moves).id })
    const [rA, rB] = await Promise.all([nextA, nextB])
    if (rA.kind === 'end') finished = { a: rA.p, b: rB.p }
    else {
      stateA = { you: { ...stateA.you, ...rA.p.you }, foe: rA.p.foe }
      stateB = { you: { ...stateB.you, ...rB.p.you }, foe: rB.p.foe }
    }
  }
  if (!finished) fail('não terminou em 60 rodadas')
  ok(`fim: Ana=${finished.a.result} Bia=${finished.b.result} (${finished.a.reason})`)

  const winSide = finished.a.result === 'win' ? finished.a : finished.b
  if (finished.a.result !== 'draw' && (!winSide.rating || winSide.rating.delta <= 0)) {
    fail('vencedor sem delta de Elo positivo: ' + JSON.stringify(winSide.rating))
  }
  ok(`Elo aplicado: vencedor ${winSide.rating ? `+${winSide.rating.delta} → ${winSide.rating.rating} (${winSide.rating.tier})` : 'empate'}`)

  const rank = await fetch(`${API}/rankings/battle`, { headers: { cookie: a.cookie } }).then((r) => r.json())
  if (!rank.entries.some((e) => e.id === a.user.id || e.id === b.user.id)) {
    fail('jogadores não apareceram no ranking')
  }
  ok(`ranking respondendo (${rank.total} no ladder)`)

  ack = await command(sockA, 'invite:send', { toUserId: b.user.id })
  if (ack.ok) fail('cooldown não bloqueou o rematch')
  ok('cooldown de 12h ativo: ' + ack.message)

  sockA.close(); sockB.close()
  await prisma.$disconnect()
  console.log('\nPVP SMOKE PASSOU ✅')
  process.exit(0)
}

main().catch((e) => fail(e.stack || e.message))
