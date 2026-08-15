import type { StringIssue, IPerStringDiagnosis } from '../models/AudioAnalysis.js'

export const CHORD_STRING_NOTES: Record<string, Record<string, string>> = {
  A: { E: 'A', A: 'E', D: 'A', G: 'C#', B: 'E' },
  D: { E: 'D', A: 'A', D: 'D', G: 'F#', B: 'D' },
  E: { E: 'E', A: 'B', D: 'E', G: 'G#', B: 'E' },
  G: { E: 'G', A: 'B', D: 'G', G: 'B', B: 'D' },
  C: { E: 'C', A: 'E', D: 'G', G: 'C', B: 'E' },
}

const NOTE_TO_SEMITONE: Record<string, number> = {
  C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5,
  'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11,
}

const FAILURE_CAUSES: Record<StringIssue, string> = {
  silent: 'String not pressed hard enough or finger placed too far from the fret.',
  buzzing: 'Finger too close to the fret wire — try moving slightly back.',
  wrongPitch: 'Wrong fret or finger placement on this string.',
  muted: 'Adjacent finger likely muting this string — try arching fingers more.',
}

export interface AudioFrame {
  timestamp: number
  frequency: number | null
  rms: number
  onsets: boolean
}

export interface LiveAnalysisState {
  expectedSequence: string[]
  targetBpm: number
  detectedSequence: string[]
  frameBuffer: AudioFrame[]
  lastOnsetMs: number
  onsetTimes: number[]
  currentChordIndex: number
}

export function createAnalysisState(
  expectedSequence: string[],
  targetBpm: number,
): LiveAnalysisState {
  return {
    expectedSequence,
    targetBpm,
    detectedSequence: [],
    frameBuffer: [],
    lastOnsetMs: 0,
    onsetTimes: [],
    currentChordIndex: 0,
  }
}

function frequencyToNote(freq: number): string | null {
  if (freq <= 0) return null
  const semitone = Math.round(12 * Math.log2(freq / 440)) + 69
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  return noteNames[((semitone % 12) + 12) % 12] ?? null
}

function notesMatch(detected: string, expected: string): boolean {
  const d = NOTE_TO_SEMITONE[detected]
  const e = NOTE_TO_SEMITONE[expected]
  if (d === undefined || e === undefined) return false
  return d === e
}

export function diagnoseChord(chord: string, detectedNotes: Map<string, string>): IPerStringDiagnosis[] {
  const expected = CHORD_STRING_NOTES[chord]
  if (!expected) return []

  const diagnoses: IPerStringDiagnosis[] = []

  for (const [stringName, expectedNote] of Object.entries(expected)) {
    const detected = detectedNotes.get(stringName)
    if (!detected) {
      diagnoses.push({
        chord,
        string: stringName,
        issue: 'silent',
        likelyCause: FAILURE_CAUSES.silent,
      })
    } else if (!notesMatch(detected, expectedNote)) {
      diagnoses.push({
        chord,
        string: stringName,
        issue: 'wrongPitch',
        likelyCause: FAILURE_CAUSES.wrongPitch,
      })
    }
  }

  return diagnoses
}

export function processFrame(
  state: LiveAnalysisState,
  frame: AudioFrame,
): {
  state: LiveAnalysisState
  feedback: {
    detectedChord: string | null
    bpmEstimate: number | null
    driftMs: number | null
    diagnosis: IPerStringDiagnosis[]
  }
} {
  const next = { ...state, frameBuffer: [...state.frameBuffer, frame].slice(-50) }

  if (frame.onsets && frame.timestamp - state.lastOnsetMs > 200) {
    next.lastOnsetMs = frame.timestamp
    next.onsetTimes = [...state.onsetTimes, frame.timestamp].slice(-32)
  }

  const recentFrames = next.frameBuffer.filter((f) => f.rms > 0.02 && f.frequency)
  const detectedNotes = new Map<string, string>()

  for (const f of recentFrames) {
    const note = frequencyToNote(f.frequency!)
    if (!note) continue
    const freq = f.frequency!
    if (freq < 120) detectedNotes.set('E', note)
    else if (freq < 180) detectedNotes.set('A', note)
    else if (freq < 260) detectedNotes.set('D', note)
    else if (freq < 360) detectedNotes.set('G', note)
    else detectedNotes.set('B', note)
  }

  const expectedChord = state.expectedSequence[state.currentChordIndex] ?? null
  let detectedChord: string | null = null
  let diagnosis: IPerStringDiagnosis[] = []

  if (expectedChord) {
    diagnosis = diagnoseChord(expectedChord, detectedNotes)
    if (diagnosis.length === 0 && detectedNotes.size >= 2) {
      detectedChord = expectedChord
    }
  }

  let bpmEstimate: number | null = null
  if (next.onsetTimes.length >= 2) {
    const intervals = []
    for (let i = 1; i < next.onsetTimes.length; i++) {
      intervals.push(next.onsetTimes[i]! - next.onsetTimes[i - 1]!)
    }
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
    bpmEstimate = Math.round(60_000 / avgInterval)
  }

  const expectedInterval = 60_000 / state.targetBpm
  const driftMs =
    bpmEstimate && state.targetBpm
      ? Math.round((60_000 / bpmEstimate - expectedInterval))
      : null

  return {
    state: next,
    feedback: { detectedChord, bpmEstimate, driftMs, diagnosis },
  }
}

export function finalizeAnalysis(
  state: LiveAnalysisState,
  sessionId: string,
): {
  sessionId: string
  expectedSequence: string[]
  detectedSequence: string[]
  accuracy: number
  actualBpm: number | null
  targetBpm: number
  timingDrift: number[]
  transitionDurationsMs: number[]
  hesitationPoints: number[]
  perStringDiagnosis: IPerStringDiagnosis[]
} {
  const detected = state.detectedSequence
  const expected = state.expectedSequence
  const matches = expected.filter((chord, i) => detected[i] === chord).length
  const accuracy = expected.length ? matches / expected.length : 0

  const transitionDurationsMs: number[] = []
  const hesitationPoints: number[] = []
  const hesitationThreshold = (60_000 / state.targetBpm) * 1.5

  for (let i = 1; i < state.onsetTimes.length; i++) {
    const gap = state.onsetTimes[i]! - state.onsetTimes[i - 1]!
    transitionDurationsMs.push(gap)
    if (gap > hesitationThreshold) {
      hesitationPoints.push(state.onsetTimes[i]!)
    }
  }

  let actualBpm: number | null = null
  if (transitionDurationsMs.length >= 2) {
    const avg = transitionDurationsMs.reduce((a, b) => a + b, 0) / transitionDurationsMs.length
    actualBpm = Math.round(60_000 / avg)
  }

  const timingDrift = actualBpm
    ? [Math.round((60_000 / actualBpm - 60_000 / state.targetBpm))]
    : []

  return {
    sessionId,
    expectedSequence: expected,
    detectedSequence: detected,
    accuracy,
    actualBpm,
    targetBpm: state.targetBpm,
    timingDrift,
    transitionDurationsMs,
    hesitationPoints,
    perStringDiagnosis: [],
  }
}

export function compareStrumming(
  expected: string[],
  detected: string[],
): { expected: string[]; detected: string[]; matchRate: number } {
  const matches = expected.filter((s, i) => detected[i] === s).length
  return {
    expected,
    detected,
    matchRate: expected.length ? matches / expected.length : 0,
  }
}
