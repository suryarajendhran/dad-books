<script setup lang="ts">
const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/vouchers/new', label: 'New Voucher' },
  { to: '/day-book', label: 'Day Book' },
  { to: '/ledgers', label: 'Ledgers' },
  { to: '/trial-balance', label: 'Trial Balance' }
]
</script>

<template>
  <div class="layout">
    <nav class="sidebar">
      <div class="brand">Dadbooks</div>
      <RouterLink v-for="link in links" :key="link.to" :to="link.to">{{ link.label }}</RouterLink>
    </nav>
    <main class="content">
      <RouterView />
    </main>
  </div>
</template>
