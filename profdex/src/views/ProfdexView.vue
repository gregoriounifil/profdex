<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()

const trainerName = ref('Teste')
const capturedCount = ref(0)
const totalCount = ref(0)

async function handleLogout() {
  try {
    if (typeof auth.logout === 'function') {
      await auth.logout()
    } else {
      auth.isAuthenticated = false
      auth.user = null
    }
  } catch (error) {
    console.error('Erro ao deslogar:', error)
  } finally {
    router.push({ name: 'login' })
  }
}
</script>

<template>
  <div class="profdex-dashboard pk-pixel">
    <header class="dashboard-header">
      <div class="header-main-info">
        <h1 class="header-title">PROF<span>DEX</span></h1>
        <button class="btn-sair-retro" @click="handleLogout">Sair</button>
      </div>
      
      <div class="trainer-status-bar">
        <div class="trainer-label-group">
          <span class="label-mini">TREINADOR</span>
          <span class="trainer-name">{{ trainerName }}</span>
        </div>
        <div class="captured-score">
          {{ capturedCount }}/{{ totalCount }} <span class="label-mini-inline">capturados</span>
        </div>
      </div>
      <div class="header-divider-line" />
    </header>

    <main class="dashboard-body">
      <div class="inner-content">
        <p class="empty-text">Nenhum professor encontrado</p>
      </div>
    </main>

    <nav class="bottom-navbar">
      <div class="navbar-container">
        <button class="ds-btn btn-yellow" @click="router.push({ name: 'profdex' })">
          <span class="ds-btn-icon">📒</span>
          <span class="ds-btn-text">PROFDEX</span>
        </button>

        <button class="ds-btn btn-blue active" @click="router.push({ name: 'capture' })">
          <span class="ds-btn-icon">📷</span>
          <span class="ds-btn-text">SCANNER</span>
        </button>

        <button class="ds-btn btn-green" @click="router.push({ name: 'capture' })">
          <span class="ds-btn-icon">✨</span>
          <span class="ds-btn-text">CAPTURA</span>
        </button>
      </div>
    </nav>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

.pk-pixel {
  font-family: 'Press Start 2P', monospace !important;
}

.profdex-dashboard {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #cc0000;
  overflow: hidden;
}

.dashboard-header {
  background: #cc0000;
  padding: 48px 16px 12px;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  position: relative;
}

.header-main-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.header-title {
  font-size: 22px;
  color: white;
  margin: 0;
  letter-spacing: 1px;
  text-shadow: 2px 2px 0px #222222;
}

.header-title span {
  color: #f8d030;
}

.btn-sair-retro {
  background: #a81808;
  border: 2px solid #222222;
  box-shadow: inset -2px -2px 0px #701008, inset 2px 2px 0px #d82810;
  color: white;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 10px;
  font-family: 'Press Start 2P', monospace;
  cursor: pointer;
}

.trainer-status-bar {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.label-mini {
  display: block;
  font-size: 8px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 2px;
}

.label-mini-inline {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.9);
}

.trainer-name {
  font-size: 14px;
  color: white;
  font-weight: bold;
}

.captured-score {
  font-size: 12px;
  color: white;
}

.header-divider-line {
  height: 6px;
  background: #222222;
  position: absolute;
  bottom: -6px;
  left: 0;
  right: 0;
  z-index: 2;
}

.dashboard-body {
  flex: 1;
  background: #181c24;
  border-top-left-radius: 24px;
  border-top-right-radius: 24px;
  margin-top: 6px;
  padding: 24px 16px 100px;
  overflow-y: auto;
  z-index: 1;
}

.inner-content {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 60%;
}

.empty-text {
  font-size: 10px;
  color: #a8b8c0;
  text-align: center;
}

.bottom-navbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 84px;
  background: #181c24;
 
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  padding: 0 10px;
}

.navbar-container {
  display: flex;
  width: 100%;
  max-width: 480px;
  gap: 8px;
}

.ds-btn {
  flex: 1;
  height: 52px;
  border: 3px solid #1a1a1a;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  cursor: pointer;
  position: relative;
  transition: transform 0.05s ease, box-shadow 0.05s ease;
}

.ds-btn-icon {
  font-size: 14px;
}

.ds-btn-text {
  font-family: 'Press Start 2P', monospace;
  font-size: 8px;
  font-weight: bold;
  color: #ffffff;
  text-shadow: 1px 1px 0px #1a1a1a;
}

.btn-yellow {
  background: #cba034;
  box-shadow: 
    inset 0 3px 0 #ffdf6d,
    inset 0 -4px 0 #896712,
    0 4px 0 #1a1a1a;
}
.btn-yellow:active {
  transform: translateY(3px);
  box-shadow: inset 0 3px 0 #ffdf6d, inset 0 -4px 0 #896712, 0 1px 0 #1a1a1a;
}

.btn-blue {
  background: #3c7fa1;
  box-shadow: 
    inset 0 3px 0 #7ec5e6, 
    inset 0 -4px 0 #1e4d66, 
    0 4px 0 #1a1a1a;
}
.btn-blue:active {
  transform: translateY(3px);
  box-shadow: inset 0 3px 0 #7ec5e6, inset 0 -4px 0 #1e4d66, 0 1px 0 #1a1a1a;
}

.btn-green {
  background: #549942;
  box-shadow: 
    inset 0 3px 0 #9ae186, 
    inset 0 -4px 0 #2e6221, 
    0 4px 0 #1a1a1a;
}
.btn-green:active {
  transform: translateY(3px);
  box-shadow: inset 0 3px 0 #9ae186, inset 0 -4px 0 #2e6221, 0 1px 0 #1a1a1a;
}

.ds-btn.active {
  filter: brightness(1.05);
}
</style>