export interface ChordTemplate {
  name: string
  chromagram: number[]
}

// Pitch classes: C=0 … B=11
export const CHORD_TEMPLATES: ChordTemplate[] = [
  { name: 'A', chromagram: [0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0] },
  { name: 'Am', chromagram: [1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0] },
  { name: 'D', chromagram: [0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0] },
  { name: 'Dm', chromagram: [0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0] },
  { name: 'E', chromagram: [0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1] },
  { name: 'Em', chromagram: [0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1] },
  { name: 'G', chromagram: [0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1] },
  { name: 'C', chromagram: [1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0] },
  { name: 'F', chromagram: [1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0] },
]

const MATCH_THRESHOLD = 0.58
const SILENCE_RMS = 0.01
const STABLE_FRAMES_TO_COMMIT = 5
const STABLE_FRAMES_TO_DISPLAY = 2

function weightedCosineSimilarity(a: number[], template: ChordTemplate): number {
  let dot = 0
  let magA = 0
  let magB = 0
  for (let i = 0; i < 12; i++) {
    const w = template.chromagram[i]! > 0 ? 1.35 : 0.85
    const b = template.chromagram[i]! * w
    const av = a[i]! * w
    dot += av * b
    magA += av * av
    magB += b * b
  }
  if (magA === 0 || magB === 0) return 0
  return dot / (Math.sqrt(magA) * Math.sqrt(magB))
}

export class ChromagramSmoother {
  private history: number[][] = []
  private windowSize: number

  constructor(windowSize = 10) {
    this.windowSize = windowSize
  }

  push(chroma: number[]): number[] {
    this.history.push([...chroma])
    if (this.history.length > this.windowSize) this.history.shift()

    const smoothed = new Array<number>(12).fill(0)
    const weights = this.history.map((_, i) => 0.5 + (i / this.history.length) * 0.5)
    const totalWeight = weights.reduce((a, b) => a + b, 0)

    for (let h = 0; h < this.history.length; h++) {
      for (let i = 0; i < 12; i++) smoothed[i]! += this.history[h]![i]! * weights[h]!
    }
    return smoothed.map((v) => v / totalWeight)
  }

  reset() {
    this.history = []
  }
}

export function detectChordFromChroma(
  chroma: number[],
  rms: number,
): { chord: string | null; confidence: number } {
  if (rms < SILENCE_RMS) return { chord: null, confidence: 0 }

  let bestChord: string | null = null
  let bestScore = 0
  let secondScore = 0

  for (const template of CHORD_TEMPLATES) {
    const score = weightedCosineSimilarity(chroma, template)
    if (score > bestScore) {
      secondScore = bestScore
      bestScore = score
      bestChord = template.name
    } else if (score > secondScore) {
      secondScore = score
    }
  }

  // Require clear winner over runner-up
  if (bestScore < MATCH_THRESHOLD || bestScore - secondScore < 0.06) {
    return { chord: null, confidence: bestScore }
  }

  if (bestChord?.endsWith('m')) {
    const majorName = bestChord.slice(0, -1)
    const majorTemplate = CHORD_TEMPLATES.find((t) => t.name === majorName)
    if (majorTemplate) {
      const majorScore = weightedCosineSimilarity(chroma, majorTemplate)
      if (majorScore >= bestScore - 0.05) {
        return { chord: majorName, confidence: majorScore }
      }
    }
  }

  return { chord: bestChord, confidence: bestScore }
}

export interface ProgressionEvent {
  chord: string
  atMs: number
}

export class ChordSessionTracker {
  readonly sequence: string[] = []
  readonly progression: ProgressionEvent[] = []
  switchCount = 0
  chordPlays = 0

  private lastCommitted: string | null = null
  private candidate: string | null = null
  private candidateFrames = 0
  private readonly startedAt: number

  constructor(startedAt = performance.now()) {
    this.startedAt = startedAt
  }

  update(rawChord: string | null): string | null {
    if (!rawChord) {
      this.candidate = null
      this.candidateFrames = 0
      return this.lastCommitted
    }

    if (rawChord === this.candidate) {
      this.candidateFrames++
    } else {
      this.candidate = rawChord
      this.candidateFrames = 1
    }

    if (this.candidateFrames >= STABLE_FRAMES_TO_COMMIT && rawChord !== this.lastCommitted) {
      if (this.lastCommitted !== null) this.switchCount++
      this.lastCommitted = rawChord
      this.sequence.push(rawChord)
      this.progression.push({
        chord: rawChord,
        atMs: Math.round(performance.now() - this.startedAt),
      })
      this.chordPlays++
    }

    return this.candidateFrames >= STABLE_FRAMES_TO_DISPLAY ? rawChord : this.lastCommitted
  }

  getUniqueChords(): string[] {
    return [...new Set(this.sequence)]
  }

  getChordFrequency(): { chord: string; count: number }[] {
    const counts = new Map<string, number>()
    for (const c of this.sequence) counts.set(c, (counts.get(c) ?? 0) + 1)
    return [...counts.entries()]
      .map(([chord, count]) => ({ chord, count }))
      .sort((a, b) => b.count - a.count)
  }
}

export function computeRms(buffer: Float32Array): number {
  let sum = 0
  for (let i = 0; i < buffer.length; i++) sum += buffer[i]! * buffer[i]!
  return Math.sqrt(sum / buffer.length)
}

export const DEFAULT_SESSION_DURATION_SECONDS = 60
export const MIN_SESSION_DURATION_SECONDS = 30
export const MAX_SESSION_DURATION_SECONDS = 600

export function clampSessionDuration(seconds: number): number {
  return Math.min(MAX_SESSION_DURATION_SECONDS, Math.max(MIN_SESSION_DURATION_SECONDS, Math.round(seconds)))
}

export function formatDurationLabel(seconds: number): string {
  const clamped = clampSessionDuration(seconds)
  if (clamped < 60) return `${clamped}s`
  const minutes = Math.floor(clamped / 60)
  const remainder = clamped % 60
  if (remainder === 0) return `${minutes} min`
  return `${minutes}:${remainder.toString().padStart(2, '0')}`
}

export function formatTimer(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000))
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}
