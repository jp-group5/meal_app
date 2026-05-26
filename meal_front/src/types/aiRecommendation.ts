import type { MealType } from '@/types'

export interface AISuggestedMeal {
  type: MealType
  content: string
}

export interface AIRecommendation {
  id: string
  name: string
  reason: string
  tags?: string[]
  calories?: number
  protein?: number
  carbs?: number
  fat?: number
  confidence?: number
  suggestedMeals: AISuggestedMeal[]
}

export interface CreateMealPayload {
  content: string
  mealType: MealType
  date: string
  calories?: number
  protein?: number
  carbs?: number
  fat?: number
  source?: 'ai-recommendation' | 'manual'
  recommendationId?: string
}
