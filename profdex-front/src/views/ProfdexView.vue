<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import ProfCard from '../components/ProfCard.vue'
import { useAuthStore } from '../stores/auth.js'
import { useProfessorsStore } from '../stores/professors.js'

const router = useRouter()
const auth = useAuthStore()
const store = useProfessorsStore()

// Sinaliza falha ao buscar a lista (ex.: back-end fora do ar). Sem isso, um erro
// de rede deixava a grade silenciosamente vazia — como se não houvesse nenhum
// professor cadastrado.
const loadError = ref(false)

async function load() {
  loadError.value = false
  try {
    await store.fetch()
  } catch {
    loadError.value = true
  }
}

onMounted(load)

const captured = computed(() => store.professors.filter((p) => p.captured).length)
const total = computed(() => store.professors.length)

function goDetails(prof) {
  router.push({
    name: 'professor',
    params: { id: prof.id },
    state: { character: { ...prof } },
  })
}
</script>

<template>
  <div class="profdex">
    <header class="profdex__header">
      <div class="header__top">
        <h1 class="pixel header__title">PROF<span>DEX</span></h1>
        <button class="logout-btn" @click="auth.logout(); router.push({ name: 'home' })">
          Sair
        </button>
      </div>

      <div class="header__trainer">
        <span class="pixel" style="font-size: 8px; color: rgba(255,255,255,0.7)">TREINADOR</span>
        <span class="trainer-name">{{ auth.user?.name }}</span>
      </div>

      <div class="header__progress">
        <div class="progress-text pixel">
          {{ captured }}<span>/{{ total }}</span> capturados
        </div>
        <div class="progress-bar">
          <div
            class="progress-fill"
            :style="{ width: total ? `${(captured / total) * 100}%` : '0%' }"
          />
        </div>
      </div>
    </header>

    <main class="profdex__main page">
      <div v-if="store.loading" class="loading-state">
        <div class="spinner-lg" />
        <span class="pixel" style="font-size: 8px">Carregando...</span>
      </div>

      <div v-else-if="loadError && !store.professors.length" class="error-state">
        <span class="error-state__icon pixel" aria-hidden="true">!</span>
        <p class="pixel error-state__title">SEM CONEXÃO</p>
        <p class="error-state__copy">
          Não foi possível carregar os professores. Verifique se o servidor está no ar.
        </p>
        <button class="btn btn-primary error-state__retry" type="button" @click="load">
          <span class="pixel">TENTAR NOVAMENTE</span>
        </button>
      </div>

      <div v-else class="grid">
        <ProfCard
          v-for="(prof, i) in store.professors"
          :key="prof.id"
          :professor="prof"
          :index="i"
          @details="goDetails"
        />
      </div>
    </main>

    <nav class="profdex__nav">
      <button class="nav-btn nav-btn--active" @click="router.push({ name: 'profdex' })">
        <span class="nav-icon">📒</span>
        <span class="pixel nav-label">ProfDex</span>
      </button>
      <button class="nav-btn nav-btn--primary" @click="router.push({ name: 'scan' })">
        <span class="nav-icon">📷</span>
        <span class="pixel nav-label">Scanear</span>
      </button>
      <button class="nav-btn nav-btn--battle" @click="router.push({ name: 'batalha' })">
        <span class="nav-icon nav-icon--text">BT</span>
        <span class="pixel nav-label">Batalha</span>
      </button>
    </nav>
  </div>
</template>

<style scoped>
.profdex {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.profdex__header {
  background: linear-gradient(160deg, var(--red-dark), var(--red));
  padding: 16px 20px 28px;
  position: relative;
  flex-shrink: 0;
}

.profdex__header::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0; right: 0;
  height: 20px;
  background: var(--bg);
  border-radius: 20px 20px 0 0;
}

.header__top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.header__title {
  font-size: 20px;
  color: white;
  text-shadow: 2px 2px 0 rgba(0,0,0,0.3);
}

.header__title span {
  color: var(--yellow);
}

.logout-btn {
  background: rgba(0,0,0,0.25);
  color: rgba(255,255,255,0.8);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 20px;
  padding: 6px 14px;
  font-size: 12px;
}

.header__trainer {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 14px;
}

.trainer-name {
  font-size: 16px;
  font-weight: 700;
  color: white;
}

.header__progress {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.progress-text {
  font-size: 9px;
  color: rgba(255,255,255,0.9);
}

.progress-text span {
  color: rgba(255,255,255,0.5);
}

.progress-bar {
  height: 6px;
  background: rgba(0,0,0,0.3);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--yellow);
  border-radius: 3px;
  transition: width 0.5s ease;
}

.profdex__main {
  flex: 1;
  padding: 20px 16px;
  overflow-y: auto;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 40px 0;
}

.spinner-lg {
  width: 36px;
  height: 36px;
  border: 3px solid var(--border);
  border-top-color: var(--red);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 12px;
  padding: 48px 24px;
}

.error-state__icon {
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--red);
  color: white;
  font-size: 20px;
}

.error-state__title {
  font-size: 11px;
  color: var(--yellow);
}

.error-state__copy {
  max-width: 300px;
  font-size: 13px;
  line-height: 1.5;
  color: var(--text-muted);
}

.error-state__retry {
  width: auto;
  margin-top: 4px;
}

.profdex__nav {
  background: var(--surface);
  border-top: 3px solid var(--surface-border);
  display: flex;
  gap: 8px;
  padding: 10px 10px calc(10px + env(safe-area-inset-bottom));
  flex-shrink: 0;
}

.nav-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-height: 52px;
  color: var(--text-primary);
  padding: 8px 4px;
  border-radius: var(--radius);
  border: 3px solid var(--surface);
  text-shadow: 1px 1px 0 var(--surface);
  transition: transform 0.15s ease, filter 0.15s ease;
}

.nav-btn--active {
  background: var(--ds-orange);
  color: var(--surface);
  text-shadow: none;
  box-shadow: inset 0 3px 0 var(--ds-orange-glow), inset 0 -4px 0 var(--ds-orange-shadow);
}

.nav-btn--primary {
  background: var(--ds-blue);
  color: var(--text-primary);
  box-shadow: inset 0 3px 0 var(--ds-blue-glow), inset 0 -4px 0 var(--ds-blue-shadow);
}

.nav-btn--battle {
  background: var(--ds-green);
  color: var(--surface);
  text-shadow: none;
  box-shadow: inset 0 3px 0 var(--ds-green-glow), inset 0 -4px 0 var(--ds-green-shadow);
}

.nav-btn:active {
  transform: translateY(2px);
  filter: brightness(0.92);
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

.nav-btn--primary .nav-label {
  padding: 3px 4px;
  background: var(--surface);
  border-radius: 2px;
}
</style>
