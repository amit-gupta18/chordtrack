import { apiFetch } from './client'

export interface User {
  id: string
  name: string
  email: string
  createdAt?: string
}

export interface AuthResponse {
  user: User
  token: string
}

export function register(data: { name: string; email: string; password: string }) {
  return apiFetch<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function login(data: { email: string; password: string }) {
  return apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function logout() {
  return apiFetch<{ ok: boolean }>('/auth/logout', { method: 'POST' })
}

export function getMe() {
  return apiFetch<{ user: User }>('/auth/me')
}
