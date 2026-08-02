import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

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
      path: '/ranking',
      name: 'ranking',
      component: () => import('../views/RankingView.vue'),
    },
    {
      path: '/arena/:id',
      name: 'arena',
      component: () => import('../views/ArenaView.vue'),
      meta: { auth: true },
      props: true,
    },
    {
      path: '/character-ar/:id',
      name: 'character-ar',
      component: () => import('../views/CharacterARView.vue'),
      meta: { auth: true },
      props: true,
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
