import { createRouter, createWebHashHistory } from 'vue-router'
import Dashboard from './views/Dashboard.vue'

// Hash history: the packaged app loads index.html from disk via file://.
export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: Dashboard },
    { path: '/ledgers', component: () => import('./views/Ledgers.vue') },
    { path: '/vouchers/new', component: () => import('./views/VoucherEntry.vue') },
    { path: '/day-book', component: () => import('./views/DayBook.vue') },
    { path: '/trial-balance', component: () => import('./views/TrialBalance.vue') }
  ]
})
