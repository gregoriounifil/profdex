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
    desc: 'Espalhados pelo evento, cada marcador esconde um professor. Abra o scanner e aponte sua câmera.',
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
  <div class="home pk-pixel">
    <div class="home__hero">
      <div class="home__ball">
        <div class="ball-top" />
        <div class="ball-middle" />
        <div class="ball-bottom" />
      </div>
      <h1 class="home__title">PROF<span>DEX</span></h1>
      <p class="home__subtitle">Colecione seus professores!</p>
    </div>

    <div class="home__content pokemon-frame">
      <div class="home__section-title">Como Funciona</div>

      <div class="home__steps">
        <div v-for="(step, i) in steps" :key="i" class="step-box animate-fade-in">
          <div class="step-box__icon">{{ step.icon }}</div>
          <div class="step-box__body">
            <div class="step-box__num">{{ String(i + 1).padStart(2, '0') }}</div>
            <div class="step-box__title">{{ step.title }}</div>
            <div class="step-box__desc">{{ step.desc }}</div>
          </div>
        </div>
      </div>

      <div class="home__cta">
        <button class="btn-pokemon-action" @click="start">
          <span>COMEÇAR</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Importando a fonte no lugar correto (fora do template) */
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

.pk-pixel {
  font-family: 'Press Start 2P', monospace !important;
}

/* Reset e Base da UI */
.home {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  background-color: #181c24;
  color: #ffffff;
}

/* Hero - Seção da Pokebola */
.home__hero {
  background: #cc0000;
  padding: 32px 24px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  position: relative;
  border-bottom: 6px solid #222222;
}

/* Pokebola Pixel Art */
.home__ball {
  width: 64px;
  height: 64px;
  position: relative;
  border-radius: 50%;
  overflow: hidden;
  border: 4px solid #222222;
  box-shadow: inset -4px -4px 0px rgba(0,0,0,0.2);
}

.ball-top {
  height: 50%;
  background: #ef3e33;
}

.ball-middle {
  height: 6px;
  background: #222222;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ball-middle::after {
  content: '';
  width: 14px;
  height: 14px;
  background: white;
  border-radius: 50%;
  border: 4px solid #222222;
  position: absolute;
  z-index: 1;
}

.ball-bottom {
  height: calc(50% - 6px);
  background: white;
}

/* Títulos do Hero */
.home__title {
  font-size: 22px;
  color: white;
  letter-spacing: 1px;
  margin: 0;
  text-shadow: 3px 3px 0px #222222;
}

.home__title span {
  color: #f8d030;
}

.home__subtitle {
  color: #ffffff;
  font-size: 9px;
  margin: 0;
  opacity: 0.9;
  text-transform: uppercase;
}

/* Caixa de Texto Estilo GBA */
.home__content {
  margin: 16px;
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  background: #101820;
  
  border: 4px solid #285068;
  box-shadow: 
    inset 0 0 0 2px #58a0c0,
    inset 0 0 0 4px #101820;
  border-radius: 4px;
}

.home__section-title {
  font-size: 11px;
  color: #f8d030;
  text-transform: uppercase;
}

.home__steps {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.step-box {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 2px dashed #285068;
}

.step-box:last-child {
  border-bottom: none;
}

.step-box__icon {
  font-size: 24px;
  flex-shrink: 0;
}

.step-box__num {
  font-size: 9px;
  color: #f8d030;
  margin-bottom: 6px;
}

.step-box__title {
  font-weight: bold;
  font-size: 11px;
  color: #ffffff;
  margin-bottom: 6px;
  text-transform: uppercase;
  line-height: 1.3;
}

.step-box__desc {
  font-size: 9px;
  color: #a8b8c0;
  line-height: 1.6;
}

/* Botão Vermelho */
.home__cta {
  padding-top: 8px;
}

.btn-pokemon-action {
  width: 100%;
  background: #a81808;
  border: 3px solid #222222;
  box-shadow: 
    inset -3px -3px 0px #701008, 
    inset 3px 3px 0px #d82810;
  padding: 14px;
  cursor: pointer;
  transition: transform 0.1s ease;
}

.btn-pokemon-action span {
  font-family: 'Press Start 2P', monospace;
  font-size: 12px;
  color: #ffffff;
  text-shadow: 2px 2px 0px #222222;
  letter-spacing: 1px;
}

.btn-pokemon-action:active {
  transform: scale(0.98);
  background: #701008;
}
</style>