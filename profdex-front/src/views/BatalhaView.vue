<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProfessorsStore } from '../stores/professors'

const router = useRouter()
const route = useRoute()
const store = useProfessorsStore()

onMounted(() => {
  if (!store.professors.length) store.fetch().catch(() => {})
})

// Usa o professor vindo da query (?profId=X) ou fallback para o primeiro capturado
const selectedProfessor = computed(() => {
  const profId = route.query.profId
  if (profId) {
    return store.professors.find((p) => String(p.id) === String(profId)) || null
  }
  return (
    store.professors.find((p) => p.captured) ||
    store.professors.find((p) => p.discovered) ||
    store.professors[0] ||
    null
  )
})

// O parâmetro da rota usa o slug (legível e compartilhável: /arena/eron); o
// store resolve tanto slug quanto o UUID do banco.
function routeToCharacter(name) {
  const professor = selectedProfessor.value
  router.push({
    name,
    params: { id: professor?.slug || professor?.id || 'modelo-padrao' },
    state: {
      character: {
        id: professor?.id || 'modelo-padrao',
        name: professor?.name || 'Professor',
        slug: professor?.slug || 'professor',
        modelUrl: professor?.modelUrl,
      },
    },
  })
}

function goToArena() {
  routeToCharacter('arena')
}

function goToRanking() {
  router.push({ name: 'ranking' })
}

function openBattleGuide() {
  router.push({ name: 'battle-guide' })
}

function goBack() {
  router.push({ name: 'profdex' })
}
</script>

<template>
  <div class="batalha">
    <header class="batalha__header">
      <button class="back-btn" type="button" @click="goBack">← Voltar</button>
      <div class="header__info">
        <span class="pixel eyebrow">ÁREA DE BATALHA</span>
        <h1 class="pixel header__title">
          <!-- {{ selectedProfessor ? `Prof. ${selectedProfessor.name}` : 'BATALHA' }} -->
            {{ selectedProfessor ? `Professores` : 'BATALHA' }}
        </h1>
      </div>
    </header>

    <main class="batalha__main page">
      <section class="battle-options" aria-label="Opções de batalha">
        <button
          class="battle-option battle-option--primary"
          type="button"
          @click="goToArena"
        >
          <span class="option-icon">⚔️</span>
          <span class="pixel option-label">Batalha</span>
        </button>

        <button class="battle-option" type="button">
          <span class="option-icon">QZ</span>
          <span class="pixel option-label">Quiz</span>
        </button>

        <button
          class="battle-option battle-option--ranking"
          type="button"
          @click="goToRanking"
        >
          <span class="option-icon">🏆</span>
          <span class="pixel option-label">Ranking</span>
        </button>

        <button
          class="battle-option battle-option--guide"
          type="button"
          @click="openBattleGuide"
        >
          <span class="option-icon">📖</span>
          <span class="pixel option-label">Instruções de Batalha</span>
        </button>
      </section>
    </main>

    <nav class="batalha__nav">
      <button class="nav-btn" @click="router.push({ name: 'profdex' })">
        <span class="nav-icon">📒</span>
        <span class="pixel nav-label">ProfDex</span>
      </button>
      <button class="nav-btn nav-btn--primary" @click="router.push({ name: 'scan' })">
        <span class="nav-icon">📷</span>
        <span class="pixel nav-label">Scanear</span>
      </button>
      <button class="nav-btn nav-btn--active" @click="router.push({ name: 'batalha' })">
        <span class="nav-icon nav-icon--text">BT</span>
        <span class="pixel nav-label">Batalha</span>
      </button>
    </nav>
  </div>
</template>

<style scoped>
.batalha {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.batalha__header {
  background: linear-gradient(160deg, var(--red-dark), var(--red));
  padding: 18px 20px 30px;
  position: relative;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 14px;
}

.batalha__header::after {
  content: '';
  position: absolute;
  right: 0;
  bottom: -1px;
  left: 0;
  height: 20px;
  background: var(--bg);
  border-radius: 20px 20px 0 0;
}

.back-btn {
  position: relative;
  z-index: 1;
  min-height: 38px;
  padding: 0 14px;
  border-radius: var(--radius);
  background: rgba(0, 0, 0, 0.25);
  color: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(255, 255, 255, 0.2);
  white-space: nowrap;
}

.header__info {
  flex: 1;
  min-width: 0;
}

.eyebrow {
  display: block;
  margin-bottom: 4px;
  color: var(--yellow);
  font-size: 8px;
}

.header__title {
  font-size: 18px;
  color: white;
  text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.batalha__main {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px 16px;
  gap: 20px;
}

/* Opções de batalha */
.battle-options {
  width: 100%;
  display: grid;
  gap: 12px;
}

.battle-option {
  width: 100%;
  min-height: 72px;
  display: grid;
  grid-template-columns: 52px 1fr;
  align-items: center;
  gap: 14px;
  padding: 12px 16px;
  border-radius: var(--radius-lg);
  background: var(--bg-card);
  color: var(--text);
  border: 2px solid var(--border);
  transition: transform 0.15s, border-color 0.15s;
  cursor: pointer;
}

.battle-option:active {
  transform: scale(0.98);
}

.battle-option--primary {
  border-color: var(--red-light);
}

.battle-option--ranking {
  border-color: var(--yellow);
}

.battle-option--guide {
  border-color: var(--ds-green);
}

.option-icon {
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--bg-surface);
  color: var(--yellow);
  border: 2px solid var(--border);
  font-size: 22px;
  font-weight: 900;
}

.option-label {
  font-size: 12px;
  text-align: left;
}

/* Navegação */
.batalha__nav {
  background: var(--bg-card);
  border-top: 1px solid var(--border);
  display: flex;
  padding: 8px 0 calc(8px + env(safe-area-inset-bottom));
  flex-shrink: 0;
}

.nav-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  background: transparent;
  color: var(--text-muted);
  padding: 8px 4px;
  border-radius: var(--radius);
}

.nav-btn--active {
  color: var(--yellow);
}

.nav-btn--primary {
  color: var(--red-light);
}

.nav-icon {
  font-size: 22px;
}

.nav-icon--text {
  font-size: 13px;
  font-weight: 900;
}

.nav-label {
  font-size: 7px;
}
</style>
