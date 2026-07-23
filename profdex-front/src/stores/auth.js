import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import api from '../services/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const hasRestoredSession = ref(false)

  const isAuthenticated = computed(() => !!user.value)

  async function register(matricula, name, password) {
    const { data } = await api.post('/auth/register', { matricula, name, password })
    setSession(data)
  }

  async function login(matricula, password) {
    const { data } = await api.post('/auth/login', { matricula, password })
    setSession(data)
  }

  function logout() {
    user.value = null
    hasRestoredSession.value = true
    return api.post('/auth/logout').catch(() => {})
  }

  function setSession(data) {
    user.value = data.user
  }

  async function restoreSession() {
    if (hasRestoredSession.value) return
    try {
      const { data } = await api.get('/auth/me')
      user.value = data.user
    } catch {
      user.value = null
    } finally {
      hasRestoredSession.value = true
    }
  }

  function expireSession() {
    user.value = null
    hasRestoredSession.value = true
  }

  window.addEventListener('auth:expired', expireSession)

  return { user, isAuthenticated, register, login, logout, restoreSession }
})
