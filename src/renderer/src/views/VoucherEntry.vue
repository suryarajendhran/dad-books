<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { formatAmount, parseAmount } from '@shared/money'
import { VOUCHER_TYPES, type Ledger, type Side, type VoucherType } from '@shared/types'
import { voucherDifference } from '@shared/voucher'
import { books, errorMessage, today } from '../lib/books'

interface DraftLine {
  ledgerId: number | null
  side: Side
  amount: string
}

const ledgers = ref<Ledger[]>([])
const type = ref<VoucherType>('payment')
const date = ref(today())
const narration = ref('')
const lines = reactive<DraftLine[]>([])
const error = ref('')
const saved = ref('')

function resetLines(): void {
  lines.splice(0, lines.length, blankLine('Dr'), blankLine('Cr'))
}

function blankLine(side: Side): DraftLine {
  return { ledgerId: null, side, amount: '' }
}

function safeParse(amount: string): number | null {
  try {
    return parseAmount(amount)
  } catch {
    return null
  }
}

const parsedLines = computed(() =>
  lines.map((l) => ({ ledgerId: l.ledgerId, side: l.side, amount: safeParse(l.amount) }))
)
const totals = computed(() => {
  let dr = 0
  let cr = 0
  for (const l of parsedLines.value) {
    if (l.side === 'Dr') dr += l.amount ?? 0
    else cr += l.amount ?? 0
  }
  return { dr, cr }
})

async function save(): Promise<void> {
  error.value = ''
  saved.value = ''
  try {
    const voucherLines = parsedLines.value.map((l, i) => {
      if (l.ledgerId === null) throw new Error(`Line ${i + 1}: pick a ledger`)
      if (l.amount === null) throw new Error(`Line ${i + 1}: enter a valid amount`)
      return { ledgerId: l.ledgerId, side: l.side, amount: l.amount }
    })
    if (voucherDifference(voucherLines) !== 0) throw new Error('Debits and credits must be equal')
    const voucher = await books.createVoucher({
      type: type.value,
      date: date.value,
      narration: narration.value,
      lines: voucherLines
    })
    saved.value = `Saved ${voucher.type} #${voucher.number}`
    narration.value = ''
    resetLines()
  } catch (e) {
    error.value = errorMessage(e)
  }
}

onMounted(async () => {
  resetLines()
  ledgers.value = await books.listLedgers()
})
</script>

<template>
  <h1>New Voucher</h1>
  <form class="panel" @submit.prevent="save">
    <div class="row">
      <label>
        Type
        <select v-model="type">
          <option v-for="t in VOUCHER_TYPES" :key="t" :value="t">{{ t }}</option>
        </select>
      </label>
      <label>Date <input v-model="date" type="date" required /></label>
    </div>

    <table style="margin-top: 16px">
      <thead>
        <tr>
          <th style="width: 80px">Dr/Cr</th>
          <th>Ledger</th>
          <th class="num" style="width: 180px">Amount</th>
          <th style="width: 40px"></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(line, i) in lines" :key="i">
          <td>
            <select v-model="line.side">
              <option>Dr</option>
              <option>Cr</option>
            </select>
          </td>
          <td>
            <select v-model="line.ledgerId" style="width: 100%">
              <option v-for="l in ledgers" :key="l.id" :value="l.id">{{ l.name }}</option>
            </select>
          </td>
          <td>
            <input v-model="line.amount" class="num" style="width: 100%" placeholder="0.00" />
          </td>
          <td>
            <button type="button" :disabled="lines.length <= 2" @click="lines.splice(i, 1)">
              ×
            </button>
          </td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <td colspan="2">
            <button
              type="button"
              @click="lines.push(blankLine(totals.dr > totals.cr ? 'Cr' : 'Dr'))"
            >
              Add line
            </button>
          </td>
          <td class="num">
            Dr {{ formatAmount(totals.dr) }}<br />Cr {{ formatAmount(totals.cr) }}
          </td>
          <td></td>
        </tr>
      </tfoot>
    </table>

    <label style="margin-top: 16px">Narration <textarea v-model="narration" rows="2" /></label>

    <div class="row" style="margin-top: 16px">
      <button class="primary" type="submit">Save voucher</button>
      <span v-if="error" class="error">{{ error }}</span>
      <span v-if="saved">{{ saved }}</span>
    </div>
  </form>
</template>
