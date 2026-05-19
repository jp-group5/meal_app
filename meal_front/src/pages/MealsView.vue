<script setup lang="ts">
import { storeToRefs } from 'pinia'

import { useDateStore } from '@/stores/date'

const { selectedDate } = storeToRefs(useDateStore())
</script>

<template>
  <section class="page">
    <div class="page-header">
      <div>
        <p class="eyebrow">Meals</p>
        <h2>Meal records</h2>
      </div>
    </div>

    <section class="panel">
      <p class="label">Record date</p>
      <strong>{{ selectedDate }}</strong>
    </section>
  </section>
</template>
