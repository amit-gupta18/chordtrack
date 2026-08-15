import type { FeatureVector, Landmark } from '../types/hand'
import { angleAtJoint, distance, l2Normalize, normalizeLandmarks } from './landmarkUtils'

export function extractFeatures(landmarks: Landmark[]): FeatureVector {
  const normalized = normalizeLandmarks(landmarks)
  const features: number[] = []

  const fingerPips = [
    { mcp: 5, pip: 6, tip: 8 },
    { mcp: 9, pip: 10, tip: 12 },
    { mcp: 13, pip: 14, tip: 16 },
    { mcp: 17, pip: 18, tip: 20 },
  ]

  for (const finger of fingerPips) {
    features.push(
      angleAtJoint(
        normalized[finger.mcp],
        normalized[finger.pip],
        normalized[finger.tip],
      ),
    )
  }

  const wrist = normalized[0]
  for (const tipIndex of [4, 8, 12, 16, 20]) {
    features.push(distance(wrist, normalized[tipIndex]))
  }

  features.push(distance(normalized[8], normalized[12]))
  features.push(distance(normalized[12], normalized[16]))
  features.push(distance(normalized[8], normalized[16]))
  features.push(distance(normalized[4], normalized[5]))

  for (const index of [5, 9, 13, 17]) {
    features.push(normalized[index].x)
    features.push(normalized[index].y)
  }

  return l2Normalize(features)
}
