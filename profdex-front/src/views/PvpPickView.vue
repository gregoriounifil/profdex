<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useBattleStore } from '../stores/battle'
import { useProfessorsStore } from '../stores/professors'
import { typesForProfessor, typeInfos } from '../data/professorTypes'

// Seleção às cegas: cada jogador escolhe um professor CAPTURADO em até 60s.
// O oponente vê que você escolheu, mas não qual — o servidor só revela os dois
// picks juntos, no battle:begin.
const router = useRouter()
const battle = useBattleStore()
const professors = useProfessorsStore()

const now = ref(Date.now())
let clock = null

onMounted(() => {
  battle.connect() // idempotente; cobre refresh no meio da seleção (resync)
  if (!professors.professors.length) professors.fetch().catch(() => {})
  clock = setInterval(() => {
    now.value = Date.now()
  }, 500)
  // Sem batalha em andamento (deep link, F5 sem sessão de sala): volta ao lobby.
  if (!battle.pvp) router.replace({ name: 'batalha' })
})

onUnmounted(() => clock && clearInterval(clock))

const captured = computed(() => professors.professors.filter((p) => p.captured))

const secondsLeft = computed(() => {
  const deadline = battle.pvp?.pickDeadline
  if (!deadline) return 0
  return Math.max(0, Math.ceil((deadline - now.value) / 1000))
})

function typesOf(professor) {
  return typeInfos(typesForProfessor(professor))
}

async function choose(professor) {
  if (battle.pvp?.youPicked) return
  await battle.pickProfessor(professor.id)
}
</script>

<template>
  <div v-if="battle.pvp" class="pick">
    <header class="pick__header">
      <div>
        <span class="pixel pick__eyebrow">BATALHA CONTRA</span>
        <h1 class="pixel pick__title">{{ battle.pvp.opponent.name }}</h1>
      </div>
      <span class="pixel pick__timer" :class="{ 'pick__timer--low': secondsLeft <= 10 }">
        {{ secondsLeft }}s
      </span>
    </header>

    <main class="pick__main page">
      <p class="pick__hint">
        Escolha seu professor. O rival não vê sua escolha até a batalha começar.
      </p>

      <p v-if="!captured.length" class="pick__empty">
        Você ainda não capturou nenhum professor — capture um pela tela de
        Scanear para poder batalhar.
      </p>

      <ul v-else class="pick__grid">
        <li v-for="professor in captured" :key="professor.id">
          <button
            class="pick-card"
            type="button"
            :disabled="battle.pvp.youPicked"
            @click="choose(professor)"
          >
            <span class="pick-card__avatar">
              <img
                :src="`/professors/${professor.slug}-face.png`"
                :alt="professor.name"
                @error="(e) => (e.currentTarget.style.visibility = 'hidden')"
              />
            </span>
            <span class="pixel pick-card__name">{{ professor.name }}</span>
            <span class="pick-card__types">
              <span
                v-for="t in typesOf(professor)"
                :key="t.id"
                class="pick-card__type"
                :style="{ background: t.color }"
              >
                {{ t.icon }} {{ t.label }}
              </span>
            </span>
          </button>
        </li>
      </ul>

      <div class="pick__status">
        <p v-if="battle.pvp.youPicked" class="pixel pick__waiting">
          {{ battle.pvp.foePicked ? 'REVELANDO…' : 'AGUARDANDO O RIVAL…' }}
        </p>
        <p v-else-if="battle.pvp.foePicked" class="pick__foe-picked">
          {{ battle.pvp.opponent.name }} já escolheu!
        </p>
      </div>
    </main>
  </div>
</template>

<style scoped>
.pick {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: var(--bg, #0b0d12);
}

.pick__header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 20px;
  background: linear-gradient(160deg, var(--red-dark), var(--red));
}

.pick__eyebrow {
  display: block;
  font-size: 8px;
  color: var(--yellow);
  margin-bottom: 4px;
}

.pick__title {
  font-size: 16px;
  color: white;
  text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.3);
}

.pick__timer {
  font-size: 18px;
  color: white;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: var(--radius);
  padding: 8px 12px;
}

.pick__timer--low {
  color: var(--yellow);
  animation: pick-blink 1s steps(2) infinite;
}

@keyframes pick-blink {
  50% {
    opacity: 0.4;
  }
}

.pick__main {
  flex: 1;
  overflow-y: auto;
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.pick__hint,
.pick__empty {
  color: var(--text-muted);
  font-size: 13px;
  margin: 0;
}

.pick__grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
}

.pick-card {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 14px 10px;
  border-radius: var(--radius-lg);
  background: var(--bg-card);
  border: 2px solid var(--border);
  color: var(--text);
  cursor: pointer;
  transition: transform 0.15s, border-color 0.15s;
}

.pick-card:not(:disabled):active {
  transform: scale(0.97);
  border-color: var(--yellow);
}

.pick-card:disabled {
  opacity: 0.5;
  cursor: default;
}

.pick-card__avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid var(--yellow);
  background: var(--bg-surface);
}

.pick-card__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.pick-card__name {
  font-size: 10px;
}

.pick-card__types {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 4px;
}

.pick-card__type {
  font-size: 10px;
  color: white;
  border-radius: 999px;
  padding: 2px 8px;
}

.pick__status {
  min-height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pick__waiting {
  font-size: 10px;
  color: var(--yellow);
  animation: pick-blink 1.2s steps(2) infinite;
}

.pick__foe-picked {
  font-size: 13px;
  color: var(--text-muted);
}
</style>
