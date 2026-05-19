import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import type { FitnessGoal, TrainingExperience, User } from '@/types'

export const useUserStore = defineStore('user', () => {
  const STORAGE_KEYS = {
    loggedOut: 'meal_app_logged_out',
    userId: 'meal_app_user_id',
    userName: 'meal_app_user_name',
    userEmail: 'meal_app_user_email',
    accessToken: 'meal_app_token',
    refreshToken: 'meal_app_refresh_token',
    sessionId: 'meal_app_session_id',
    allergies: 'meal_app_allergies',
    dietaryPreferences: 'meal_app_dietary_preferences',
    heightCm: 'meal_app_height_cm',
    weightKg: 'meal_app_weight_kg',
    trainingExperience: 'meal_app_training_experience',
    fitnessGoal: 'meal_app_fitness_goal',
    monthlyFoodBudget: 'meal_app_monthly_food_budget',
  } as const

  const isLoggedOut = localStorage.getItem(STORAGE_KEYS.loggedOut) === 'true'
  const id = ref(isLoggedOut ? '' : (localStorage.getItem(STORAGE_KEYS.userId) ?? ''))
  const name = ref(isLoggedOut ? '' : (localStorage.getItem(STORAGE_KEYS.userName) ?? ''))
  const email = ref(isLoggedOut ? '' : (localStorage.getItem(STORAGE_KEYS.userEmail) ?? ''))
  const token = ref(isLoggedOut ? '' : (localStorage.getItem(STORAGE_KEYS.accessToken) ?? ''))
  const refreshToken = ref(isLoggedOut ? '' : (localStorage.getItem(STORAGE_KEYS.refreshToken) ?? ''))
  const sessionId = ref(isLoggedOut ? '' : (localStorage.getItem(STORAGE_KEYS.sessionId) ?? ''))
  const allergies = ref<string[]>(isLoggedOut ? [] : readArray(STORAGE_KEYS.allergies))
  const dietaryPreferences = ref<string[]>(
    isLoggedOut ? [] : readArray(STORAGE_KEYS.dietaryPreferences),
  )
  const heightCm = ref<number | null>(isLoggedOut ? null : readNumber(STORAGE_KEYS.heightCm))
  const weightKg = ref<number | null>(isLoggedOut ? null : readNumber(STORAGE_KEYS.weightKg))
  const trainingExperience = ref<TrainingExperience[]>(
    isLoggedOut ? [] : readTrainingExperience(STORAGE_KEYS.trainingExperience),
  )
  const fitnessGoal = ref<FitnessGoal | null>(
    isLoggedOut ? null : (localStorage.getItem(STORAGE_KEYS.fitnessGoal) as FitnessGoal | null),
  )
  const monthlyFoodBudget = ref<number | null>(
    isLoggedOut ? null : readNumber(STORAGE_KEYS.monthlyFoodBudget),
  )

  const isLoggedIn = computed(() => Boolean(token.value))
  const questionnaireCompleted = computed(
    () =>
      heightCm.value !== null &&
      weightKg.value !== null &&
      trainingExperience.value.length > 0 &&
      Boolean(fitnessGoal.value) &&
      monthlyFoodBudget.value !== null,
  )
  const initials = computed(() =>
    name.value
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase(),
  )

  function setSession(payload: { accessToken: string; refreshToken?: string; sessionId?: string }) {
    token.value = payload.accessToken
    refreshToken.value = payload.refreshToken ?? ''
    sessionId.value = payload.sessionId ?? ''

    localStorage.setItem(STORAGE_KEYS.accessToken, token.value)

    if (refreshToken.value) {
      localStorage.setItem(STORAGE_KEYS.refreshToken, refreshToken.value)
    } else {
      localStorage.removeItem(STORAGE_KEYS.refreshToken)
    }

    if (sessionId.value) {
      localStorage.setItem(STORAGE_KEYS.sessionId, sessionId.value)
    } else {
      localStorage.removeItem(STORAGE_KEYS.sessionId)
    }

    localStorage.removeItem(STORAGE_KEYS.loggedOut)
  }

  function setUser(user: User) {
    id.value = String(user.id ?? '')
    name.value = user.name
    email.value = user.email ?? ''

    if (typeof user.token === 'string') {
      token.value = user.token
    }

    if (typeof user.refreshToken === 'string') {
      refreshToken.value = user.refreshToken
    }

    if (typeof user.sessionId === 'string') {
      sessionId.value = user.sessionId
    }

    allergies.value = user.allergies ?? []
    dietaryPreferences.value = user.dietaryPreferences ?? []
    heightCm.value = sanitizeNumber(user.heightCm)
    weightKg.value = sanitizeNumber(user.weightKg)
    trainingExperience.value = user.trainingExperience ?? []
    fitnessGoal.value = user.fitnessGoal ?? null
    monthlyFoodBudget.value = sanitizeNumber(user.monthlyFoodBudget)

    localStorage.setItem(STORAGE_KEYS.userId, id.value)
    localStorage.setItem(STORAGE_KEYS.userName, name.value)

    if (email.value) {
      localStorage.setItem(STORAGE_KEYS.userEmail, email.value)
    } else {
      localStorage.removeItem(STORAGE_KEYS.userEmail)
    }

    if (token.value) {
      localStorage.setItem(STORAGE_KEYS.accessToken, token.value)
    } else {
      localStorage.removeItem(STORAGE_KEYS.accessToken)
    }

    if (refreshToken.value) {
      localStorage.setItem(STORAGE_KEYS.refreshToken, refreshToken.value)
    } else {
      localStorage.removeItem(STORAGE_KEYS.refreshToken)
    }

    if (sessionId.value) {
      localStorage.setItem(STORAGE_KEYS.sessionId, sessionId.value)
    } else {
      localStorage.removeItem(STORAGE_KEYS.sessionId)
    }

    localStorage.setItem(STORAGE_KEYS.allergies, JSON.stringify(allergies.value))
    localStorage.setItem(STORAGE_KEYS.dietaryPreferences, JSON.stringify(dietaryPreferences.value))
    persistNumber(STORAGE_KEYS.heightCm, heightCm.value)
    persistNumber(STORAGE_KEYS.weightKg, weightKg.value)
    localStorage.setItem(STORAGE_KEYS.trainingExperience, JSON.stringify(trainingExperience.value))

    if (fitnessGoal.value) {
      localStorage.setItem(STORAGE_KEYS.fitnessGoal, fitnessGoal.value)
    } else {
      localStorage.removeItem(STORAGE_KEYS.fitnessGoal)
    }

    persistNumber(STORAGE_KEYS.monthlyFoodBudget, monthlyFoodBudget.value)
    localStorage.removeItem(STORAGE_KEYS.loggedOut)
  }

  function updateQuestionnaire(payload: {
    heightCm: number
    weightKg: number
    trainingExperience: TrainingExperience[]
    fitnessGoal: FitnessGoal
    monthlyFoodBudget: number
  }) {
    heightCm.value = payload.heightCm
    weightKg.value = payload.weightKg
    trainingExperience.value = payload.trainingExperience
    fitnessGoal.value = payload.fitnessGoal
    monthlyFoodBudget.value = payload.monthlyFoodBudget

    persistNumber(STORAGE_KEYS.heightCm, heightCm.value)
    persistNumber(STORAGE_KEYS.weightKg, weightKg.value)
    localStorage.setItem(STORAGE_KEYS.trainingExperience, JSON.stringify(trainingExperience.value))
    localStorage.setItem(STORAGE_KEYS.fitnessGoal, fitnessGoal.value)
    persistNumber(STORAGE_KEYS.monthlyFoodBudget, monthlyFoodBudget.value)
  }

  function clearUser() {
    id.value = ''
    name.value = ''
    email.value = ''
    token.value = ''
    refreshToken.value = ''
    sessionId.value = ''
    allergies.value = []
    dietaryPreferences.value = []
    heightCm.value = null
    weightKg.value = null
    trainingExperience.value = []
    fitnessGoal.value = null
    monthlyFoodBudget.value = null

    localStorage.removeItem(STORAGE_KEYS.userId)
    localStorage.removeItem(STORAGE_KEYS.userName)
    localStorage.removeItem(STORAGE_KEYS.userEmail)
    localStorage.removeItem(STORAGE_KEYS.accessToken)
    localStorage.removeItem(STORAGE_KEYS.refreshToken)
    localStorage.removeItem(STORAGE_KEYS.sessionId)
    localStorage.removeItem(STORAGE_KEYS.allergies)
    localStorage.removeItem(STORAGE_KEYS.dietaryPreferences)
    localStorage.removeItem(STORAGE_KEYS.heightCm)
    localStorage.removeItem(STORAGE_KEYS.weightKg)
    localStorage.removeItem(STORAGE_KEYS.trainingExperience)
    localStorage.removeItem(STORAGE_KEYS.fitnessGoal)
    localStorage.removeItem(STORAGE_KEYS.monthlyFoodBudget)
    localStorage.setItem(STORAGE_KEYS.loggedOut, 'true')
  }

  function readArray(storageKey: string) {
    const raw = localStorage.getItem(storageKey)

    if (!raw) {
      return []
    }

    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed.map((item) => String(item)) : []
    } catch {
      return []
    }
  }

  function readTrainingExperience(storageKey: string) {
    const allowedValues: TrainingExperience[] = ['fitness', 'yoga', 'pilates', 'climbing']
    return readArray(storageKey).filter((item): item is TrainingExperience =>
      allowedValues.includes(item as TrainingExperience),
    )
  }

  function readNumber(storageKey: string) {
    const raw = localStorage.getItem(storageKey)
    const value = Number(raw)
    return Number.isFinite(value) && value > 0 ? value : null
  }

  function sanitizeNumber(value: number | null | undefined) {
    return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null
  }

  function persistNumber(storageKey: string, value: number | null) {
    if (value === null) {
      localStorage.removeItem(storageKey)
      return
    }

    localStorage.setItem(storageKey, String(value))
  }

  return {
    id,
    name,
    email,
    token,
    refreshToken,
    sessionId,
    allergies,
    dietaryPreferences,
    heightCm,
    weightKg,
    trainingExperience,
    fitnessGoal,
    monthlyFoodBudget,
    isLoggedIn,
    questionnaireCompleted,
    initials,
    setSession,
    setUser,
    updateQuestionnaire,
    clearUser,
  }
})
