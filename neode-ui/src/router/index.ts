import { createRouter, createWebHistory } from 'vue-router'
import { useAppStore } from '../stores/app'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/login',
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/Login.vue'),
      meta: { public: true },
    },
    {
      path: '/onboarding/intro',
      name: 'onboarding-intro',
      component: () => import('../views/OnboardingIntro.vue'),
      meta: { public: true },
    },
    {
      path: '/onboarding/options',
      name: 'onboarding-options',
      component: () => import('../views/OnboardingOptions.vue'),
      meta: { public: true },
    },
    {
      path: '/onboarding/path',
      name: 'onboarding-path',
      component: () => import('../views/OnboardingPath.vue'),
      meta: { public: true },
    },
    {
      path: '/onboarding/did',
      name: 'onboarding-did',
      component: () => import('../views/OnboardingDid.vue'),
      meta: { public: true },
    },
    {
      path: '/onboarding/backup',
      name: 'onboarding-backup',
      component: () => import('../views/OnboardingBackup.vue'),
      meta: { public: true },
    },
    {
      path: '/onboarding/verify',
      name: 'onboarding-verify',
      component: () => import('../views/OnboardingVerify.vue'),
      meta: { public: true },
    },
    {
      path: '/onboarding/done',
      name: 'onboarding-done',
      component: () => import('../views/OnboardingDone.vue'),
      meta: { public: true },
    },
    {
      path: '/dashboard',
      component: () => import('../views/Dashboard.vue'),
      children: [
        {
          path: '',
          name: 'home',
          component: () => import('../views/Home.vue'),
        },
        {
          path: 'apps',
          name: 'apps',
          component: () => import('../views/Apps.vue'),
        },
        {
          path: 'apps/:id',
          name: 'app-details',
          component: () => import('../views/AppDetails.vue'),
        },
        {
          path: 'marketplace',
          name: 'marketplace',
          component: () => import('../views/Marketplace.vue'),
        },
        {
          path: 'server',
          name: 'server',
          component: () => import('../views/Server.vue'),
        },
        {
          path: 'settings',
          name: 'settings',
          component: () => import('../views/Settings.vue'),
        },
      ],
    },
  ],
})

// Auth guard
router.beforeEach((to, from, next) => {
  const store = useAppStore()
  const isPublic = to.meta.public

  if (!isPublic && !store.isAuthenticated) {
    next('/login')
  } else if (to.path === '/login' && store.isAuthenticated) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router

