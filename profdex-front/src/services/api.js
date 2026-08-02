import axios from 'axios'
import { resolveApiBaseUrl } from './api-base-url'

// Em produção, todas as chamadas passam pelo mesmo domínio do frontend.
// Além de evitar CORS, isso permite que o cookie HttpOnly SameSite=Lax seja
// enviado sem transformar a sessão em um cookie de terceiros.
const baseURL = resolveApiBaseUrl({
  isDevelopment: import.meta.env.DEV,
  configuredUrl: import.meta.env.VITE_API_URL,
})

const api = axios.create({
  baseURL,
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
