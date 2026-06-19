<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()

const matricula = ref('')
const password = ref('')
const loading = ref(false)
const errorMsg = ref('')

async function submit() {
  if (!matricula.value || !password.value) return
  loading.value = true
  errorMsg.value = ''
  try {
    await auth.login(matricula.value.trim(), password.value)
    router.push({ name: 'profdex' })
  } catch (err) {
    errorMsg.value = err.response?.data?.message ?? 'Credenciais inválidas'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-page pk-pixel">
    <div class="auth-header">
      <RouterLink to="/" class="back-btn">← VOLTAR</RouterLink>
      <div class="auth-ball">
        <div class="ball-top" />
        <div class="ball-mid" />
        <div class="ball-bot" />
      </div>
      <h1 class="auth-title">LOGIN</h1>
    </div>

    <div class="auth-body pokemon-frame">
      <form class="form-group" @submit.prevent="submit">
        
        <div class="input-block">
          <label class="pk-label">Matrícula</label>
          <input
            v-model="matricula"
            type="text"
            placeholder="SUA MATRÍCULA"
            autocomplete="username"
            inputmode="text"
            class="pk-input"
          />
        </div>

        <div class="input-block">
          <label class="pk-label">Senha</label>
          <input
            v-model="password"
            type="password"
            placeholder="••••••••"
            autocomplete="current-password"
            class="pk-input"
          />
        </div>

        <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>

        <button type="submit" class="btn-pokemon-action" :disabled="loading">
          <span v-if="loading" class="spinner-pixel" />
          <span>{{ loading ? 'ENTRANDO...' : 'ENTRAR' }}</span>
        </button>
      </form>

      <div class="auth-footer">
        <span>Não tem conta?</span>
        <RouterLink to="/register" class="pk-link">Cadastre-se</RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Importando a fonte no escopo do componente */
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

.pk-pixel {
  font-family: 'Press Start 2P', monospace !important;
}

.auth-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #181c24;
  color: #ffffff;
}

/* Header Vermelho Sólido */
.auth-header {
  background: #cc0000;
  padding: 32px 20px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  position: relative;
  border-bottom: 6px solid #222222;
}

.back-btn {
  position: absolute;
  top: 16px;
  left: 16px;
  color: #ffffff;
  font-size: 9px;
  text-decoration: none;
  text-shadow: 1px 1px 0px #222222;
}

/* Pokebola Pixel Art */
.auth-ball {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  overflow: hidden;
  border: 4px solid #222222;
  box-shadow: inset -4px -4px 0px rgba(0,0,0,0.2);
}

.ball-top { height: 50%; background: #ef3e33; }
.ball-mid { 
  height: 6px; 
  background: #222222; 
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}
.ball-mid::after {
  content: '';
  width: 12px;
  height: 12px;
  background: white;
  border-radius: 50%;
  border: 3px solid #222222;
  position: absolute;
  z-index: 1;
}
.ball-bot { height: calc(50% - 6px); background: white; }

.auth-title {
  font-size: 18px;
  color: white;
  margin: 0;
  text-shadow: 3px 3px 0px #222222;
  letter-spacing: 1px;
}

/* Caixa de Diálogo Pokémon (Menu Interno) */
.auth-body {
  margin: 24px 16px;
  padding: 24px 16px;
  background: #101820;
  
  /* Borda dupla clássica (Frame Type 1) */
  border: 4px solid #285068;
  box-shadow: 
    inset 0 0 0 2px #58a0c0,
    inset 0 0 0 4px #101820;
  border-radius: 4px;
  
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.input-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Labels e Inputs Retro */
.pk-label {
  font-size: 10px;
  color: #f8d030; /* Amarelo clássico para os títulos dos campos */
  text-transform: uppercase;
}

.pk-input {
  font-family: 'Press Start 2P', monospace;
  font-size: 10px;
  background-color: #182028;
  color: #ffffff;
  border: 2px solid #285068;
  padding: 12px;
  border-radius: 2px;
  outline: none;
  box-shadow: inset 2px 2px 0px rgba(0,0,0,0.5);
}

.pk-input:focus {
  border-color: #58a0c0; /* Brilha ao selecionar, simulando cursor */
}

.pk-input::placeholder {
  color: #506070;
}

/* Mensagem de Erro */
.error-msg {
  font-size: 9px;
  color: #f85838; /* Vermelho vibrante de status do GBA */
  line-height: 1.4;
  border-left: 3px solid #f85838;
  padding-left: 6px;
}

/* Botão de Confirmação */
.btn-pokemon-action {
  width: 100%;
  background: #a81808;
  border: 3px solid #222222;
  box-shadow: 
    inset -3px -3px 0px #701008, 
    inset 3px 3px 0px #d82810;
  padding: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-pokemon-action span {
  font-family: 'Press Start 2P', monospace;
  font-size: 11px;
  color: #ffffff;
  text-shadow: 2px 2px 0px #222222;
}

.btn-pokemon-action:active:not(:disabled) {
  background: #701008;
  box-shadow: inset 3px 3px 0px rgba(0,0,0,0.5);
}

.btn-pokemon-action:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Loading Spinner em Pixel-art (Simula um quadradinho piscando/girando) */
.spinner-pixel {
  width: 8px;
  height: 8px;
  background-color: white;
  animation: blink 0.4s steps(2, start) infinite;
}

@keyframes blink {
  to { visibility: hidden; }
}

/* Rodapé e Links */
.auth-footer {
  text-align: center;
  font-size: 9px;
  color: #a8b8c0;
  display: flex;
  gap: 8px;
  justify-content: center;
  align-items: center;
  line-height: 1.4;
}

.pk-link {
  color: #f8d030;
  text-decoration: underline;
}

.pk-link:hover {
  color: #ffffff;
}
</style>