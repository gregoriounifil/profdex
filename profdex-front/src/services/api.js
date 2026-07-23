import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
  withCredentials: true,
})

api.interceptors.response.use(undefined, (error) => {
  if (error.response?.status === 401) {
    window.dispatchEvent(new CustomEvent('auth:expired'))
  }
  return Promise.reject(error)
})

export default api
