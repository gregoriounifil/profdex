import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import api from '../services/api'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token'))
  const user = ref(JSON.parse(localStorage.getItem('user') ?? 'null'))

  const isAuthenticated = computed(() => !!token.value)

  async function register(matricula, name, password) {
    const { data } = await api.post('/auth/register', { matricula, name, password })
    setSession(data)
  }

  async function login(matricula, password) {
    const { data } = await api.post('/auth/login', { matricula, password })
    setSession(data)
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  function setSession(data) {
    token.value = data.access_token
    user.value = data.user
    localStorage.setItem('token', data.access_token)
    localStorage.setItem('user', JSON.stringify(data.user))
  }

  return { token, user, isAuthenticated, register, login, logout }
})
