import request from './request'
import type { Activity, ApiResponse } from '@/types'

export function getActivitiesByDate(date: string) {
  return request.get<unknown, ApiResponse<Activity[]>>('/activities', {
    params: { date },
  })
}

export function createActivity(payload: Omit<Activity, 'id'>) {
  return request.post<unknown, ApiResponse<Activity>>('/activities', payload)
}

export function updateActivity(id: string, payload: Partial<Omit<Activity, 'id'>>) {
  return request.put<unknown, ApiResponse<Activity>>(`/activities/${id}`, payload)
}

export function deleteActivity(id: string) {
  return request.delete<unknown, ApiResponse<null>>(`/activities/${id}`)
}
