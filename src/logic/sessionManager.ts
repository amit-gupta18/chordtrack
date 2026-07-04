import {
  COUNTDOWN_SECONDS,
  SESSION_DURATION_MS,
  type ChordId,
  type ChordTemplates,
  type SessionPhase,
  type SessionStats,
} from '../types/hand'
import { averageSwitchTimeMs } from './switchDetector'

export interface SessionState {
  phase: SessionPhase
  templates: ChordTemplates
  calibrationTarget: ChordId | null
  calibrationBuffer: number[][]
  countdownValue: number
  sessionStartMs: number | null
  sessionEndMs: number | null
  switchCount: number
  switchTimestamps: number[]
  stableChord: import('../types/hand').DetectedChord
}

export function createSessionState(): SessionState {
  return {
    phase: 'idle',
    templates: {},
    calibrationTarget: null,
    calibrationBuffer: [],
    countdownValue: COUNTDOWN_SECONDS,
    sessionStartMs: null,
    sessionEndMs: null,
    switchCount: 0,
    switchTimestamps: [],
    stableChord: 'Unknown',
  }
}

export function isCalibrated(templates: ChordTemplates): boolean {
  return Boolean(templates.A && templates.D)
}

export function startCalibration(
  state: SessionState,
  chord: ChordId,
): SessionState {
  return {
    ...state,
    phase: 'calibrating',
    calibrationTarget: chord,
    calibrationBuffer: [],
  }
}

export function addCalibrationFrame(
  state: SessionState,
  features: number[],
): SessionState {
  if (state.phase !== 'calibrating' || !state.calibrationTarget) {
    return state
  }

  return {
    ...state,
    calibrationBuffer: [...state.calibrationBuffer, features],
  }
}

export function finalizeCalibration(state: SessionState): SessionState {
  if (!state.calibrationTarget || state.calibrationBuffer.length === 0) {
    return state
  }

  const length = state.calibrationBuffer[0].length
  const sum = new Array<number>(length).fill(0)
  for (const vector of state.calibrationBuffer) {
    for (let i = 0; i < length; i++) {
      sum[i] += vector[i]
    }
  }
  const averaged = sum.map((v) => v / state.calibrationBuffer.length)

  const templates: ChordTemplates = {
    ...state.templates,
    [state.calibrationTarget]: averaged,
  }

  return {
    ...state,
    phase: isCalibrated(templates) ? 'ready' : 'idle',
    templates,
    calibrationTarget: null,
    calibrationBuffer: [],
  }
}

export function beginCountdown(state: SessionState): SessionState {
  if (!isCalibrated(state.templates)) return state

  return {
    ...state,
    phase: 'countdown',
    countdownValue: COUNTDOWN_SECONDS,
    switchCount: 0,
    switchTimestamps: [],
    stableChord: 'Unknown',
    sessionStartMs: null,
    sessionEndMs: null,
  }
}

export function tickCountdown(state: SessionState): SessionState {
  if (state.phase !== 'countdown') return state

  const next = state.countdownValue - 1
  if (next <= 0) {
    const now = performance.now()
    return {
      ...state,
      phase: 'running',
      countdownValue: 0,
      sessionStartMs: now,
      sessionEndMs: now + SESSION_DURATION_MS,
    }
  }

  return {
    ...state,
    countdownValue: next,
  }
}

export function updateRunningSession(
  state: SessionState,
  switchCount: number,
  switchTimestamps: number[],
  stableChord: import('../types/hand').DetectedChord,
): SessionState {
  if (state.phase !== 'running' || state.sessionEndMs === null) {
    return state
  }

  const now = performance.now()
  if (now >= state.sessionEndMs) {
    return {
      ...state,
      phase: 'finished',
      switchCount,
      switchTimestamps,
      stableChord,
    }
  }

  return {
    ...state,
    switchCount,
    switchTimestamps,
    stableChord,
  }
}

export function resetSession(state: SessionState, clearTemplates = false): SessionState {
  return {
    ...createSessionState(),
    templates: clearTemplates ? {} : state.templates,
  }
}

export function buildSessionStats(
  state: SessionState,
  now = performance.now(),
): SessionStats {
  const elapsedMs =
    state.sessionStartMs === null
      ? 0
      : Math.min(
          state.phase === 'finished' && state.sessionEndMs
            ? SESSION_DURATION_MS
            : now - state.sessionStartMs,
          SESSION_DURATION_MS,
        )

  const remainingMs = Math.max(0, SESSION_DURATION_MS - elapsedMs)
  const elapsedMinutes = elapsedMs / 60_000
  const avgSwitchTimeMs = averageSwitchTimeMs(state.switchTimestamps)
  const switchesPerMinute =
    elapsedMinutes > 0 ? state.switchCount / elapsedMinutes : 0

  return {
    switchCount: state.switchCount,
    switchTimestamps: state.switchTimestamps,
    stableChord: state.stableChord,
    elapsedMs,
    remainingMs,
    avgSwitchTimeMs,
    switchesPerMinute,
  }
}
