export interface AIRecommendation {
  id: string
  name: string
  reason: string
  tags: string[]
  calories: number
  protein: number
  carbs: number
  fat: number
  confidence: number
}

export interface CreateMealPayload {
  name: string
  mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack'
  date: string
  calories: number
  protein: number
  carbs: number
  fat: number
  source: 'ai-recommendation' | 'manual'
  recommendationId?: string
}

