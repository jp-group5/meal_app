import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'

import { useUserStore } from '@/stores/user'
import type { ApiResponse } from '@/types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'

type RetryableRequestConfig = InternalAxiosRequestConfig & { _retried?: boolean }

const request = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10_000,
  headers: {
    'Content-Type': 'application/json',
  },
})

let refreshPromise: Promise<string> | null = null

request.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const userStore = useUserStore()

  if (userStore.token) {
    config.headers.Authorization = `Bearer ${userStore.token}`
  }

  return config
})

request.interceptors.response.use(
  async (response) => {
    const payload = response.data as ApiResponse<unknown> | undefined

    if (!payload || typeof payload.code !== 'number') {
      return response.data
    }

    if (payload.code === 0) {
      return payload
    }

    if (payload.code === 10005) {
      return retryWithRefreshedToken(response.config as RetryableRequestConfig, payload.message)
    }

    return Promise.reject(createBusinessError(payload.code, payload.message))
  },
  (error: AxiosError<{ message?: string }>) => {
    const message = error.response?.data?.message ?? error.message ?? 'Request failed'

    console.error('[API Error]', message)
    return Promise.reject(createBusinessError(-1, message))
  },
)

async function retryWithRefreshedToken(config: RetryableRequestConfig, message: string) {
  const userStore = useUserStore()
  const requestURL = `${config.url ?? ''}`

  if (
    config._retried ||
    requestURL.includes('/refresh') ||
    requestURL.includes('/login') ||
    requestURL.includes('/register') ||
    !userStore.refreshToken
  ) {
    userStore.clearUser()
    return Promise.reject(createBusinessError(10005, message || 'Authentication failed'))
  }

  config._retried = true

  try {
    const accessToken = await refreshAccessToken()
    config.headers.Authorization = `Bearer ${accessToken}`
    return request(config)
  } catch (error) {
    userStore.clearUser()
    return Promise.reject(error)
  }
}

async function refreshAccessToken() {
  const userStore = useUserStore()

  if (!refreshPromise) {
    refreshPromise = axios
      .post<ApiResponse<{ access_token: string; token?: string }>>(
        `${API_BASE_URL}/refresh`,
        {
          refresh_token: userStore.refreshToken,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )
      .then((response) => {
        const payload = response.data

        if (payload.code !== 0 || !payload.data?.access_token) {
          throw createBusinessError(payload.code, payload.message || 'Failed to refresh token')
        }

        userStore.setSession({
          accessToken: payload.data.access_token,
          refreshToken: userStore.refreshToken,
          sessionId: userStore.sessionId,
        })

        return payload.data.access_token
      })
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

function createBusinessError(code: number, message: string) {
  const error = new Error(message || 'Request failed') as Error & { bizCode?: number }
  error.bizCode = code
  return error
}

export default request
