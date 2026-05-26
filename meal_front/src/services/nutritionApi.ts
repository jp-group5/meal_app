import { getWeeklyNutrition } from '@/api/meal'
import type { WeeklyNutritionResponse } from '@/types/nutrients'

export async function fetchWeeklyNutrition(startDate: string, endDate: string): Promise<WeeklyNutritionResponse> {
  const response = await getWeeklyNutrition(startDate, endDate)

  if (!response.data) {
    throw new Error('Weekly nutrition data is unavailable.')
  }

  return response.data
}
