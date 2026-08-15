import { apiFetch } from './client'

export interface AnalyticsOverview {
  transitionsOverTime: { date: string; transitions: number; sessions: number }[]
  mostPracticedChords: {
    chordPair: { from: string; to: string }
    count: number
    totalTransitions: number
  }[]
  bpmProgression: { date: string; avgBpm: number }[]
  avgAccuracy: number | null
}

export function getAnalyticsOverview() {
  return apiFetch<AnalyticsOverview>('/analytics/overview')
}

export function getInsights() {
  return apiFetch<{ insights: string }>('/insights')
}
