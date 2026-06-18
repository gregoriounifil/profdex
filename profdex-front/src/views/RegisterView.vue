<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()

const name = ref('')
const matricula = ref('')
const password = ref('')
const loading = ref(false)
const errorMsg = ref('')

async function submit() {
  if (!name.value || !matricula.value || !password.value) return
  if (password.value.length < 6) {
    errorMsg.value = 'Senha deve ter no mínimo 6 caracteres'
    return
  }
  loading.value = true
  errorMsg.value = ''
  try {
    await auth.register(matricula.value.trim(), name.value.trim(), password.value)
    router.push({ name: 'profdex' })
  } catch (err) {
    errorMsg.value = err.response?.data?.message ?? 'Erro ao cadastrar'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-header">
      <RouterLink to="/login" class="back-btn">← Voltar</RouterLink>
      <div class="auth-ball">
        <div class="ball-top" />
        <div class="ball-mid" />
        <div class="ball-bot" />
      </div>
      <h1 class="pixel auth-title">CADASTRO</h1>
    </div>

    <div class="auth-body">
      <form class="form-group" @submit.prevent="submit">
        <div>
          <label>Nome</label>
          <input v-model="name" type="text" placeholder="Seu nome completo" autocomplete="name" />
        </div>

        <div>
          <label>Matrícula</label>
          <input
            v-model="matricula"
            type="text"
            placeholder="Sua matrícula"
            autocomplete="username"
          />
        </div>

        <div>
          <label>Senha</label>
          <input
            v-model="password"
            type="password"
            placeholder="Mínimo 6 caracteres"
            autocomplete="new-password"
          />
        </div>

        <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>

        <button type="submit" class="btn btn-primary" :disabled="loading">
          <span v-if="loading" class="spinner" />
          <span class="pixel">{{ loading ? 'Cadastrando...' : 'CRIAR CONTA' }}</span>
        </button>
      </form>

      <div class="auth-footer">
        <span>Já tem conta?</span>
        <RouterLink to="/login">Fazer login</RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.auth-header {
  background: linear-gradient(160deg, var(--red-dark), var(--red));
  padding: 24px 20px 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  position: relative;
}

.auth-header::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0; right: 0;
  height: 24px;
  background: var(--bg);
  border-radius: 24px 24px 0 0;
}

.back-btn {
  position: absolute;
  top: 20px;
  left: 20px;
  color: rgba(255,255,255,0.8);
  font-size: 13px;
}

.auth-ball {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid rgba(255,255,255,0.35);
  animation: pulse 2s ease-in-out infinite;
}

.ball-top { height: 50%; background: white; }
.ball-mid { height: 8px; background: #222; }
.ball-bot { height: calc(50% - 8px); background: var(--red); }

.auth-title {
  font-size: 18px;
  color: white;
  text-shadow: 2px 2px 0 rgba(0,0,0,0.3);
}

.auth-body {
  flex: 1;
  padding: 28px 20px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  overflow-y: auto;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}

.auth-footer {
  text-align: center;
  font-size: 13px;
  color: var(--text-muted);
  display: flex;
  gap: 6px;
  justify-content: center;
}
</style>
