<script setup>
import '@google/model-viewer'
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BattleHpBar from '../components/BattleHpBar.vue'
import { useBattle } from '../composables/useBattle.js'
import { useProfessorsStore } from '../stores/professors'
import { getMovesFor } from '../data/moves.js'

const route = useRoute()
const router = useRouter()
const store = useProfessorsStore()

onMounted(() => {
  if (!store.professors.length) store.fetch().catch(() => {})
})

// Professor inimigo: vem da rota (/arena/:id) com fallback para o modelo padrão
const enemyProfessor = computed(() => {
  const id = route.params.id
  return (
    store.professors.find((p) => String(p.id) === String(id)) ||
    window.history.state?.character || { id: 'modelo-padrao', name: 'Professor', slug: 'professor' }
  )
})

const enemy = computed(() => ({
  name: enemyProfessor.value.name,
  maxHp: 60,
  moves: getMovesFor(enemyProfessor.value),
}))

const player = {
  name: 'Você',
  maxHp: 60,
}

const playerMoves = getMovesFor(null)

const {
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
} = useBattle({ player, enemy: enemy.value })

onMounted(start)

// Por enquanto os dois lados usam o mesmo modelo (duplicata);
// depois o jogador terá o próprio modelo/professor capturado.
const enemyModelSrc = computed(
  () => enemyProfessor.value.modelUrl || '/models/seu-modelo-mobile.glb'
)
const playerModelSrc = enemyModelSrc

function goBack() {
  router.push({ name: 'batalha', query: { profId: enemyProfessor.value.id } })
}
</script>

<template>
  <main class="arena">
    <!-- Palco: inimigo ao fundo (de frente) e jogador em primeiro plano (de costas) -->
    <div class="arena__stage">
      <model-viewer
        class="arena__model arena__model--enemy"
        :class="{ 'arena__model--hit': enemyHit }"
        :src="enemyModelSrc"
        :alt="`Prof. ${enemyProfessor.name} em batalha`"
        camera-orbit="-15deg 86deg 105%"
        interaction-prompt="none"
        disable-zoom
        disable-tap
        disable-pan
        shadow-intensity="1"
        shadow-softness="0.8"
        exposure="1"
      />
      <model-viewer
        class="arena__model arena__model--player"
        :class="{ 'arena__model--hit': playerHit }"
        :src="playerModelSrc"
        alt="Seu personagem, de costas"
        camera-orbit="165deg 88deg 105%"
        interaction-prompt="none"
        disable-zoom
        disable-tap
        disable-pan
        shadow-intensity="1"
        shadow-softness="0.8"
        exposure="1"
      />
    </div>

    <!-- HUD sobreposto ao palco -->
    <div class="arena__hud" :class="{ 'arena__hud--player-hit': playerHit }">
      <button class="arena__back" type="button" @click="goBack">←</button>

      <!-- Barra do inimigo (topo esquerdo, como no esboço) -->
      <BattleHpBar
        class="arena__enemy-bar"
        :name="`Prof. ${enemy.name}`"
        :hp="enemyHp"
        :max-hp="enemy.maxHp"
        :level="7"
        :avatar-src="`/professors/${enemyProfessor.slug}-cartoon.png`"
      />

      <!-- Barra do jogador (acima do painel de comandos) -->
      <BattleHpBar
        class="arena__player-bar"
        :name="player.name"
        :hp="playerHp"
        :max-hp="player.maxHp"
        :level="5"
      />

      <!-- Painel de comandos: mensagem + golpes + fugir -->
      <section class="battle-panel" aria-label="Comandos de batalha">
        <div class="battle-panel__message pixel" aria-live="polite">
          {{ message }}
        </div>

        <div v-if="phase === 'player-turn'" class="battle-panel__moves">
          <button
            v-for="move in playerMoves"
            :key="move.id"
            class="move-btn"
            type="button"
            @click="useMove(move)"
          >
            <span class="pixel move-btn__name">{{ move.name }}</span>
            <span class="pixel move-btn__meta">PWR {{ move.power }}</span>
          </button>
        </div>

        <div v-else-if="isOver" class="battle-panel__end">
          <button class="btn btn-primary pixel" type="button" @click="goBack">
            {{ phase === 'victory' ? 'Vitória! Voltar' : 'Voltar' }}
          </button>
        </div>

        <button
          v-if="!isOver"
          class="flee-btn pixel"
          type="button"
          :disabled="phase !== 'player-turn'"
          @click="flee"
        >
          Fugir
        </button>
      </section>
    </div>
  </main>
