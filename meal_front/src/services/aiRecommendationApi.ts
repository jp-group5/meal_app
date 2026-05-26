import { createMeal } from '@/api/meal'
import { getRecommendation } from '@/api/recommendation'
import type { MealType } from '@/types'
import type { AIRecommendation, CreateMealPayload } from '../types/aiRecommendation'

interface BackendSuggestedMeal {
  type?: string
  content?: string
}

interface BackendChoice {
  title?: string
  reason?: string
  suggestedMeals?: BackendSuggestedMeal[]
}

interface BackendRecommendationPayload {
  title?: string
  reason?: string
  suggestedMeals?: BackendSuggestedMeal[]
  choices?: BackendChoice[]
}

export async function fetchAIRecommendations(date: string): Promise<AIRecommendation[]> {
  const response = await getRecommendation(date)
  const payload = response.data as BackendRecommendationPayload | undefined

  if (!payload) {
    return []
  }

  const sourceChoices =
    Array.isArray(payload.choices) && payload.choices.length > 0
      ? payload.choices
      : [{ title: payload.title, reason: payload.reason, suggestedMeals: payload.suggestedMeals }]

  return sourceChoices
    .map((choice, index) => mapChoiceToRecommendation(choice, date, index))
    .filter((item): item is AIRecommendation => item !== null)
}

export async function acceptRecommendationAsMeal(payload: CreateMealPayload): Promise<void> {
  await createMeal({
    date: payload.date,
    type: payload.mealType,
    content: payload.content,
    calories: payload.calories,
    protein: payload.protein,
    carbs: payload.carbs,
    fat: payload.fat,
  })
}

function mapChoiceToRecommendation(choice: BackendChoice, date: string, index: number): AIRecommendation | null {
  const name = `${choice.title ?? ''}`.trim()
  if (!name) {
    return null
  }

  const meals = normalizeSuggestedMeals(choice.suggestedMeals)
  const tags = Array.from(new Set(meals.map((meal) => meal.type))).map((item) => item.toUpperCase())

  return {
    id: `rec-${date}-${index + 1}`,
    name,
    reason: `${choice.reason ?? ''}`.trim(),
    tags,
    suggestedMeals: meals,
  }
}

function normalizeSuggestedMeals(meals: BackendSuggestedMeal[] | undefined) {
  if (!Array.isArray(meals)) {
    return []
  }

  const allowedTypes: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack']

  return meals
    .map((item) => {
      const typeRaw = `${item.type ?? ''}`.trim().toLowerCase()
      const content = `${item.content ?? ''}`.trim()
      const type = allowedTypes.includes(typeRaw as MealType) ? (typeRaw as MealType) : 'dinner'

      if (!content) {
        return null
      }

      return { type, content }
    })
    .filter((item): item is { type: MealType; content: string } => item !== null)
}
