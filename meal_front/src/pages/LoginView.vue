<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import { login, register } from '@/api/auth'
import { getCurrentUser, toUserModel } from '@/api/user'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const loginForm = reactive({
  username: '',
  password: '',
})

const registerForm = reactive({
  username: '',
  email: '',
  password: '',
})

const loginError = ref('')
const loginLoading = ref(false)
const registerError = ref('')
const registerSuccess = ref('')
const registerLoading = ref(false)
const showRegisterPanel = ref(false)

const USERNAME_REGEX = /^[a-zA-Z0-9]{3,32}$/
const PASSWORD_MIN = 8
const PASSWORD_MAX = 72

async function handleLogin() {
  loginError.value = ''

  const username = loginForm.username.trim()
  const password = loginForm.password

  if (!username || !password) {
    loginError.value = 'Please enter a username and password.'
    return
  }

  if (!USERNAME_REGEX.test(username)) {
    loginError.value = 'Username must be 3-32 letters or numbers.'
    return
  }

  if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) {
    loginError.value = 'Password must be 8-72 characters long.'
    return
  }

  loginLoading.value = true

  try {
    const response = await login({
      username,
      password,
    })

    const data = response.data

    if (!data?.access_token || !data.user) {
      loginError.value = 'Login response is missing required fields.'
      return
    }

    userStore.setSession({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      sessionId: data.session_id,
    })

    await syncUserFromServer({
      id: String(data.user.id),
      name: data.user.username,
      email: data.user.email ?? undefined,
    })

    await router.push(userStore.questionnaireCompleted ? '/' : '/onboarding')
  } catch (error) {
    loginError.value = extractMessage(error, 'Login failed. Please try again later.')
  } finally {
    loginLoading.value = false
  }
}

function openRegisterPanel() {
  registerError.value = ''
  registerSuccess.value = ''
  showRegisterPanel.value = true
}

function closeRegisterPanel() {
  showRegisterPanel.value = false
  registerError.value = ''
  registerSuccess.value = ''
}

async function handleRegister() {
  registerError.value = ''
  registerSuccess.value = ''

  const username = registerForm.username.trim()
  const password = registerForm.password
  const email = registerForm.email.trim()

  if (!username || !password) {
    registerError.value = 'Please enter a username and password.'
    return
  }

  if (!USERNAME_REGEX.test(username)) {
    registerError.value = 'Username must be 3-32 letters or numbers.'
    return
  }

  if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) {
    registerError.value = 'Password must be 8-72 characters long.'
    return
  }

  if (email && !isValidEmail(email)) {
    registerError.value = 'Email format is invalid.'
    return
  }

  registerLoading.value = true

  try {
    await register({
      username,
      email: email || undefined,
      password,
    })

    try {
      const loginResponse = await login({ username, password })
      const loginData = loginResponse.data

      if (!loginData?.access_token || !loginData.user) {
        registerSuccess.value = 'Registration succeeded. Please sign in and complete onboarding.'
        return
      }

      userStore.setSession({
        accessToken: loginData.access_token,
        refreshToken: loginData.refresh_token,
        sessionId: loginData.session_id,
      })

      await syncUserFromServer({
        id: String(loginData.user.id),
        name: loginData.user.username,
        email: loginData.user.email ?? undefined,
      })

      closeRegisterPanel()
      await router.push('/onboarding')
    } catch {
      registerSuccess.value = 'Registration succeeded. Please sign in and complete onboarding.'
      loginForm.username = username
      loginForm.password = ''
      registerForm.password = ''
    }
  } catch (error) {
    registerError.value = extractMessage(error, 'Registration failed. Please try again later.')
  } finally {
    registerLoading.value = false
  }
}

async function syncUserFromServer(fallback: { id: string; name: string; email?: string }) {
  try {
    const meResponse = await getCurrentUser()

    if (!meResponse.data) {
      throw new Error('User profile is missing.')
    }

    userStore.setUser(toUserModel(meResponse.data, { name: fallback.name, email: fallback.email }))
  } catch {
    userStore.setUser({
      id: fallback.id,
      name: fallback.name,
      email: fallback.email,
      allergies: [],
      dietaryPreferences: [],
      heightCm: null,
      weightKg: null,
      trainingExperience: [],
      fitnessGoal: null,
      monthlyFoodBudget: null,
    })
  }
}

