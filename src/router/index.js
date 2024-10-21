import { createRouter, createWebHistory } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import NoHeaderLayout from '@/layouts/NoHeaderLayout.vue'
import BarberLayout from '@/layouts/BarberLayout.vue'
import { auth } from '@/firebaseConfig'

const routes = [
  {
    path: '/',
    component: DefaultLayout,
    children: [
      {
        path: '',
        name: 'ClientView',
        component: () => import('@/views/ClientView.vue')
      }
    ]
  },
  {
    path: '/barber',
    component: BarberLayout,
    children: [
      {
        path: 'schedule-manager',
        name: 'BarberScheduleManager',
        component: () => import('@/components/WorkSchedule.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'clients',
        name: 'ClientList',
        component: () => import('@/components/ClientList.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'appointments',
        name: 'ScheduleView',
        component: () => import('@/components/ScheduleView.vue'),
        meta: { requiresAuth: true }
      }
    ]
  },
  {
    path: '/login',
    component: NoHeaderLayout,
    children: [
      {
        path: '',
        name: 'Login',
        component: () => import('@/views/LoginView.vue'),
        meta: { requiresGuest: true }
      }
    ]
  },
  {
    path: '/register',
    component: NoHeaderLayout,
    children: [
      {
        path: '',
        name: 'Register',
        component: () => import('@/views/RegisterView.vue'),
        meta: { requiresGuest: true }
      }
    ]
  },
  {
    path: '/forgot-password',
    component: NoHeaderLayout,
    children: [
      {
        path: '',
        name: 'ForgotPassword',
        component: () => import('@/views/ForgotPassword.vue'),
        meta: { requiresGuest: true }
      }
    ]
  },
  {
    path: '/not-authorized',
    component: NoHeaderLayout,
    children: [
      {
        path: '',
        name: 'NotAuthorized',
        component: () => import('@/views/NotAuthorized.vue'),
        meta: { requiresGuest: true }
      }
    ]
  },
  {
    path: '/perfil', // Corrigido o caminho
    component: DefaultLayout,
    children: [
      {
        path: '',
        name: 'Perfil',
        component: () => import('@/components/ProfileComp.vue'),
        meta: { requiresAuth: true } // Ajustado para requerer autenticação
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  const user = auth.currentUser

  if (to.matched.some((record) => record.meta.requiresAuth) && !user) {
    next('/login')
  } else if (to.matched.some((record) => record.meta.requiresGuest) && user) {
    next('/')
  } else if (to.meta.role && user && !user.roles.includes(to.meta.role)) {
    next('/not-authorized')
  } else {
    next()
  }
})

export default router