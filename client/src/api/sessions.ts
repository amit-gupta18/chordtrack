import { apiFetch } from './client'

export interface SelfReport {
  notesRangClearly?: boolean
  fingersRelaxed?: boolean
  usedAnchorFinger?: boolean
  rhythmSteady?: boolean
}

export interface Session {
  _id: string
  type: string
  chordPair?: { from: string; to: string }
  bpm?: number
  durationSeconds: number
  transitionsCompleted: number
  selfReport?: SelfReport
  createdAt: string
}

export interface CreateSessionPayload {
  type: 'chordTransition' | 'strumming' | 'song' | 'freePractice'
  chordPair?: { from: string; to: string }
  bpm?: number
  durationSeconds: number
  transitionsCompleted: number
  selfReport?: SelfReport
}

export function createSession(payload: CreateSessionPayload) {
  return apiFetch<{ session: Session }>('/sessions', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function listSessions(params?: { from?: string; to?: string; chordPair?: string }) {
  const search = new URLSearchParams()
  if (params?.from) search.set('from', params.from)
  if (params?.to) search.set('to', params.to)
  if (params?.chordPair) search.set('chordPair', params.chordPair)
  const qs = search.toString()
  return apiFetch<{ sessions: Session[] }>(`/sessions${qs ? `?${qs}` : ''}`)
}

export function getSession(id: string) {
  return apiFetch<{ session: Session }>(`/sessions/${id}`)
}