function extractMessage(error: unknown, fallbackMessage: string) {
  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallbackMessage
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}
</script>

<template>
  <section class="login-page">
    <div class="login-panel">
      <p class="eyebrow">Account Access</p>
      <h2>Sign in to Meal App</h2>
      <p class="subtle-text">Sign in to access Dashboard, Profile, and AI recommendations.</p>

      <form class="auth-form" @submit.prevent="handleLogin">
        <label class="field-label" for="login-username">Username</label>
        <input
          id="login-username"
          v-model="loginForm.username"
          name="username"
          autocomplete="username"
          minlength="3"
          maxlength="32"
          pattern="[A-Za-z0-9]{3,32}"
          required
        />

        <label class="field-label" for="login-password">Password</label>
        <input
          id="login-password"
          v-model="loginForm.password"
          name="password"
          type="password"
          autocomplete="current-password"
          minlength="8"
          maxlength="72"
          required
        />

        <p v-if="loginError" class="error-message">{{ loginError }}</p>
        <button type="submit" :disabled="loginLoading">{{ loginLoading ? 'Signing in...' : 'Sign in' }}</button>
      </form>

      <button type="button" class="secondary-button" @click="openRegisterPanel">Create account</button>
    </div>

    <div v-if="showRegisterPanel" class="modal-mask" @click.self="closeRegisterPanel">
      <section class="modal-card" role="dialog" aria-modal="true" aria-labelledby="register-title">
        <div class="modal-header">
          <h3 id="register-title">Create account</h3>
          <button type="button" class="close-button" aria-label="Close registration panel" @click="closeRegisterPanel">×</button>
        </div>

        <form class="auth-form" @submit.prevent="handleRegister">
          <label class="field-label" for="register-username">Username</label>
          <input
            id="register-username"
            v-model="registerForm.username"
            name="register-username"
            minlength="3"
            maxlength="32"
            pattern="[A-Za-z0-9]{3,32}"
            required
          />

          <label class="field-label" for="register-email">Email (optional)</label>
          <input id="register-email" v-model="registerForm.email" name="register-email" type="email" />

          <label class="field-label" for="register-password">Password</label>
          <input
            id="register-password"
            v-model="registerForm.password"
            name="register-password"
            type="password"
            autocomplete="new-password"
            minlength="8"
            maxlength="72"
            required
          />

          <p v-if="registerError" class="error-message">{{ registerError }}</p>
          <p v-if="registerSuccess" class="success-message">{{ registerSuccess }}</p>

          <button type="submit" :disabled="registerLoading">
            {{ registerLoading ? 'Creating account...' : 'Create account' }}
          </button>
        </form>
      </section>
    </div>
  </section>
</template>

<style scoped>
.login-page {
  display: grid;
  min-height: calc(100vh - 8rem);
  place-items: center;
}

.login-panel {
  width: min(100%, 440px);
  border: 1px solid #d8dee6;
  border-radius: 10px;
  background: #ffffff;
  padding: 1.35rem;
}

.login-panel h2 {
  margin: 0 0 0.6rem;
}

.subtle-text {
  margin: 0 0 1rem;
  color: #5c6a78;
}

.auth-form {
  display: grid;
  gap: 0.55rem;
}

.field-label {
  margin-top: 0.25rem;
  color: #334155;
  font-size: 0.9rem;
}

.secondary-button {
  width: 100%;
  margin-top: 0.8rem;
  border-color: #d8dee6;
  color: #263241;
  background: #ffffff;
}

.secondary-button:hover {
  background: #f3f6f9;
}

.error-message {
  margin: 0.2rem 0 0;
  color: #b42318;
  font-size: 0.86rem;
}

.success-message {
  margin: 0.2rem 0 0;
  color: #0b6e4f;
  font-size: 0.86rem;
}

.modal-mask {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgb(15 23 42 / 40%);
  padding: 1rem;
}

.modal-card {
  width: min(100%, 460px);
  border: 1px solid #d8dee6;
  border-radius: 10px;
  background: #ffffff;
  padding: 1rem;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.modal-header h3 {
  margin: 0;
}

.close-button {
  width: 2rem;
  height: 2rem;
  border-radius: 999px;
  border-color: #d8dee6;
  color: #263241;
  background: #ffffff;
  padding: 0;
  line-height: 1;
  font-size: 1.2rem;
}
</style>
