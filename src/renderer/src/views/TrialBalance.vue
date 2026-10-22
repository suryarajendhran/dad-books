<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { formatAmount } from '@shared/money'
import type { TrialBalance } from '@shared/types'
import { books, today } from '../lib/books'

const asOf = ref(today())
const trial = ref<TrialBalance | null>(null)

async function load(): Promise<void> {
  trial.value = await books.trialBalance(asOf.value)
}

onMounted(load)
watch(asOf, load)
</script>

<template>
  <h1>Trial Balance</h1>
  <div class="panel row">
    <label>As of <input v-model="asOf" type="date" /></label>
  </div>
  <div v-if="trial" class="panel">
    <table>
      <thead>
        <tr>
          <th>Ledger</th>
          <th>Group</th>
          <th class="num">Debit</th>
          <th class="num">Credit</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in trial.rows" :key="row.ledgerId">
          <td>{{ row.name }}</td>
          <td class="muted">{{ row.groupName }}</td>
          <td class="num">{{ row.balance > 0 ? formatAmount(row.balance) : '' }}</td>
          <td class="num">{{ row.balance < 0 ? formatAmount(-row.balance) : '' }}</td>
        </tr>
        <tr v-if="trial.rows.length === 0">
          <td colspan="4" class="muted">No balances</td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <td colspan="2">Total</td>
          <td class="num">{{ formatAmount(trial.totalDebit) }}</td>
          <td class="num">{{ formatAmount(trial.totalCredit) }}</td>
        </tr>
      </tfoot>
    </table>
    <p v-if="trial.openingDifference !== 0" class="error">
      Difference in opening balances: {{ formatAmount(trial.openingDifference) }}
    </p>
  </div>
</template>
