<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { RouterLink, RouterView } from 'vue-router'

import { useUserStore } from '@/stores/user'
import GraphPanel from '@/components/graph/GraphPanel.vue'

const userStore = useUserStore()
const { initials, isLoggedIn, name } = storeToRefs(userStore)
</script>

<template>
  <div class="app-shell">
    <main class="main-content">
      <header class="topbar">
        <div>
          <p class="topbar-kicker">Frontend Prototype</p>
          <strong>Meal App</strong>
        </div>

        <RouterLink
          v-if="isLoggedIn"
          class="avatar-link"
          to="/profile"
          aria-label="Open profile page"
          :title="name"
        >
          {{ initials || 'U' }}
        </RouterLink>

        <RouterLink v-else class="login-link" to="/login">Log in</RouterLink>
      </header>

      <RouterView />
    </main>
  </div>
</template>
