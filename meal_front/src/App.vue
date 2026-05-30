<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import { useRouter } from 'vue-router'

import { logout as logoutAPI } from '@/api/auth'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
const { initials, isLoggedIn, name } = storeToRefs(userStore)
const isAccountMenuOpen = ref(false)

async function logout() {
  isAccountMenuOpen.value = false

  try {
    if (userStore.token) {
      await logoutAPI()
    }
  } catch (error) {
    console.warn('Logout request failed, clearing local session anyway.', error)
  } finally {
    userStore.clearUser()
  }

  await router.push('/login')
}
</script>

<template>
  <div class="app-shell">
    <main class="main-content">
      <header class="topbar">
        <div>
          <RouterLink class="brand-name" to="/" aria-label="Go to dashboard">
            <span class="brand-accent">M</span>ogu <span class="brand-accent">M</span>ogu
          </RouterLink>
        </div>

        <div v-if="isLoggedIn" class="topbar-actions">
          <button
            class="avatar-button"
            type="button"
            :aria-expanded="isAccountMenuOpen"
            aria-haspopup="menu"
            aria-label="Open account menu"
            :title="name"
            @click="isAccountMenuOpen = !isAccountMenuOpen"
          >
            {{ initials || 'U' }}
          </button>

          <div v-if="isAccountMenuOpen" class="account-menu" role="menu">
            <RouterLink class="account-menu-item" to="/profile" role="menuitem" @click="isAccountMenuOpen = false">
              Profile
            </RouterLink>
            <button class="account-menu-item account-menu-danger" type="button" role="menuitem" @click="logout">
              Log out
            </button>
          </div>
        </div>

        <RouterLink v-else class="login-link" to="/login">Log in</RouterLink>
      </header>

      <RouterView />
    </main>
  </div>
</template>
