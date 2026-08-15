import {
  FilesetResolver,
  HandLandmarker,
  type HandLandmarkerResult,
} from '@mediapipe/tasks-vision'
import type { Landmark } from '../types/hand'

const WASM_URL =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm'
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task'

let landmarker: HandLandmarker | null = null
let initPromise: Promise<HandLandmarker> | null = null

export async function initHandTracker(): Promise<HandLandmarker> {
  if (landmarker) return landmarker
  if (initPromise) return initPromise

  initPromise = (async () => {
    const vision = await FilesetResolver.forVisionTasks(WASM_URL)
    landmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: MODEL_URL,
      },
      numHands: 1,
      runningMode: 'VIDEO',
    })
    return landmarker
  })()

  return initPromise
}

export function detectHandLandmarks(
  video: HTMLVideoElement,
  timestamp: number,
): Landmark[] | null {
  if (!landmarker) return null

  const result: HandLandmarkerResult = landmarker.detectForVideo(
    video,
    timestamp,
  )

  if (!result.landmarks.length) return null

  return result.landmarks[0].map((point) => ({
    x: point.x,
    y: point.y,
    z: point.z,
  }))
}

export function closeHandTracker(): void {
  landmarker?.close()
  landmarker = null
  initPromise = null
}
