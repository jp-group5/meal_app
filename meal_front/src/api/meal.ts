import request from './request'
import type { ApiResponse, Meal } from '@/types'
import type { WeeklyNutritionResponse } from '../types/nutrients'

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

export function getWeeklyNutrition(startDate: string, endDate: string) {
  return request.get<unknown, ApiResponse<WeeklyNutritionResponse>>('/meals/nutrition', {
    params: { startDate, endDate },
  })
}
