<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { formatAmount } from '@shared/money'
import type { Ledger, Voucher } from '@shared/types'
import { books, financialYearStart, today } from '../lib/books'

const to = ref(today())
const from = ref(financialYearStart(to.value))
const vouchers = ref<Voucher[]>([])
const ledgers = ref<Ledger[]>([])

const ledgerName = computed(() => new Map(ledgers.value.map((l) => [l.id, l.name])))

function total(v: Voucher): number {
  return v.lines.filter((l) => l.side === 'Dr').reduce((sum, l) => sum + l.amount, 0)
}

async function load(): Promise<void> {
  vouchers.value = await books.listVouchers({ from: from.value, to: to.value })
}

onMounted(async () => {
  ledgers.value = await books.listLedgers()
  await load()
})
watch([from, to], load)
</script>

<template>
  <h1>Day Book</h1>
  <div class="panel row">
    <label>From <input v-model="from" type="date" /></label>
    <label>To <input v-model="to" type="date" /></label>
  </div>
  <div class="panel">
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Type</th>
          <th>No.</th>
          <th>Particulars</th>
          <th>Narration</th>
          <th class="num">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="v in vouchers" :key="v.id">
          <td>{{ v.date }}</td>
          <td>{{ v.type }}</td>
          <td>{{ v.number }}</td>
          <td>
            <div v-for="(l, i) in v.lines" :key="i">
              {{ l.side }} {{ ledgerName.get(l.ledgerId) }}
              <span class="muted">{{ formatAmount(l.amount) }}</span>
            </div>
          </td>
          <td>{{ v.narration }}</td>
          <td class="num">{{ formatAmount(total(v)) }}</td>
        </tr>
        <tr v-if="vouchers.length === 0">
          <td colspan="6" class="muted">No vouchers in this period</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
