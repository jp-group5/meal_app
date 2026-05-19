import { createRouter, createWebHistory } from 'vue-router'

import DashboardView from '@/pages/DashboardView.vue'
import LoginView from '@/pages/LoginView.vue'
import OnboardingView from '@/pages/OnboardingView.vue'
import ProfileView from '@/pages/ProfileView.vue'
import { useUserStore } from '@/stores/user'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: DashboardView,
      meta: { requiresAuth: false },
    },
    {
      path: '/profile',
      name: 'profile',
      component: ProfileView,
      meta: { requiresAuth: true },
    },
    {
      path: '/onboarding',
      name: 'onboarding',
      component: OnboardingView,
      meta: { requiresAuth: true },
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { guestOnly: true },
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach((to) => {
  const userStore = useUserStore()

  if (to.meta.requiresAuth && !userStore.token) {
    return '/login'
  }

  if (
    userStore.token &&
    !userStore.questionnaireCompleted &&
    to.name !== 'onboarding' &&
    to.name !== 'login'
  ) {
    return '/onboarding'
  }

  if (userStore.token && userStore.questionnaireCompleted && to.name === 'onboarding') {
    return '/profile'
  }

  if (to.meta.guestOnly && userStore.token) {
    return userStore.questionnaireCompleted ? '/' : '/onboarding'
  }
})

export default router
