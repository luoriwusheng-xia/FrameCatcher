import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/HomeView.vue')
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('../views/SettingsView.vue')
  },
  {
    path: '/records',
    name: 'Records',
    component: () => import('../views/RecordsView.vue')
  },
  {
    path: '/player/:path',
    name: 'Player',
    component: () => import('../views/PlayerView.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
