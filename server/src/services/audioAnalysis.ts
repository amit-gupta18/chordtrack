import type { StringIssue, IPerStringDiagnosis } from '../models/AudioAnalysis.js'

export const CHORD_STRING_NOTES: Record<string, Record<string, string>> = {
  A: { E: 'A', A: 'E', D: 'A', G: 'C#', B: 'E' },
  Am: { E: 'A', A: 'E', D: 'A', G: 'C', B: 'E' },
  D: { E: 'D', A: 'A', D: 'D', G: 'F#', B: 'D' },
  Dm: { E: 'D', A: 'A', D: 'D', G: 'F', B: 'D' },
  E: { E: 'E', A: 'B', D: 'E', G: 'G#', B: 'E' },
  Em: { E: 'E', A: 'B', D: 'E', G: 'G', B: 'E' },
  G: { E: 'G', A: 'B', D: 'G', G: 'B', B: 'D' },
  C: { E: 'C', A: 'E', D: 'G', G: 'C', B: 'E' },
  F: { E: 'F', A: 'C', D: 'F', G: 'A', B: 'C' },
}

const NOTE_TO_SEMITONE: Record<string, number> = {
  C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5,
  'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11,
}

const CHORD_CHROMA_TEMPLATES: Record<string, number[]> = {
  A: [0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0],
  Am: [1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0],
  D: [0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0],
  Dm: [0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0],
  E: [0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1],
  Em: [0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1],
  G: [0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1],
  C: [1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0],
  F: [1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0],
}

const FAILURE_CAUSES: Record<StringIssue, string> = {
  silent: 'String not pressed hard enough or finger placed too far from the fret.',
  buzzing: 'Finger too close to the fret wire — try moving slightly back.',
  wrongPitch: 'Wrong fret or finger placement on this string.',
  muted: 'Adjacent finger likely muting this string — try arching fingers more.',
}

export interface AudioFrame {
  timestamp: number
  rms: number
  onsets: boolean
  chroma?: number[]
  detectedChord?: string | null
  confidence?: number
}

export interface LiveAnalysisState {
  targetBpm: number
  detectedSequence: string[]
  lastOnsetMs: number
  onsetTimes: number[]
  lastDetectedChord: string | null
  stableChordFrames: number
  startedAtMs: number
  lastChroma: number[]
}

export function createAnalysisState(targetBpm = 80): LiveAnalysisState {
  return {
    targetBpm,
    detectedSequence: [],
    lastOnsetMs: 0,
    onsetTimes: [],
    lastDetectedChord: null,
    stableChordFrames: 0,
    startedAtMs: Date.now(),
    lastChroma: new Array(12).fill(0),
  }
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0
  let magA = 0
  let magB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!
    magA += a[i]! * a[i]!
    magB += b[i]! * b[i]!
  }
  if (magA === 0 || magB === 0) return 0
  return dot / (Math.sqrt(magA) * Math.sqrt(magB))
}

export function identifyChordFromChroma(chroma: number[], rms: number): string | null {
  if (rms < 0.012) return null
  let best: string | null = null
  let bestScore = 0
  for (const [name, template] of Object.entries(CHORD_CHROMA_TEMPLATES)) {
    const score = cosineSimilarity(chroma, template)
    if (score > bestScore) {
      bestScore = score
      best = name
    }
  }
  return bestScore >= 0.62 ? best : null
}

function notesMatch(detected: string, expected: string): boolean {
  const d = NOTE_TO_SEMITONE[detected]
  const e = NOTE_TO_SEMITONE[expected]
  if (d === undefined || e === undefined) return false
  return d === e
}

