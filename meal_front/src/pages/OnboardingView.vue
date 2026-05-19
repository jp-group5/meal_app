<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import { updateUserProfile } from '@/api/user'
import type { FitnessGoal, TrainingExperience } from '@/types'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

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

const loading = ref(false)
const errorMessage = ref('')
const infoMessage = ref('')

async function submitQuestionnaire() {
  errorMessage.value = ''
  infoMessage.value = ''

  const heightCm = Number(form.heightCm)
  const weightKg = Number(form.weightKg)
  const monthlyFoodBudget = Number(form.monthlyFoodBudget)

  if (!Number.isFinite(heightCm) || heightCm < 80 || heightCm > 260) {
    errorMessage.value = 'Please enter a valid height (80-260 cm).'
    return
  }

  if (!Number.isFinite(weightKg) || weightKg < 20 || weightKg > 300) {
    errorMessage.value = 'Please enter a valid weight (20-300 kg).'
    return
  }

  if (form.trainingExperience.length === 0) {
    errorMessage.value = 'Please select at least one training experience.'
    return
  }

  if (!form.fitnessGoal) {
    errorMessage.value = 'Please select a goal.'
    return
  }

  if (!Number.isFinite(monthlyFoodBudget) || monthlyFoodBudget < 100) {
    errorMessage.value = 'Please enter a valid monthly food budget (at least 100).'
    return
  }

  loading.value = true

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

    await router.push('/profile')
  } catch (error) {
    if (shouldFallbackToLocal(error)) {
      userStore.updateQuestionnaire({
        heightCm,
        weightKg,
        trainingExperience: form.trainingExperience,
        fitnessGoal: form.fitnessGoal,
        monthlyFoodBudget,
      })

      infoMessage.value = 'The profile API is temporarily unavailable, so your data was saved locally. You can save it to the database again from Profile after the backend recovers.'
      await router.push('/profile')
      return
    }

    if (error instanceof Error && error.message) {
      errorMessage.value = error.message
      return
    }

    errorMessage.value = 'Submission failed. Please try again later.'
  } finally {
    loading.value = false
  }
}

function shouldFallbackToLocal(error: unknown) {
  if (!(error instanceof Error)) {
    return false
  }

  return (
    error.message.includes('status code 404') ||
    error.message.includes('status code 500') ||
    error.message.includes('Network Error')
  )
}
</script>

<template>
  <section class="page">
    <div class="page-header">
      <div>
        <p class="eyebrow">Onboarding</p>
        <h2>Complete your basic profile</h2>
      </div>
    </div>

    <section class="panel onboarding-panel">
      <p class="subtle-text">Please complete this questionnaire after registration. You can keep editing it on the Profile page later.</p>

      <form class="questionnaire-form" @submit.prevent="submitQuestionnaire">
        <label class="field-label" for="height-cm">Height (cm)</label>
        <input id="height-cm" v-model="form.heightCm" inputmode="decimal" placeholder="e.g. 170" required />

        <label class="field-label" for="weight-kg">Weight (kg)</label>
        <input id="weight-kg" v-model="form.weightKg" inputmode="decimal" placeholder="e.g. 62" required />

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
            <input v-model="form.fitnessGoal" type="radio" name="fitness-goal" :value="option.value" />
            <span>{{ option.label }}</span>
          </label>
        </fieldset>

        <label class="field-label" for="monthly-budget">Monthly food budget limit</label>
        <input
          id="monthly-budget"
          v-model="form.monthlyFoodBudget"
          inputmode="numeric"
          placeholder="e.g. 2500"
          required
        />

        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
        <p v-if="infoMessage" class="success-message">{{ infoMessage }}</p>

        <button type="submit" :disabled="loading">
          {{ loading ? 'Submitting...' : 'Submit and save profile' }}
        </button>
      </form>
    </section>
  </section>
</template>

<style scoped>
.onboarding-panel {
  max-width: 720px;
}

.questionnaire-form {
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

.subtle-text {
  margin-top: 0;
  color: #5c6a78;
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
</style>
