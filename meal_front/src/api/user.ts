import request from './request'
import type { ApiResponse, FitnessGoal, TrainingExperience, User } from '@/types'

export interface UserProfilePayload {
  height_cm: number
  weight_kg: number
  training_experience: TrainingExperience[]
  fitness_goal: FitnessGoal
  monthly_food_budget: number
}

interface UserProfilePayloadCamel {
  heightCm: number
  weightKg: number
  trainingExperience: TrainingExperience[]
  fitnessGoal: FitnessGoal
  monthlyFoodBudget: number
}

interface LegacyProfilePayload {
  height_cm: number
  weight_kg: number
  exercise_experience: string
  fitness_goal: string
  monthly_diet_budget: number
}

export interface UserProfileResponse {
  id: string | number
  username?: string
  name?: string
  email?: string | null
  allergies?: string[]
  dietary_preferences?: string[]
  dietaryPreferences?: string[]
  height_cm?: number | null
  heightCm?: number | null
  weight_kg?: number | null
  weightKg?: number | null
  training_experience?: TrainingExperience[]
  trainingExperience?: TrainingExperience[]
  fitness_goal?: FitnessGoal | null
  fitnessGoal?: FitnessGoal | null
  monthly_food_budget?: number | null
  monthlyFoodBudget?: number | null
  profile?: {
    height_cm?: number | null
    weight_kg?: number | null
    exercise_experience?: string
    training_experience?: TrainingExperience[]
    fitness_goal?: FitnessGoal | string | null
    monthly_diet_budget?: number | null
    monthly_food_budget?: number | null
  }
}

export function toUserModel(data: UserProfileResponse, fallback?: { name?: string; email?: string }): User {
  const merged = mergeProfileFields(data)

  return {
    id: String(data.id ?? ''),
    name: data.username ?? data.name ?? fallback?.name ?? '',
    email: data.email ?? fallback?.email,
    allergies: data.allergies ?? [],
    dietaryPreferences: merged.dietaryPreferences,
    heightCm: merged.heightCm,
    weightKg: merged.weightKg,
    trainingExperience: merged.trainingExperience,
    fitnessGoal: merged.fitnessGoal,
    monthlyFoodBudget: merged.monthlyFoodBudget,
  }
}

export function getCurrentUser() {
  return request.get<unknown, ApiResponse<UserProfileResponse>>('/private/me')
}

export function updateUserPreferences(payload: Pick<User, 'allergies' | 'dietaryPreferences'>) {
  return request.put<unknown, ApiResponse<User>>('/users/me/preferences', payload)
}

export function updateUserProfile(payload: UserProfilePayload) {
  return updateUserProfileWithFallback(payload)
}

function sanitizeNumber(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null
}

function mergeProfileFields(data: UserProfileResponse) {
  const profile = data.profile ?? {}

  return {
    dietaryPreferences: data.dietary_preferences ?? data.dietaryPreferences ?? [],
    heightCm: sanitizeNumber(data.height_cm ?? data.heightCm ?? profile.height_cm),
    weightKg: sanitizeNumber(data.weight_kg ?? data.weightKg ?? profile.weight_kg),
    trainingExperience:
      data.training_experience ??
      data.trainingExperience ??
      parseExerciseExperience(profile.exercise_experience) ??
      profile.training_experience ??
      [],
    fitnessGoal:
      normalizeGoal(data.fitness_goal) ??
      normalizeGoal(data.fitnessGoal) ??
      normalizeGoal(profile.fitness_goal) ??
      null,
    monthlyFoodBudget: sanitizeNumber(
      data.monthly_food_budget ??
        data.monthlyFoodBudget ??
        profile.monthly_food_budget ??
        profile.monthly_diet_budget,
    ),
  }
}

