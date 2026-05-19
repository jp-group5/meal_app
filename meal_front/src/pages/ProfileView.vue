<script setup lang="ts">
import { reactive, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'

import { logout as logoutAPI } from '@/api/auth'
import { updateUserProfile } from '@/api/user'
import type { FitnessGoal, TrainingExperience } from '@/types'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
const { id, initials, name } = storeToRefs(userStore)

const trainingOptions: Array<{ value: TrainingExperience; label: string }> = [
  { value: 'fitness', label: 'Fitness' },
  { value: 'yoga', label: 'Yoga' },
  { value: 'pilates', label: 'Pilates' },
  { value: 'climbing', label: 'Climbing' },
]

const goalOptions: Array<{ value: FitnessGoal; label: string }> = [
  { value: 'lose_weight', label: 'Lose weight' },
  { value: 'build_muscle', label: 'Build muscle' },
  { value: 'maintain_shape', label: 'Maintain shape' },
]

const form = reactive({
  heightCm: userStore.heightCm ? String(userStore.heightCm) : '',
  weightKg: userStore.weightKg ? String(userStore.weightKg) : '',
  trainingExperience: [...userStore.trainingExperience] as TrainingExperience[],
  fitnessGoal: (userStore.fitnessGoal ?? '') as FitnessGoal | '',
  monthlyFoodBudget: userStore.monthlyFoodBudget ? String(userStore.monthlyFoodBudget) : '',
})

const saveLoading = ref(false)
const saveError = ref('')
const saveSuccess = ref('')

async function saveProfile() {
  saveError.value = ''
  saveSuccess.value = ''

  const heightCm = Number(form.heightCm)
  const weightKg = Number(form.weightKg)
  const monthlyFoodBudget = Number(form.monthlyFoodBudget)

  if (!Number.isFinite(heightCm) || heightCm < 80 || heightCm > 260) {
    saveError.value = 'Please enter a valid height (80-260 cm).'
    return
  }

  if (!Number.isFinite(weightKg) || weightKg < 20 || weightKg > 300) {
    saveError.value = 'Please enter a valid weight (20-300 kg).'
    return
  }

  if (form.trainingExperience.length === 0) {
    saveError.value = 'Please select at least one training experience.'
    return
  }

  if (!form.fitnessGoal) {
    saveError.value = 'Please select a goal.'
    return
  }

  if (!Number.isFinite(monthlyFoodBudget) || monthlyFoodBudget < 100) {
    saveError.value = 'Please enter a valid monthly food budget (at least 100).'
    return
  }

  saveLoading.value = true

  try {
    await updateUserProfile({
      height_cm: heightCm,
      weight_kg: weightKg,
      training_experience: form.trainingExperience,
      fitness_goal: form.fitnessGoal,
      monthly_food_budget: monthlyFoodBudget,
    })

    userStore.updateQuestionnaire({
      heightCm,
      weightKg,
      trainingExperience: form.trainingExperience,
      fitnessGoal: form.fitnessGoal,
      monthlyFoodBudget,
    })

    saveSuccess.value = 'Profile has been updated.'
  } catch (error) {
    if (error instanceof Error && error.message) {
      saveError.value = error.message
      return
    }

    saveError.value = 'Save failed. Please try again later.'
  } finally {
    saveLoading.value = false
  }
}

async function logout() {
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
  <section class="page">
    <div class="page-header">
      <div>
        <p class="eyebrow">Profile</p>
        <h2>User profile</h2>
      </div>
    </div>

    <section class="panel profile-panel">
      <div class="profile-avatar" aria-hidden="true">
        {{ initials || 'U' }}
      </div>

      <div class="profile-details">
        <p class="label">Current user</p>
        <h3>{{ name || 'Guest' }}</h3>
        <p class="subtle-text">User ID: {{ id || 'not signed in' }}</p>
      </div>
    </section>

    <section class="panel form-panel">
      <h3 class="section-title">Basic profile (editable anytime)</h3>
      <form class="profile-form" @submit.prevent="saveProfile">
        <label class="field-label" for="profile-height">Height (cm)</label>
        <input id="profile-height" v-model="form.heightCm" inputmode="decimal" required />

        <label class="field-label" for="profile-weight">Weight (kg)</label>
        <input id="profile-weight" v-model="form.weightKg" inputmode="decimal" required />

        <fieldset class="checkbox-group">
          <legend class="field-label">Training experience (multiple choices allowed)</legend>
          <label v-for="option in trainingOptions" :key="option.value" class="checkbox-row">
            <input v-model="form.trainingExperience" type="checkbox" :value="option.value" />
            <span>{{ option.label }}</span>
          </label>
        </fieldset>

        <fieldset class="radio-group">
          <legend class="field-label">Goal (single choice)</legend>
          <label v-for="option in goalOptions" :key="option.value" class="checkbox-row">
            <input v-model="form.fitnessGoal" type="radio" name="profile-goal" :value="option.value" />
            <span>{{ option.label }}</span>
          </label>
        </fieldset>

        <label class="field-label" for="profile-budget">Monthly food budget limit</label>
        <input id="profile-budget" v-model="form.monthlyFoodBudget" inputmode="numeric" required />

        <p v-if="saveError" class="error-message">{{ saveError }}</p>
        <p v-if="saveSuccess" class="success-message">{{ saveSuccess }}</p>

        <button type="submit" :disabled="saveLoading">
          {{ saveLoading ? 'Saving...' : 'Save profile' }}
        </button>
      </form>
    </section>

    <section class="panel">
      <button type="button" class="danger-button" @click="logout">Log out</button>
    </section>
  </section>
</template>

<style scoped>
.profile-panel {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.profile-avatar {
  display: grid;
  flex: 0 0 auto;
  width: 4rem;
  height: 4rem;
  place-items: center;
  border-radius: 999px;
  color: #ffffff;
  background: #1f6f63;
  font-size: 1.35rem;
  font-weight: 800;
}

.profile-details h3 {
  margin: 0;
  font-size: 1.35rem;
}

.form-panel {
  max-width: 720px;
}

.section-title {
  margin-top: 0;
}

.profile-form {
  display: grid;
  gap: 0.85rem;
}

.field-label {
  color: #344254;
  font-weight: 600;
}

.checkbox-group,
.radio-group {
  display: grid;
  gap: 0.45rem;
  margin: 0;
  border: 1px solid #d8dee6;
  border-radius: 8px;
  padding: 0.8rem;
}

.checkbox-row {
  display: flex;
  align-items: center;
  gap: 0.55rem;
}

.checkbox-row input {
  width: 1rem;
  height: 1rem;
}

.error-message {
  margin: 0;
  color: #b42318;
  font-size: 0.9rem;
  font-weight: 600;
}

.success-message {
  margin: 0;
  color: #0b6e4f;
  font-size: 0.9rem;
  font-weight: 600;
}

.danger-button {
  border-color: #b42318;
  background: #b42318;
}
</style>
