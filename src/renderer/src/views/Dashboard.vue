<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { formatAmount } from '@shared/money'
import type { TrialBalance } from '@shared/types'
import { books, today } from '../lib/books'

const ledgerCount = ref(0)
const trial = ref<TrialBalance | null>(null)

onMounted(async () => {
  ledgerCount.value = (await books.listLedgers()).length
  trial.value = await books.trialBalance(today())
})
</script>

<template>
  <h1>Dashboard</h1>
  <div class="panel">
    <p v-if="ledgerCount === 0">
      No ledgers yet. Start by <RouterLink to="/ledgers">creating ledgers</RouterLink> for your
      cash, bank accounts, parties and expenses.
    </p>
    <template v-else-if="trial">
      <p>{{ ledgerCount }} ledgers</p>
      <p>
        Trial balance as of {{ trial.asOf }}: Dr {{ formatAmount(trial.totalDebit) }} / Cr
        {{ formatAmount(trial.totalCredit) }}
      </p>
      <p v-if="trial.openingDifference !== 0" class="error">
        Difference in opening balances: {{ formatAmount(trial.openingDifference) }}
      </p>
    </template>
  </div>
</template>