async function updateUserProfileWithFallback(payload: UserProfilePayload) {
  const camelPayload = toCamelPayload(payload)
  const legacyPayload = toLegacyPayload(payload)
  const attempts: Array<() => Promise<ApiResponse<UserProfileResponse>>> = [
    () => request.put<unknown, ApiResponse<UserProfileResponse>>('/users/me/profile', payload),
    () => request.put<unknown, ApiResponse<UserProfileResponse>>('/users/me/profile', camelPayload),
    () => request.put<unknown, ApiResponse<UserProfileResponse>>('/users/me/profile', legacyPayload),
    () => request.put<unknown, ApiResponse<UserProfileResponse>>('/users/me', payload),
    () => request.put<unknown, ApiResponse<UserProfileResponse>>('/users/me', camelPayload),
    () => request.put<unknown, ApiResponse<UserProfileResponse>>('/private/me/profile', payload),
    () => request.put<unknown, ApiResponse<UserProfileResponse>>('/private/me/profile', camelPayload),
    () => request.put<unknown, ApiResponse<UserProfileResponse>>('/private/me/profile', legacyPayload),
    () => request.put<unknown, ApiResponse<UserProfileResponse>>('/private/me', payload),
    () => request.put<unknown, ApiResponse<UserProfileResponse>>('/private/me', legacyPayload),
    () => request.post<unknown, ApiResponse<UserProfileResponse>>('/users/me/profile', payload),
    () => request.post<unknown, ApiResponse<UserProfileResponse>>('/users/me/profile', legacyPayload),
    () => request.post<unknown, ApiResponse<UserProfileResponse>>('/private/me/profile', payload),
    () => request.post<unknown, ApiResponse<UserProfileResponse>>('/private/me/profile', legacyPayload),
  ]

  let latestError: unknown = new Error('Failed to update user profile')

  for (const attempt of attempts) {
    try {
      return await attempt()
    } catch (error) {
      latestError = error
    }
  }

  throw latestError
}

function toCamelPayload(payload: UserProfilePayload): UserProfilePayloadCamel {
  return {
    heightCm: payload.height_cm,
    weightKg: payload.weight_kg,
    trainingExperience: payload.training_experience,
    fitnessGoal: payload.fitness_goal,
    monthlyFoodBudget: payload.monthly_food_budget,
  }
}

function toLegacyPayload(payload: UserProfilePayload): LegacyProfilePayload {
  return {
    height_cm: payload.height_cm,
    weight_kg: payload.weight_kg,
    exercise_experience: toExerciseText(payload.training_experience),
    fitness_goal: toGoalText(payload.fitness_goal),
    monthly_diet_budget: payload.monthly_food_budget,
  }
}

function parseExerciseExperience(value: string | undefined) {
  if (!value) {
    return undefined
  }

  const dictionary: Record<string, TrainingExperience> = {
    fitness: 'fitness',
    yoga: 'yoga',
    pilates: 'pilates',
    climbing: 'climbing',
  }

  const items = value
    .split(/[,\s，、]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => dictionary[item.toLowerCase()] ?? dictionary[item])
    .filter((item): item is TrainingExperience => Boolean(item))

  return items
}

function normalizeGoal(value: unknown): FitnessGoal | null {
  if (value === 'lose_weight' || value === 'build_muscle' || value === 'maintain_shape') {
    return value
  }

  if (value === 'lose weight') {
    return 'lose_weight'
  }

  if (value === 'build muscle') {
    return 'build_muscle'
  }

  if (value === 'maintain shape') {
    return 'maintain_shape'
  }

  return null
}

function toGoalText(value: FitnessGoal) {
  if (value === 'lose_weight') {
    return 'Lose weight'
  }

  if (value === 'build_muscle') {
    return 'Build muscle'
  }

  return 'Maintain shape'
}

function toExerciseText(items: TrainingExperience[]) {
  const map: Record<TrainingExperience, string> = {
    fitness: 'Fitness',
    yoga: 'Yoga',
    pilates: 'Pilates',
    climbing: 'Climbing',
  }

  return items.map((item) => map[item] ?? item).join(',')
}
