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

function goToCharacterAR() {
  const professor = selectedProfessor.value
  router.push({
    name: 'character-ar',
    params: { id: professor?.id || 'modelo-padrao' },
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

function goBack() {
  router.push({ name: 'profdex' })
}

function hideBrokenImage(event) {
  event.currentTarget.style.display = 'none'
}
</script>

<template>
  <div class="batalha">
    <header class="batalha__header">
      <button class="back-btn" type="button" @click="goBack">← Voltar</button>
      <div class="header__info">
        <span class="pixel eyebrow">ÁREA DE BATALHA</span>
        <h1 class="pixel header__title">
          {{ selectedProfessor ? `Prof. ${selectedProfessor.name}` : 'BATALHA' }}
        </h1>
      </div>
    </header>

    <main class="batalha__main page">
      <!-- Card do professor selecionado (se vier da ProfdexView) -->
      <div v-if="selectedProfessor" class="prof-preview">
        <div class="prof-preview__avatar">
          <img
            :src="`/professors/${selectedProfessor.slug}-cartoon.png`"
            :alt="selectedProfessor.name"
            class="prof-preview__img"
            @error="hideBrokenImage"
          />
        </div>
        <div class="prof-preview__info">
          <span class="pixel prof-preview__label">PROFESSOR SELECIONADO</span>
          <span class="prof-preview__name">{{ selectedProfessor.name }}</span>
        </div>
      </div>

      <section class="battle-options" aria-label="Opções de batalha">
        <button
          class="battle-option battle-option--primary"
          type="button"
          @click="router.push({ name: 'scan' })"
        >
          <span class="option-icon">⚔️</span>
          <span class="pixel option-label">Batalha</span>
        </button>

        <button class="battle-option" type="button">
          <span class="option-icon">QZ</span>
          <span class="pixel option-label">Quiz</span>
        </button>

        <button
          class="battle-option battle-option--ar"
          type="button"
          @click="goToCharacterAR"
        >
          <span class="option-icon option-icon--ar">AR</span>
          <span class="pixel option-label">Ver Prof.</span>
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

/* Preview do professor selecionado */
.prof-preview {
  width: 100%;
  background: var(--bg-card);
  border: 1px solid var(--yellow);
  border-radius: var(--radius-lg);
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: 0 0 16px rgba(255, 222, 0, 0.1);
}

.prof-preview__avatar {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid var(--yellow);
  flex-shrink: 0;
  background: var(--bg-surface);
}

.prof-preview__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.prof-preview__info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.prof-preview__label {
  font-size: 7px;
  color: var(--yellow);
  letter-spacing: 0.5px;
}

.prof-preview__name {
  font-size: 15px;
  font-weight: 700;
  color: var(--text);
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

.battle-option--ar {
  border-color: #3a7bd5;
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

.option-icon--ar {
  color: #3a7bd5;
  font-size: 12px;
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
