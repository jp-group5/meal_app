import request from './request'
import type { ApiResponse, MealRecommendation, MealType } from '@/types'

export type RecommendationLanguage = 'en' | 'ja'

export function getRecommendation(date: string, mealType: MealType, language: RecommendationLanguage) {
  return request.post<unknown, ApiResponse<MealRecommendation>>('/recommendations', {
    date,
    meal_type: mealType,
    language,
  })
}
