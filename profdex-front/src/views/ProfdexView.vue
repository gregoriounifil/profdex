<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import ProfCard from '../components/ProfCard.vue'
import { useAuthStore } from '../stores/auth.js'
import { useProfessorsStore } from '../stores/professors.js'

const router = useRouter()
const auth = useAuthStore()
const store = useProfessorsStore()

onMounted(() => store.fetch())

const captured = computed(() => store.professors.filter((p) => p.captured).length)
const total = computed(() => store.professors.length)
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

      <div v-else class="grid">
        <ProfCard
          v-for="(prof, i) in store.professors"
          :key="prof.id"
          :professor="prof"
          :index="i"
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
      <button class="nav-btn" @click="router.push({ name: 'batalha' })">
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

.profdex__nav {
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
  transition: color 0.15s;
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
