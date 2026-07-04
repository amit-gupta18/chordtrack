import type {
  ChordId,
  ChordTemplates,
  FeatureVector,
  RecognitionResult,
} from '../types/hand'
import { MIN_MARGIN, MIN_SCORE } from '../types/hand'
import { cosineSimilarity } from './landmarkUtils'

export function recognizeChord(
  features: FeatureVector | null,
  templates: ChordTemplates,
): RecognitionResult {
  if (!features || !templates.A || !templates.D) {
    return {
      chord: 'Unknown',
      confidence: 0,
      scoreA: 0,
      scoreD: 0,
    }
  }

  const scoreA = cosineSimilarity(features, templates.A)
  const scoreD = cosineSimilarity(features, templates.D)

  const scores: { chord: ChordId; score: number }[] = [
    { chord: 'A', score: scoreA },
    { chord: 'D', score: scoreD },
  ]

  scores.sort((a, b) => b.score - a.score)
  const best = scores[0]
  const second = scores[1]
  const margin = best.score - second.score

  if (best.score < MIN_SCORE || margin < MIN_MARGIN) {
    return {
      chord: 'Unknown',
      confidence: Math.max(0, margin),
      scoreA,
      scoreD,
    }
  }

  return {
    chord: best.chord,
    confidence: margin,
    scoreA,
    scoreD,
  }
}

export function confidencePercent(result: RecognitionResult): number {
  if (result.chord === 'Unknown') {
    return Math.round(Math.max(result.scoreA, result.scoreD) * 50)
  }
  const bestScore = Math.max(result.scoreA, result.scoreD)
  return Math.round(Math.min(100, bestScore * 70 + result.confidence * 300))
}
