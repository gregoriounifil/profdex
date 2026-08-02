import { computed, ref } from 'vue'

// Máquina de turnos da batalha. Não conhece a UI: só expõe estado reativo
// (HP, fase, mensagem, flags de animação) e as ações do jogador.
//
// Fases: 'intro' → 'player-turn' → 'busy' (animações/turno inimigo) → ...
//        terminando em 'victory' | 'defeat' | 'fled'.
export function useBattle({ player, enemy }) {
    const playerHp = ref(player.maxHp)
    const enemyHp = ref(enemy.maxHp)
    const phase = ref('intro')
    const message = ref(`${enemy.name} selvagem apareceu!`)

    // Flags que a UI usa para animar dano (shake/flash)
    const enemyHit = ref(false)
    const playerHit = ref(false)

    const isOver = computed(() =>
        ['victory', 'defeat', 'fled'].includes(phase.value)
    )

    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

    // Dano base do golpe com variação de ±20%
    function rollDamage(move) {
        const variance = 0.8 + Math.random() * 0.4
        return Math.max(1, Math.round(move.power * variance))
    }

    function start() {
        phase.value = 'intro'
        message.value = `${enemy.name} selvagem apareceu!`
        setTimeout(() => {
            if (phase.value === 'intro') {
                phase.value = 'player-turn'
                message.value = 'O que você vai fazer?'
            }
        }, 1400)
    }

    async function attack(attacker, move, targetHp, hitFlag) {
        message.value = `${attacker} usou ${move.name}!`
        await delay(900)

        if (Math.random() > move.accuracy) {
            message.value = 'Errou o ataque!'
            await delay(900)
            return
        }

        const damage = rollDamage(move)
        hitFlag.value = true
        targetHp.value = Math.max(0, targetHp.value - damage)
        await delay(500)
        hitFlag.value = false
        message.value = `Causou ${damage} de dano!`
        await delay(900)
    }

    async function useMove(move) {
        if (phase.value !== 'player-turn') return
        phase.value = 'busy'

        // Turno do jogador
        await attack(player.name, move, enemyHp, enemyHit)
        if (enemyHp.value <= 0) {
            phase.value = 'victory'
            message.value = `${enemy.name} foi derrotado!`
            return
        }

        // Turno do inimigo: escolhe um golpe aleatório
        const enemyMove = enemy.moves[Math.floor(Math.random() * enemy.moves.length)]
        await attack(enemy.name, enemyMove, playerHp, playerHit)
        if (playerHp.value <= 0) {
            phase.value = 'defeat'
            message.value = 'Você foi derrotado...'
            return
        }

        phase.value = 'player-turn'
        message.value = 'O que você vai fazer?'
    }

    async function flee() {
        if (phase.value !== 'player-turn') return
        phase.value = 'busy'
        message.value = 'Tentando fugir...'
        await delay(800)
        phase.value = 'fled'
        message.value = 'Você fugiu da batalha!'
    }

    return {
        playerHp,
        enemyHp,
        phase,
        message,
        enemyHit,
        playerHit,
        isOver,
        start,
        useMove,
        flee,
    }
}
