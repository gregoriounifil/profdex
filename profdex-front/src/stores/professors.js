import { ref } from 'vue'
import { defineStore } from 'pinia'
import api from '../services/api'

export const useProfessorsStore = defineStore('professors', () => {
  const professors = ref([])
  const loading = ref(false)

  async function fetch() {
    loading.value = true
    try {
      const { data } = await api.get('/professors')
      professors.value = data
    } finally {
      loading.value = false
    }
  }

  async function discover(professorId) {
    await api.post('/discoveries', { professorId })
    await fetch()
  }

  async function capture(professorId) {
    await api.post('/captures', { professorId })
    await fetch()
  }

  async function captureByToken(token) {
    const { data } = await api.post('/captures/by-token', { token })
    await fetch()
    return data // { professor: { id, name, slug, ... }, ... }
  }

  return { professors, loading, fetch, discover, capture, captureByToken }
})
