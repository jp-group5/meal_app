import { mockAIRecommendations } from '../mocks/aiRecommendations'
import type { AIRecommendation, CreateMealPayload } from '../types/aiRecommendation'

export async function fetchAIRecommendations(date: string): Promise<AIRecommendation[]> {
  console.info('Mock fetch AI recommendations for date:', date)

  await wait(900)
  return mockAIRecommendations
}

export async function acceptRecommendationAsMeal(payload: CreateMealPayload): Promise<void> {
  console.info('Mock accept recommendation as meal:', payload)

  await wait(500)
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

