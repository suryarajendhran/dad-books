<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { formatAmount, parseAmount } from '@shared/money'
import type { Group, Ledger, Side } from '@shared/types'
import { books, errorMessage } from '../lib/books'

const groups = ref<Group[]>([])
const ledgers = ref<Ledger[]>([])
const name = ref('')
const groupId = ref<number | null>(null)
const opening = ref('')
const openingSide = ref<Side>('Dr')
const error = ref('')

const groupName = computed(() => new Map(groups.value.map((g) => [g.id, g.name])))

async function load(): Promise<void> {
  ;[groups.value, ledgers.value] = await Promise.all([books.listGroups(), books.listLedgers()])
}

async function create(): Promise<void> {
  error.value = ''
  try {
    if (groupId.value === null) throw new Error('Pick a group')
    const amount = opening.value.trim() ? parseAmount(opening.value) : 0
    await books.createLedger({
      name: name.value,
      groupId: groupId.value,
      openingBalance: openingSide.value === 'Dr' ? amount : -amount
    })
    name.value = ''
    opening.value = ''
    await load()
  } catch (e) {
    error.value = errorMessage(e)
  }
}

function balanceLabel(paise: number): string {
  if (paise === 0) return ''
  return `${formatAmount(Math.abs(paise))} ${paise > 0 ? 'Dr' : 'Cr'}`
}

onMounted(load)
</script>

<template>
  <h1>Ledgers</h1>
  <form class="panel row" @submit.prevent="create">
    <label>Name <input v-model="name" required /></label>
    <label>
      Group
      <select v-model="groupId" required>
        <option v-for="g in groups" :key="g.id" :value="g.id">{{ g.name }}</option>
      </select>
    </label>
    <label>Opening balance <input v-model="opening" class="num" placeholder="0.00" /></label>
    <label>
      Dr/Cr
      <select v-model="openingSide">
        <option>Dr</option>
        <option>Cr</option>
      </select>
    </label>
    <button class="primary" type="submit">Create ledger</button>
    <span v-if="error" class="error">{{ error }}</span>
  </form>

  <div class="panel">
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Group</th>
          <th class="num">Opening balance</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="l in ledgers" :key="l.id">
          <td>{{ l.name }}</td>
          <td>{{ groupName.get(l.groupId) }}</td>
          <td class="num">{{ balanceLabel(l.openingBalance) }}</td>
        </tr>
        <tr v-if="ledgers.length === 0">
          <td colspan="3" class="muted">No ledgers yet</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
