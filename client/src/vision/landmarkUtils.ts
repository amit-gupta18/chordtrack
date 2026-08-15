import type { Landmark } from '../types/hand'

export const HAND_CONNECTIONS: [number, number][] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [0, 9],
  [9, 10],
  [10, 11],
  [11, 12],
  [0, 13],
  [13, 14],
  [14, 15],
  [15, 16],
  [0, 17],
  [17, 18],
  [18, 19],
  [19, 20],
  [5, 9],
  [9, 13],
  [13, 17],
]

export function distance(a: Landmark, b: Landmark): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  const dz = a.z - b.z
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

export function angleAtJoint(a: Landmark, b: Landmark, c: Landmark): number {
  const ba = { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }
  const bc = { x: c.x - b.x, y: c.y - b.y, z: c.z - b.z }
  const dot = ba.x * bc.x + ba.y * bc.y + ba.z * bc.z
  const magBa = Math.sqrt(ba.x * ba.x + ba.y * ba.y + ba.z * ba.z)
  const magBc = Math.sqrt(bc.x * bc.x + bc.y * bc.y + bc.z * bc.z)
  if (magBa === 0 || magBc === 0) return 0
  const cos = Math.max(-1, Math.min(1, dot / (magBa * magBc)))
  return Math.acos(cos)
}

export function normalizeLandmarks(landmarks: Landmark[]): Landmark[] {
  const wrist = landmarks[0]
  const palmSize = distance(wrist, landmarks[9])
  const scale = palmSize > 0 ? palmSize : 1

  return landmarks.map((point) => ({
    x: (point.x - wrist.x) / scale,
    y: (point.y - wrist.y) / scale,
    z: (point.z - wrist.z) / scale,
  }))
}

export function mirrorLandmarkX(
  landmark: Landmark,
  width: number,
): Landmark {
  return {
    x: width - landmark.x * width,
    y: landmark.y * width,
    z: landmark.z,
  }
}

export function toCanvasCoords(
  landmark: Landmark,
  width: number,
  height: number,
  mirror = true,
): { x: number; y: number } {
  const x = mirror ? (1 - landmark.x) * width : landmark.x * width
  const y = landmark.y * height
  return { x, y }
}

export function averageLandmarks(frames: Landmark[][]): Landmark[] | null {
  if (frames.length === 0) return null

  const count = frames[0].length
  const result: Landmark[] = Array.from({ length: count }, () => ({
    x: 0,
    y: 0,
    z: 0,
  }))

  for (const frame of frames) {
    for (let i = 0; i < count; i++) {
      result[i].x += frame[i].x
      result[i].y += frame[i].y
      result[i].z += frame[i].z
    }
  }

  const n = frames.length
  return result.map((point) => ({
    x: point.x / n,
    y: point.y / n,
    z: point.z / n,
  }))
}

export function averageFeatureVectors(vectors: number[][]): number[] | null {
  if (vectors.length === 0) return null

  const length = vectors[0].length
  const sum = new Array<number>(length).fill(0)

  for (const vector of vectors) {
    for (let i = 0; i < length; i++) {
      sum[i] += vector[i]
    }
  }

  return sum.map((value) => value / vectors.length)
}

export function l2Normalize(vector: number[]): number[] {
  const magnitude = Math.sqrt(vector.reduce((acc, v) => acc + v * v, 0))
  if (magnitude === 0) return vector
  return vector.map((v) => v / magnitude)
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0

  let dot = 0
  let magA = 0
  let magB = 0

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    magA += a[i] * a[i]
    magB += b[i] * b[i]
  }

  if (magA === 0 || magB === 0) return 0
  return dot / (Math.sqrt(magA) * Math.sqrt(magB))
}