</template>

<style scoped>
.arena {
  position: relative;
  height: 100%;
  overflow: hidden;
  background: var(--bg-deep);
}

.arena__stage {
  position: absolute;
  inset: 0;
  /* Piso da arena: gradiente sutil para dar profundidade */
  background:
    radial-gradient(ellipse 65% 18% at 32% 42%, rgba(237, 175, 104, 0.12), transparent),
    radial-gradient(ellipse 70% 16% at 72% 74%, rgba(237, 175, 104, 0.14), transparent),
    linear-gradient(180deg, var(--bg-deep) 0%, #1a1e26 55%, var(--bg-deep) 100%);
}

/* Modelos 3D estáticos: sem rotação nem zoom (câmera travada) */
.arena__model {
  position: absolute;
  pointer-events: none;
  --poster-color: transparent;
  --progress-bar-color: var(--unifil-gold);
}

/* Inimigo: ao fundo, à esquerda, de frente (levemente virado para o jogador) */
.arena__model--enemy {
  top: 14%;
  left: -4%;
  width: 68%;
  height: 42%;
}

/* Jogador: em primeiro plano, à direita, de costas para nós */
.arena__model--player {
  right: -10%;
  bottom: 150px;
  width: 88%;
  height: 50%;
}

/* Flash + tremida no modelo que tomou dano */
.arena__model--hit {
  animation: shake 0.4s ease;
  filter: brightness(1.6) saturate(0.4);
}

.arena__hud {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  pointer-events: none;
  /* só os controles recebem toque; o resto deixa girar o modelo */
}

.arena__hud>* {
  pointer-events: auto;
}

/* Flash vermelho na tela quando o jogador toma dano */
.arena__hud--player-hit::before {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(255, 107, 107, 0.25);
  pointer-events: none;
}

.arena__back {
  position: absolute;
  top: calc(12px + env(safe-area-inset-top));
  right: 12px;
  width: 38px;
  height: 38px;
  border-radius: var(--radius);
  background: rgba(0, 0, 0, 0.45);
  color: var(--text);
  border: 1px solid var(--border);
  font-size: 18px;
}

.arena__enemy-bar {
  position: absolute;
  top: calc(12px + env(safe-area-inset-top));
  left: 12px;
  max-width: 62%;
}

.arena__player-bar {
  position: absolute;
  left: 12px;
  bottom: 256px;
  max-width: 58%;
}

/* Painel inferior: mensagem + grid 2x2 + fugir */
.battle-panel {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 12px calc(12px + env(safe-area-inset-bottom));
  background: linear-gradient(180deg, rgba(18, 20, 24, 0.55), var(--bg-deep) 32%);
}

.battle-panel__message {
  min-height: 44px;
  display: flex;
  align-items: center;
  padding: 10px 14px;
  border: 2px solid var(--yellow);
  border-radius: var(--radius);
  background: var(--bg-card);
  color: var(--text);
  font-size: 9px;
  line-height: 1.6;
}

.battle-panel__moves {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.move-btn {
  min-height: 56px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 4px;
  padding: 8px 12px;
  border-radius: var(--radius);
  background: var(--bg-card);
  border: 2px solid var(--border);
  color: var(--text);
  transition: transform 0.1s, border-color 0.15s;
}

.move-btn:active {
  transform: scale(0.97);
  border-color: var(--yellow);
}

.move-btn__name {
  font-size: 8px;
  text-align: left;
}

.move-btn__meta {
  font-size: 6px;
  color: var(--text-muted);
}

.flee-btn {
  align-self: center;
  min-height: 38px;
  padding: 0 26px;
  border-radius: var(--radius);
  background: transparent;
  border: 2px solid var(--error);
  color: var(--error);
  font-size: 8px;
}

.flee-btn:disabled {
  opacity: 0.4;
}

.battle-panel__end {
  display: flex;
}
</style>
