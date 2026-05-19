<script setup lang="ts">
import { storeToRefs } from 'pinia'

import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const { name, allergies, dietaryPreferences } = storeToRefs(userStore)
</script>

<template>
  <section class="page">
    <div class="page-header">
      <div>
        <p class="eyebrow">Settings</p>
        <h2>Preference settings</h2>
      </div>
    </div>

    <div class="content-grid">
      <section class="panel">
        <p class="label">User</p>
        <strong>{{ name }}</strong>
      </section>

      <section class="panel">
        <p class="label">Allergies</p>
        <strong>{{ allergies.length ? allergies.join(', ') : 'Not set' }}</strong>
      </section>

      <section class="panel">
        <p class="label">Dietary preferences</p>
        <strong>{{ dietaryPreferences.length ? dietaryPreferences.join(', ') : 'Not set' }}</strong>
      </section>
    </div>
  </section>
</template>
