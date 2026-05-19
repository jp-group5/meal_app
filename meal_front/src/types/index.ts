export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data?: T
}

export type TrainingExperience = 'fitness' | 'yoga' | 'pilates' | 'climbing'
export type FitnessGoal = 'lose_weight' | 'build_muscle' | 'maintain_shape'

export interface User {
  id: string
  name: string
  email?: string
  token?: string
  refreshToken?: string
  sessionId?: string
  allergies: string[]
  dietaryPreferences: string[]
  heightCm?: number | null
  weightKg?: number | null
  trainingExperience: TrainingExperience[]
  fitnessGoal?: FitnessGoal | null
  monthlyFoodBudget?: number | null
}

export interface Activity {
  id: string
  title: string
  date: string
  startTime: string
  endTime: string
  intensity?: 'low' | 'medium' | 'high'
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export interface Meal {
  id: string
  date: string
  type: MealType
  content: string
  calories?: number
}

export interface MealRecommendation {
  date: string
  title: string
  reason: string
  suggestedMeals: Array<{
    type: MealType
    content: string
  }>
}
