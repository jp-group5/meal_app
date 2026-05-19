import request from './request'
import type { ApiResponse } from '@/types'

export interface AuthUser {
  id: string | number
  username: string
  email?: string | null
}

export interface RegisterPayload {
  username: string
  password: string
  email?: string
}

export interface LoginPayload {
  username: string
  password: string
}

export interface LoginData {
  access_token: string
  refresh_token: string
  token: string
  session_id: string
  user: AuthUser
}

export interface RefreshTokenData {
  access_token: string
  token: string
}

export interface RegisterData {
  user_id: string | number
  username: string
}

export function register(payload: RegisterPayload) {
  return request.post<unknown, ApiResponse<RegisterData>>('/register', payload)
}

export function login(payload: LoginPayload) {
  return request.post<unknown, ApiResponse<LoginData>>('/login', payload)
}

export function refresh(payload: { refresh_token: string }) {
  return request.post<unknown, ApiResponse<RefreshTokenData>>('/refresh', payload)
}

export function getPrivateMe() {
  return request.get<unknown, ApiResponse<AuthUser>>('/private/me')
}

export function logout() {
  return request.post<unknown, ApiResponse<null>>('/private/logout')
}
