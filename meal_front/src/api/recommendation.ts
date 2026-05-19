import request from './request'
import type { ApiResponse, MealRecommendation } from '@/types'

export function getRecommendation(date: string) {
  return request.post<unknown, ApiResponse<MealRecommendation>>('/recommendations', { date })
}
