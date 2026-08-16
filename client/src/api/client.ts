import { getToken } from '../lib/token'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api'

export class ApiError extends Error {
  status: number
  details?: unknown

  constructor(message: string, status: number, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken()
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new ApiError(
      (data as { error?: string }).error ?? 'Request failed',
      res.status,
      data,
    )
  }

  return data as T
}