export function diagnoseChord(chord: string, chroma: number[]): IPerStringDiagnosis[] {
  const expected = CHORD_STRING_NOTES[chord]
  if (!expected) return []

  const diagnoses: IPerStringDiagnosis[] = []
  const pitchClasses = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

  for (const [stringName, expectedNote] of Object.entries(expected)) {
    const expectedPc = NOTE_TO_SEMITONE[expectedNote]
    if (expectedPc === undefined) continue
    const energy = chroma[expectedPc] ?? 0
    if (energy < 0.15) {
      diagnoses.push({
        chord,
        string: stringName,
        issue: 'silent',
        likelyCause: FAILURE_CAUSES.silent,
      })
      continue
    }

    let loudestPc = 0
    let loudestEnergy = 0
    for (let i = 0; i < 12; i++) {
      if (chroma[i]! > loudestEnergy) {
        loudestEnergy = chroma[i]!
        loudestPc = i
      }
    }
    const loudestNote = pitchClasses[loudestPc]!
    if (loudestEnergy > energy * 1.5 && !notesMatch(loudestNote, expectedNote)) {
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

const STABLE_FRAMES = 3

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
    chordSequence: string[]
    confidence: number
  }
} {
  const next: LiveAnalysisState = { ...state }
  if (frame.chroma) next.lastChroma = frame.chroma

  if (frame.onsets && frame.timestamp - state.lastOnsetMs > 200) {
    next.lastOnsetMs = frame.timestamp
    next.onsetTimes = [...state.onsetTimes, frame.timestamp].slice(-32)
  }

  const rawChord =
    frame.detectedChord ??
    (frame.chroma ? identifyChordFromChroma(frame.chroma, frame.rms) : null)

  if (rawChord === state.lastDetectedChord) {
    next.stableChordFrames = state.stableChordFrames + 1
  } else {
    next.stableChordFrames = rawChord ? 1 : 0
    next.lastDetectedChord = rawChord
  }

  let detectedSequence = [...state.detectedSequence]
  if (
    rawChord &&
    next.stableChordFrames === STABLE_FRAMES &&
    detectedSequence[detectedSequence.length - 1] !== rawChord
  ) {
    detectedSequence = [...detectedSequence, rawChord]
    next.detectedSequence = detectedSequence
  }

  const detectedChord =
    next.stableChordFrames >= 3 ? rawChord : state.lastDetectedChord
  const diagnosis = detectedChord ? diagnoseChord(detectedChord, next.lastChroma) : []

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
      ? Math.round(60_000 / bpmEstimate - expectedInterval)
      : null

  return {
    state: next,
    feedback: {
      detectedChord,
      bpmEstimate,
      driftMs,
      diagnosis,
      chordSequence: detectedSequence,
      confidence: frame.confidence ?? 0,
    },
  }
}

export interface ClientSessionStats {
  progression: { chord: string; atMs: number }[]
  switchCount: number
  chordPlays: number
  sequence: string[]
}

function buildChordFrequency(sequence: string[]): { chord: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const chord of sequence) counts.set(chord, (counts.get(chord) ?? 0) + 1)
  return [...counts.entries()]
    .map(([chord, count]) => ({ chord, count }))
    .sort((a, b) => b.count - a.count)
}

export function finalizeAnalysis(
  state: LiveAnalysisState,
  sessionId: string,
  clientStats?: ClientSessionStats,
  durationSecondsOverride?: number,
): {
  sessionId: string
  expectedSequence: string[]
  detectedSequence: string[]
  switchCount: number
  chordPlays: number
  uniqueChords: string[]
  progressionTimestamps: { chord: string; atMs: number }[]
  chordFrequency: { chord: string; count: number }[]
  accuracy: number
  actualBpm: number | null
  targetBpm: number
  timingDrift: number[]
  transitionDurationsMs: number[]
  hesitationPoints: number[]
  perStringDiagnosis: IPerStringDiagnosis[]
  durationSeconds: number
} {
  const detected = clientStats?.sequence.length ? clientStats.sequence : state.detectedSequence
  const durationSeconds =
    durationSecondsOverride ??
    Math.max(1, Math.round((Date.now() - state.startedAtMs) / 1000))
  const switchCount = clientStats?.switchCount ?? Math.max(0, detected.length - 1)
  const chordPlays = clientStats?.chordPlays ?? detected.length
  const progressionTimestamps = clientStats?.progression ?? []
  const uniqueChords = [...new Set(detected)]
  const chordFrequency = buildChordFrequency(detected)

  const transitionDurationsMs: number[] = []
  const hesitationPoints: number[] = []
  const hesitationThreshold = (60_000 / state.targetBpm) * 1.5

  for (let i = 1; i < state.onsetTimes.length; i++) {
    const gap = state.onsetTimes[i]! - state.onsetTimes[i - 1]!
    transitionDurationsMs.push(gap)
    if (gap > hesitationThreshold) hesitationPoints.push(state.onsetTimes[i]!)
  }

  let actualBpm: number | null = null
  if (transitionDurationsMs.length >= 2) {
    const avg = transitionDurationsMs.reduce((a, b) => a + b, 0) / transitionDurationsMs.length
    actualBpm = Math.round(60_000 / avg)
  }

  const timingDrift = actualBpm
    ? [Math.round(60_000 / actualBpm - 60_000 / state.targetBpm)]
    : []

  const lastChord = detected[detected.length - 1]
  const perStringDiagnosis = lastChord ? diagnoseChord(lastChord, state.lastChroma) : []

  return {
    sessionId,
    expectedSequence: [],
    detectedSequence: detected,
    switchCount,
    chordPlays,
    uniqueChords,
    progressionTimestamps,
    chordFrequency,
    accuracy: chordPlays >= 2 ? Math.min(1, switchCount / Math.max(1, chordPlays - 1)) : chordPlays > 0 ? 0.5 : 0,
    actualBpm,
    targetBpm: state.targetBpm,
    timingDrift,
    transitionDurationsMs,
    hesitationPoints,
    perStringDiagnosis,
    durationSeconds,
  }
}
