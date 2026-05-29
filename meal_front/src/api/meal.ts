import request from './request'
import type { ApiResponse, Meal, MealType } from '@/types'
import type { WeeklyNutritionResponse } from '../types/nutrients'

interface MealImageAnalysis {
  contents: string[]
  total_nutrition: {
    calories: number
    protein: number
    fat: number
    carbs: number
  }
  error?: unknown
}

export interface AnalyzeMealImageResponse {
  analysis: MealImageAnalysis
  meal: Meal
}

export function getMealsByDate(date: string) {
  return request.get<unknown, ApiResponse<Meal[]>>('/meals', {
    params: { date },
  })
}

export function createMeal(payload: Omit<Meal, 'id'>) {
  return request.post<unknown, ApiResponse<Meal>>('/meals', payload)
}

export function updateMeal(id: string, payload: Partial<Omit<Meal, 'id'>>) {
  return request.put<unknown, ApiResponse<Meal>>(`/meals/${id}`, payload)
}

export function deleteMeal(id: string) {
  return request.delete<unknown, ApiResponse<null>>(`/meals/${id}`)
}

export function analyzeMealImage(payload: { image: File; date: string; type: MealType }) {
  const formData = new FormData()
  formData.append('image', payload.image)
  formData.append('date', payload.date)
  formData.append('type', payload.type)

  return request.post<unknown, ApiResponse<AnalyzeMealImageResponse>>('/meals/analyze-image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

export function getWeeklyNutrition(startDate: string, endDate: string) {
  return request.get<unknown, ApiResponse<WeeklyNutritionResponse>>('/meals/nutrition', {
    params: { startDate, endDate },
  })
}
