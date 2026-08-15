export interface ChordTemplate {
  name: string
  chromagram: number[]
}

// Pitch classes: C=0, C#=1, D=2, D#=3, E=4, F=5, F#=6, G=7, G#=8, A=9, A#=10, B=11
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

const MATCH_THRESHOLD = 0.62
const SILENCE_RMS = 0.012

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

export class ChromagramSmoother {
  private history: number[][] = []
  private windowSize: number

  constructor(windowSize = 12) {
    this.windowSize = windowSize
  }

  push(chroma: number[]): number[] {
    this.history.push([...chroma])
    if (this.history.length > this.windowSize) this.history.shift()

    const smoothed = new Array<number>(12).fill(0)
    for (const frame of this.history) {
      for (let i = 0; i < 12; i++) smoothed[i]! += frame[i]!
    }
    for (let i = 0; i < 12; i++) smoothed[i]! /= this.history.length
    return smoothed
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

  for (const template of CHORD_TEMPLATES) {
    const score = cosineSimilarity(chroma, template.chromagram)
    if (score > bestScore) {
      bestScore = score
      bestChord = template.name
    }
  }

  if (bestScore < MATCH_THRESHOLD) return { chord: null, confidence: bestScore }

  // Prefer major over minor when scores are close (e.g. A vs Am)
  const majorName = bestChord?.replace('m', '') ?? ''
  const majorTemplate = CHORD_TEMPLATES.find((t) => t.name === majorName)
  if (majorTemplate && bestChord?.endsWith('m')) {
    const majorScore = cosineSimilarity(chroma, majorTemplate.chromagram)
    if (majorScore >= bestScore - 0.04) {
      return { chord: majorName, confidence: majorScore }
    }
  }

  return { chord: bestChord, confidence: bestScore }
}

export function computeRms(buffer: Float32Array): number {
  let sum = 0
  for (let i = 0; i < buffer.length; i++) sum += buffer[i]! * buffer[i]!
  return Math.sqrt(sum / buffer.length)
}
