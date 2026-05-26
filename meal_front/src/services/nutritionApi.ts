import { mockWeeklyNutrition } from '../mocks/nutrients'
import type { WeeklyNutritionResponse } from '../types/nutrients'

export async function fetchWeeklyNutrition(startDate: string, endDate: string): Promise<WeeklyNutritionResponse> {
  console.info(`Mock fetch weekly nutrition from ${startDate} to ${endDate}`)

  await wait(500)
  return mockWeeklyNutrition
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}
