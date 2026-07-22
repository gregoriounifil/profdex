import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useProfessorsStore } from '../stores/professors'

// Teto para a espera do preload. O `api` não define timeout (axios usa 0 =
// infinito), então um backend lento ou fora do ar travaria a navegação para
// sempre — foi o estado real do Railway durante o deploy (deploys em Queued).
const PRELOAD_TIMEOUT_MS = 3000

// As telas de /arena/:id e /character-ar/:id resolvem o professor pelo
// parâmetro da rota logo no setup. Carregar a lista antes de entrar evita que
// um acesso direto (deep link / F5) caia no modelo padrão.
//
// A espera é limitada de propósito: o professor tem fallback (state da
// navegação → modelo padrão), então é melhor entrar na arena com o fallback do
// que deixar o jogador preso na tela anterior. Sem backend (dev offline) a
// tela volta a se comportar como antes desta mudança.
async function preloadProfessors() {
  const store = useProfessorsStore()
  await Promise.race([
    store.ensureLoaded().catch(() => {}),
    new Promise((resolve) => setTimeout(resolve, PRELOAD_TIMEOUT_MS)),
  ])
  return true
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue'),
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { guest: true },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/RegisterView.vue'),
      meta: { guest: true },
    },
    {
      path: '/profdex',
      name: 'profdex',
      component: () => import('../views/ProfdexView.vue'),
      meta: { auth: true },
    },
    {
      path: '/scan',
      name: 'scan',
      component: () => import('../views/ScanView.vue'),
      meta: { auth: true },
    },
    {
      path: '/capture',
      name: 'capture',
      component: () => import('../views/CaptureView.vue'),
      meta: { auth: true },
    },
    {
      path: '/batalha',
      name: 'batalha',
      component: () => import('../views/BatalhaView.vue'),
      meta: { auth: true },
    },
    {
      path: '/batalha/guia',
      name: 'battle-guide',
      component: () => import('../views/BattleGuideView.vue'),
      meta: { auth: true },
    },
    {
      // Exemplo/laboratório do TresJS — sem guarda de auth para facilitar testar
      path: '/tres-demo',
      name: 'tres-demo',
      component: () => import('../views/TresDemoView.vue'),
    },
    {
      // Cenário do túnel binário (inspirado na imagem de referência)
      path: '/tunel-binario',
      name: 'binary-tunnel',
      component: () => import('../views/BinaryTunnelView.vue'),
    },
    {
      path: '/arena/:id',
      name: 'arena',
      component: () => import('../views/ArenaView.vue'),
      meta: { auth: true },
      props: true,
      beforeEnter: preloadProfessors,
    },
    {
      path: '/character-ar/:id',
      name: 'character-ar',
      component: () => import('../views/CharacterARView.vue'),
      meta: { auth: true },
      props: true,
      beforeEnter: preloadProfessors,
    },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()

  if (to.meta.auth && !auth.isAuthenticated) {
    return { name: 'login' }
  }

  if (to.meta.guest && auth.isAuthenticated) {
    return { name: 'profdex' }
  }
})

export default router
