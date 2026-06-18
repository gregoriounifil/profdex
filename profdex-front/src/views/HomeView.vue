<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()

function start() {
  if (auth.isAuthenticated) {
    router.push({ name: 'profdex' })
  } else {
    router.push({ name: 'login' })
  }
}

const steps = [
  {
    icon: '📍',
    title: 'Encontre os Marcadores',
    desc: 'Espalhos pelo evento, cada marcador esconde um professor. Abra o scanner e aponte sua câmera.',
  },
  {
    icon: '🎓',
    title: 'Ache o Professor',
    desc: 'O app te diz quem é o professor. Encontre-o pessoalmente e responda uma pergunta corretamente.',
  },
  {
    icon: '🃏',
    title: 'Receba o Card',
    desc: 'Acertou? O professor te dá um card especial com um segundo marcador no verso.',
  },
  {
    icon: '✨',
    title: 'Capture!',
    desc: 'Abra o modo Captura, coloque os dois marcadores na câmera ao mesmo tempo e capture o professor!',
  },
]
</script>

<template>
  <div class="home">
    <div class="home__hero">
      <div class="home__ball">
        <div class="ball-top" />
        <div class="ball-middle" />
        <div class="ball-bottom" />
      </div>
      <h1 class="home__title pixel">PROF<span>DEX</span></h1>
      <p class="home__subtitle">Colecione seus professores!</p>
    </div>

    <div class="home__content">
      <div class="home__section-title pixel">Como Funciona</div>

      <div class="home__steps">
        <div v-for="(step, i) in steps" :key="i" class="step animate-fade-in">
          <div class="step__icon">{{ step.icon }}</div>
          <div class="step__body">
            <div class="step__num pixel">{{ String(i + 1).padStart(2, '0') }}</div>
            <div class="step__title">{{ step.title }}</div>
            <div class="step__desc">{{ step.desc }}</div>
          </div>
        </div>
      </div>

      <div class="home__cta">
        <button class="btn btn-primary" @click="start">
          <span class="pixel">COMEÇAR</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.home__hero {
  background: linear-gradient(160deg, var(--red-dark) 0%, var(--red) 60%, #aa0000 100%);
  padding: 40px 24px 48px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  position: relative;
  overflow: hidden;
}

.home__hero::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 24px;
  background: var(--bg);
  border-radius: 24px 24px 0 0;
}

.home__ball {
  width: 80px;
  height: 80px;
  position: relative;
  border-radius: 50%;
  overflow: hidden;
  border: 4px solid rgba(255,255,255,0.3);
  animation: pulse 2s ease-in-out infinite;
  box-shadow: 0 0 24px rgba(0,0,0,0.4);
}

.ball-top {
  height: 50%;
  background: white;
}

.ball-middle {
  height: 8px;
  background: #222;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ball-middle::after {
  content: '';
  width: 16px;
  height: 16px;
  background: white;
  border-radius: 50%;
  border: 3px solid #222;
  position: absolute;
  z-index: 1;
}

.ball-bottom {
  height: calc(50% - 8px);
  background: var(--red);
}

.home__title {
  font-size: 28px;
  color: white;
  letter-spacing: 2px;
  text-shadow: 3px 3px 0 rgba(0,0,0,0.3);
}

.home__title span {
  color: var(--yellow);
}

.home__subtitle {
  color: rgba(255,255,255,0.8);
  font-size: 14px;
}

.home__content {
  padding: 24px 20px 32px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.home__section-title {
  font-size: 10px;
  color: var(--yellow);
  letter-spacing: 1px;
}

.home__steps {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.step {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 16px;
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.step__icon {
  font-size: 28px;
  flex-shrink: 0;
  margin-top: 2px;
}

.step__num {
  font-size: 9px;
  color: var(--yellow);
  margin-bottom: 4px;
}

.step__title {
  font-weight: 700;
  font-size: 14px;
  margin-bottom: 4px;
}

.step__desc {
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.6;
}

.home__cta {
  padding-top: 8px;
}
</style>
