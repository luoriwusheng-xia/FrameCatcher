import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/RecorderView.vue')
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
    path: '/player',
    name: 'Player',
    component: () => import('../views/PlayerView.vue')
  },
  {
    path: '/area-selector',
    name: 'AreaSelector',
    component: () => import('../components/recorder/AreaSelector.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
