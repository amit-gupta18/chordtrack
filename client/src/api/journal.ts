import { apiFetch } from './client'

export interface JournalEntry {
  _id: string
  date: string
  exercises: { name: string; durationMinutes: number }[]
  notes: string
  streakDay?: number
  createdAt: string
}

export function createJournalEntry(data: {
  date: string
  exercises: { name: string; durationMinutes: number }[]
  notes: string
}) {
  return apiFetch<{ entry: JournalEntry }>('/journal', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function listJournalEntries() {
  return apiFetch<{ entries: JournalEntry[] }>('/journal')
}

export function getStreak() {
  return apiFetch<{ streak: number }>('/journal/streak')
}
