import { apiFetch } from './client'

export interface User {
  id: string
  name: string
  email: string
  createdAt?: string
}

export function register(data: { name: string; email: string; password: string }) {
  return apiFetch<{ user: User }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function login(data: { email: string; password: string }) {
  return apiFetch<{ user: User }>('/auth/login', {
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
