import { create } from 'zustand'
import {
  clampSessionDuration,
  DEFAULT_SESSION_DURATION_SECONDS,
} from '../lib/chordDetection'

const STORAGE_KEY = 'chordtrack-session-duration'

export const SESSION_DURATION_PRESETS = [60, 120, 180, 300] as const

function loadDuration(): number {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return DEFAULT_SESSION_DURATION_SECONDS
    return clampSessionDuration(Number(stored))
  } catch {
    return DEFAULT_SESSION_DURATION_SECONDS
  }
}

interface PracticeSettingsStore {
  durationSeconds: number
  setDurationSeconds: (seconds: number) => void
}

export const usePracticeSettingsStore = create<PracticeSettingsStore>((set) => ({
  durationSeconds: loadDuration(),
  setDurationSeconds: (seconds) => {
    const clamped = clampSessionDuration(seconds)
    try {
      localStorage.setItem(STORAGE_KEY, String(clamped))
    } catch {
      // ignore storage errors
    }
    set({ durationSeconds: clamped })
  },
}))
