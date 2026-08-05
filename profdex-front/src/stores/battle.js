import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { io } from 'socket.io-client'
import router from '../router'
import { useAuthStore } from './auth'

// Estado do PvP: conexão com o lobby de batalha via Socket.IO.
//
// A conexão é única por app (não por tela): quem entrou na área de batalha
// continua "online" — e alcançável por convites — enquanto navega pelo resto
// do app. Só cai no logout/expiração da sessão ou ao fechar a aba.
//
// O handshake usa path /api/socket.io porque o cookie de sessão (HttpOnly,
// path=/api) é a autenticação — no path padrão o navegador nem o enviaria.
// Em dev a mesma origem cobre tudo via proxy do Vite; em produção com o
// backend em outro domínio, defina VITE_WS_URL.
export const useBattleStore = defineStore('battle', () => {
  const connected = ref(false)
  const unauthorized = ref(false)
  const onlineUsers = ref([])

  // Convites: um de saída por vez (regra do servidor); vários podem chegar.
  const outgoingInvite = ref(null) // { inviteId, to: {id,name}, expiresAt }
  const incomingInvites = ref([]) // [{ inviteId, from: {id,name}, expiresAt }]

  // Batalha PvP em andamento. O servidor é a autoridade: aqui só espelhamos o
  // que ele mandou. `pendingEvents` é a fila da última rodada que a arena anima.
  //
  // { battleId, opponent, phase: 'picking'|'active'|'done',
  //   pickDeadline, youPicked, foePicked,               // fase picking
  //   turn, deadline, you, foe, youMoved, foeMoved,     // fase active
  //   pendingEvents: [], result: null|{result,reason} }
  const pvp = ref(null)

  // Última falha de comando (cooldown, jogador ocupado…) — a UI mostra e limpa.
  const lastError = ref(null)

  let socket = null

  const auth = useAuthStore()

  // Lista exibida no lobby: todos menos o próprio usuário.
  const opponents = computed(() =>
    onlineUsers.value.filter((u) => u.id !== auth.user?.id),
  )

  function connect() {
    if (socket) return
    unauthorized.value = false

    const base = import.meta.env.VITE_WS_URL || ''
    socket = io(`${base}/battle`, {
      path: '/api/socket.io',
      withCredentials: true,
    })

    socket.on('connect', () => {
      connected.value = true
    })

    socket.on('disconnect', () => {
      connected.value = false
      onlineUsers.value = []
      // Convites são efêmeros no servidor; sem conexão eles já não valem.
      outgoingInvite.value = null
      incomingInvites.value = []
    })

    socket.on('error:unauthorized', () => {
      // Sessão inválida: desistir de reconectar — ia falhar em loop.
      unauthorized.value = true
      disconnect()
    })

    socket.on('lobby:snapshot', ({ users }) => {
      onlineUsers.value = users
    })

    socket.on('lobby:update', (update) => {
      if (update.type === 'join') {
        const rest = onlineUsers.value.filter((u) => u.id !== update.user.id)
        onlineUsers.value = [...rest, update.user]
      } else if (update.type === 'leave') {
        onlineUsers.value = onlineUsers.value.filter((u) => u.id !== update.userId)
      } else if (update.type === 'status') {
        onlineUsers.value = onlineUsers.value.map((u) =>
          u.id === update.userId ? { ...u, status: update.status } : u,
        )
      }
    })

    socket.on('invite:received', (invite) => {
      incomingInvites.value = [
        ...incomingInvites.value.filter((i) => i.inviteId !== invite.inviteId),
        invite,
      ]
    })

    socket.on('invite:expired', ({ inviteId }) => dropInvite(inviteId))

    socket.on('invite:cancelled', ({ inviteId, reason }) => {
      if (outgoingInvite.value?.inviteId === inviteId && reason === 'declined') {
        lastError.value = `${outgoingInvite.value.to.name} recusou o desafio.`
      }
      dropInvite(inviteId)
    })

    // ── Batalha PvP ─────────────────────────────────────────────────────────

    socket.on('battle:start', ({ battleId, pickDeadline, opponent }) => {
      outgoingInvite.value = null
      incomingInvites.value = []
      pvp.value = {
        battleId,
        opponent,
        phase: 'picking',
        pickDeadline,
        youPicked: false,
        foePicked: false,
        pendingEvents: [],
        result: null,
      }
      router.push({ name: 'pvp-pick' })
    })

    socket.on('battle:pick:opponent', () => {
      if (pvp.value) pvp.value.foePicked = true
    })

    socket.on('battle:cancelled', () => {
      pvp.value = null
      lastError.value = 'A seleção expirou — batalha cancelada.'
      router.push({ name: 'batalha' })
    })

    socket.on('battle:begin', ({ battleId, turn, deadline, you, foe }) => {
      pvp.value = {
        ...(pvp.value ?? { battleId }),
        battleId,
        phase: 'active',
        turn,
        deadline,
        you,
        foe,
        youMoved: false,
        foeMoved: false,
        pendingEvents: [],
        result: null,
      }
      router.push({ name: 'pvp-arena' })
    })

    socket.on('battle:move:opponent', () => {
      if (pvp.value) pvp.value.foeMoved = true
    })

    socket.on('battle:round', ({ turn, deadline, events, you, foe }) => {
      if (!pvp.value) return
      pvp.value = {
        ...pvp.value,
        turn,
        deadline,
        you: { ...pvp.value.you, ...you },
        foe: { ...pvp.value.foe, ...foe },
        youMoved: false,
        foeMoved: false,
        pendingEvents: events,
      }
    })

    socket.on('battle:end', ({ events, result, reason, rating, you, foe }) => {
      if (!pvp.value) return
      pvp.value = {
        ...pvp.value,
        phase: 'done',
        you: { ...pvp.value.you, ...you },
        foe: { ...pvp.value.foe, ...foe },
        pendingEvents: events,
        // rating: { delta, rating, tier } — null quando a batalha não pontuou
        result: { result, reason, rating },
      }
    })

    // Reconexão no meio da batalha: o servidor manda o snapshot e a UI se
    // reconstrói na tela certa.
    socket.on('battle:resync', (snap) => {
      if (snap.phase === 'picking') {
        pvp.value = {
          battleId: snap.battleId,
          opponent: snap.opponent,
          phase: 'picking',
          pickDeadline: snap.deadline,
          youPicked: snap.youPicked,
          foePicked: snap.foePicked,
          pendingEvents: [],
          result: null,
        }
        router.push({ name: 'pvp-pick' })
      } else if (snap.phase === 'active') {
        pvp.value = {
          battleId: snap.battleId,
          opponent: snap.opponent,
          phase: 'active',
          turn: snap.turn,
          deadline: snap.deadline,
          you: snap.you,
          foe: snap.foe,
          youMoved: snap.youMoved,
          foeMoved: snap.foeMoved,
          pendingEvents: [],
          result: null,
        }
        router.push({ name: 'pvp-arena' })
      }
    })
  }

  function disconnect() {
    if (!socket) return
    socket.disconnect()
    socket = null
    connected.value = false
    onlineUsers.value = []
    outgoingInvite.value = null
    incomingInvites.value = []
  }

  // Comando com ack: resolve com a resposta { ok, ... } do servidor.
  function command(event, payload) {
    return new Promise((resolve) => {
      if (!socket?.connected) {
        resolve({ ok: false, message: 'Sem conexão com o lobby.' })
        return
      }
      const timeout = setTimeout(
        () => resolve({ ok: false, message: 'O servidor não respondeu.' }),
        5000,
      )
      socket.emit(event, payload, (ack) => {
        clearTimeout(timeout)
        resolve(ack ?? { ok: false, message: 'Resposta inválida do servidor.' })
      })
    })
  }

  async function sendInvite(toUserId) {
    const ack = await command('invite:send', { toUserId })
    if (ack.ok) outgoingInvite.value = ack.invite
    else lastError.value = ack.message
    return ack
  }

  async function acceptInvite(inviteId) {
    const ack = await command('invite:accept', { inviteId })
    if (!ack.ok) {
      lastError.value = ack.message
      dropInvite(inviteId)
    }
    return ack
  }

  async function declineInvite(inviteId) {
    dropInvite(inviteId) // some da UI já; o servidor confirma pelo ack
    return command('invite:decline', { inviteId })
  }

  function dropInvite(inviteId) {
    if (outgoingInvite.value?.inviteId === inviteId) outgoingInvite.value = null
    incomingInvites.value = incomingInvites.value.filter((i) => i.inviteId !== inviteId)
  }

  async function pickProfessor(professorId) {
    const ack = await command('battle:pick', { professorId })
    if (ack.ok && pvp.value) pvp.value.youPicked = true
    else if (!ack.ok) lastError.value = ack.message
    return ack
  }

  async function submitMove(moveId) {
    const ack = await command('battle:move', { moveId })
    if (ack.ok && pvp.value) pvp.value.youMoved = true
    else if (!ack.ok) lastError.value = ack.message
    return ack
  }

  /** A arena chama após animar a fila da rodada. */
  function consumeEvents() {
    if (pvp.value) pvp.value.pendingEvents = []
  }

  /** Sai da tela de resultado: limpa o estado local (o servidor já fechou). */
  function leaveBattle() {
    pvp.value = null
  }

  function clearError() {
    lastError.value = null
  }

  // Sessão expirou (401 em qualquer request) ou logout: derruba o socket para
  // não manter uma presença com identidade que já não vale.
  window.addEventListener('auth:expired', disconnect)

  return {
    connected,
    unauthorized,
    onlineUsers,
    opponents,
    outgoingInvite,
    incomingInvites,
    pvp,
    lastError,
    connect,
    disconnect,
    sendInvite,
    acceptInvite,
    declineInvite,
    pickProfessor,
    submitMove,
    consumeEvents,
    leaveBattle,
    clearError,
  }
})
