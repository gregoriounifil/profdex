<script setup>
import { useRouter } from 'vue-router'
import PointsLeaderboard from '../components/PointsLeaderboard.vue'
import { rankingUsers } from '../data/ranking'

const router = useRouter()

function goBack() {
  if (window.history.length > 1) {
    router.back()
    return
  }

  router.push({ name: 'profdex' })
}
</script>

<template>
  <div class="ranking-screen">
    <header class="ranking-header">
      <button class="ranking-header__back" type="button" @click="goBack">
        <span aria-hidden="true">←</span>
        Voltar
      </button>
      <div>
        <span class="pixel ranking-header__label">TOP TREINADORES</span>
        <p class="pixel ranking-header__title">RANKING</p>
      </div>
    </header>

    <main class="ranking-page">
      <PointsLeaderboard :users="rankingUsers" />
    </main>

    <nav class="ranking-nav" aria-label="Navegação principal">
      <button class="nav-btn nav-btn--profdex" type="button" @click="router.push({ name: 'profdex' })">
        <span class="nav-icon" aria-hidden="true">📒</span>
        <span class="pixel nav-label">ProfDex</span>
      </button>
      <button class="nav-btn nav-btn--scan" type="button" @click="router.push({ name: 'scan' })">
        <span class="nav-icon" aria-hidden="true">📷</span>
        <span class="pixel nav-label">Scanear</span>
      </button>
      <button class="nav-btn nav-btn--battle" type="button" @click="router.push({ name: 'batalha' })">
        <span class="nav-icon nav-icon--text" aria-hidden="true">BT</span>
        <span class="pixel nav-label">Batalha</span>
      </button>
      <button
        class="nav-btn nav-btn--ranking"
        type="button"
        aria-current="page"
        @click="goBack"
      >
        <span class="nav-icon" aria-hidden="true">🏆</span>
        <span class="pixel nav-label">Ranking</span>
      </button>
    </nav>
  </div>
</template>

<style scoped>
.ranking-screen {
  position: fixed;
  inset: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #090b10;
}

.ranking-header {
  position: relative;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 20px 28px;
  background: linear-gradient(160deg, #452b70, #7650b6);
}

.ranking-header::after {
  content: '';
  position: absolute;
  right: 0;
  bottom: -1px;
  left: 0;
  height: 20px;
  border-radius: 20px 20px 0 0;
  background: #090b10;
}

.ranking-header__back {
  position: relative;
  z-index: 1;
  min-height: 38px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 12px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: var(--radius);
  background: rgba(0, 0, 0, 0.25);
  color: rgba(255, 255, 255, 0.9);
  font-size: 12px;
  font-weight: 750;
}

.ranking-header__label {
  display: block;
  margin-bottom: 5px;
  color: #ead58a;
  font-size: 7px;
}

.ranking-header__title {
  color: #fff;
  font-size: 18px;
  text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.3);
}

.ranking-page {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 34px 10px 32px;
  background:
    radial-gradient(circle at 50% -20%, rgba(139, 92, 246, 0.1), transparent 34%),
    linear-gradient(180deg, #090b10 0%, #0b0e14 100%);
}

.ranking-page::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.18;
  background-image: linear-gradient(rgba(255, 255, 255, 0.018) 1px, transparent 1px);
  background-size: 100% 5px;
}

.ranking-nav {
  z-index: 2;
  flex-shrink: 0;
  display: flex;
  gap: 8px;
  padding: 10px 10px calc(10px + env(safe-area-inset-bottom));
  border-top: 3px solid var(--surface-border);
  background: var(--surface);
}

.nav-btn {
  min-width: 0;
  min-height: 52px;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px 3px;
  border: 3px solid var(--surface);
  border-radius: var(--radius);
  color: var(--text-primary);
  text-shadow: 1px 1px 0 var(--surface);
  transition: transform 0.15s ease, filter 0.15s ease;
}

.nav-btn--profdex {
  background: var(--ds-orange);
  color: var(--surface);
  text-shadow: none;
  box-shadow: inset 0 3px 0 var(--ds-orange-glow), inset 0 -4px 0 var(--ds-orange-shadow);
}

.nav-btn--scan {
  background: var(--ds-blue);
  box-shadow: inset 0 3px 0 var(--ds-blue-glow), inset 0 -4px 0 var(--ds-blue-shadow);
}

.nav-btn--battle {
  background: var(--ds-green);
  color: var(--surface);
  text-shadow: none;
  box-shadow: inset 0 3px 0 var(--ds-green-glow), inset 0 -4px 0 var(--ds-green-shadow);
}

.nav-btn--ranking {
  background: #7650b6;
  outline: 2px solid #ead58a;
  outline-offset: -4px;
  box-shadow: inset 0 3px 0 #b995f0, inset 0 -4px 0 #452b70;
}

.nav-btn:active {
  transform: translateY(2px);
  filter: brightness(0.92);
}

.nav-icon {
  font-size: 20px;
  line-height: 1;
}

.nav-icon--text {
  font-size: 12px;
  font-weight: 900;
}

.nav-label {
  overflow: hidden;
  max-width: 100%;
  font-size: 6px;
  text-overflow: ellipsis;
}

@media (min-width: 701px) {
  .ranking-page {
    padding: 48px clamp(24px, 5vw, 56px) 56px;
  }

  .ranking-header {
    padding-inline: max(20px, calc((100vw - 1120px) / 2));
  }

  .ranking-nav {
    width: min(100%, 480px);
    align-self: center;
  }
}
</style>
