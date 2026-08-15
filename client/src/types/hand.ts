export interface Landmark {
  x: number
  y: number
  z: number
}

export type FeatureVector = number[]

export type ChordId = 'A' | 'D'

export type DetectedChord = ChordId | 'Unknown'

export type SessionPhase =
  | 'idle'
  | 'calibrating'
  | 'ready'
  | 'countdown'
  | 'running'
  | 'finished'

export interface ChordTemplates {
  A?: FeatureVector
  D?: FeatureVector
}

export interface RecognitionResult {
  chord: DetectedChord
  confidence: number
  scoreA: number
  scoreD: number
}

export interface SwitchStats {
  switchCount: number
  switchTimestamps: number[]
  stableChord: DetectedChord
}

export interface SessionStats {
  switchCount: number
  switchTimestamps: number[]
  stableChord: DetectedChord
  elapsedMs: number
  remainingMs: number
  avgSwitchTimeMs: number | null
  switchesPerMinute: number
}

export type CameraStatus = 'loading' | 'active' | 'denied' | 'error'

export const CHORD_LABELS: Record<ChordId, string> = {
  A: 'A Major',
  D: 'D Major',
}

export const SESSION_DURATION_MS = 60_000
export const COUNTDOWN_SECONDS = 3
export const CALIBRATION_FRAMES = 15
export const MIN_SCORE = 0.75
export const MIN_MARGIN = 0.05
export const STABLE_FRAMES = 5
