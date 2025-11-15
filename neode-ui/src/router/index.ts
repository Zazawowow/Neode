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
      path: '/',
      component: () => import('../views/OnboardingWrapper.vue'),
      meta: { public: true },
      children: [
        {
          path: 'login',
          name: 'login',
          component: () => import('../views/Login.vue'),
        },
        {
          path: 'onboarding/intro',
          name: 'onboarding-intro',
          component: () => import('../views/OnboardingIntro.vue'),
        },
        {
          path: 'onboarding/options',
          name: 'onboarding-options',
          component: () => import('../views/OnboardingOptions.vue'),
        },
        {
          path: 'onboarding/path',
          name: 'onboarding-path',
          component: () => import('../views/OnboardingPath.vue'),
        },
        {
          path: 'onboarding/did',
          name: 'onboarding-did',
          component: () => import('../views/OnboardingDid.vue'),
        },
        {
          path: 'onboarding/backup',
          name: 'onboarding-backup',
          component: () => import('../views/OnboardingBackup.vue'),
        },
        {
          path: 'onboarding/verify',
          name: 'onboarding-verify',
          component: () => import('../views/OnboardingVerify.vue'),
        },
        {
          path: 'onboarding/done',
          name: 'onboarding-done',
          component: () => import('../views/OnboardingDone.vue'),
        },
      ],
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
          path: 'marketplace/:id',
          name: 'marketplace-app-detail',
          component: () => import('../views/MarketplaceAppDetails.vue'),
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
router.beforeEach(async (to, from, next) => {
  const store = useAppStore()
  const isPublic = to.meta.public

  // Check session on first load or when not authenticated
  if (!store.isAuthenticated && !isPublic) {
    const hasSession = await store.checkSession()
    if (hasSession) {
      next()
      return
    }
  }

  if (!isPublic && !store.isAuthenticated) {
    next('/login')
  } else if (to.path === '/login' && store.isAuthenticated) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router

