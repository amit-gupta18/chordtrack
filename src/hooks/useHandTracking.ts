import { useEffect, useRef, useState } from 'react'
import type { CameraHandle } from '../components/Camera'
import type {
  ChordTemplates,
  FeatureVector,
  Landmark,
  RecognitionResult,
} from '../types/hand'
import { extractFeatures } from '../vision/featureExtractor'
import { recognizeChord } from '../vision/chordRecognizer'
import {
  closeHandTracker,
  detectHandLandmarks,
  initHandTracker,
} from '../vision/handTracker'

interface UseHandTrackingOptions {
  cameraRef: React.RefObject<CameraHandle | null>
  enabled: boolean
  templates: ChordTemplates
  onFrame?: (features: FeatureVector | null, recognition: RecognitionResult) => void
}

export function useHandTracking({
  cameraRef,
  enabled,
  templates,
  onFrame,
}: UseHandTrackingOptions) {
  const [landmarks, setLandmarks] = useState<Landmark[] | null>(null)
  const [features, setFeatures] = useState<FeatureVector | null>(null)
  const [recognition, setRecognition] = useState<RecognitionResult>({
    chord: 'Unknown',
    confidence: 0,
    scoreA: 0,
    scoreD: 0,
  })
  const [trackerReady, setTrackerReady] = useState(false)
  const templatesRef = useRef(templates)
  const onFrameRef = useRef(onFrame)

  useEffect(() => {
    templatesRef.current = templates
  }, [templates])

  useEffect(() => {
    onFrameRef.current = onFrame
  }, [onFrame])

  useEffect(() => {
    if (!enabled) return

    let cancelled = false

    void initHandTracker()
      .then(() => {
        if (!cancelled) setTrackerReady(true)
      })
      .catch(console.error)

    return () => {
      cancelled = true
      closeHandTracker()
      setTrackerReady(false)
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled || !trackerReady) return

    let frameId = 0

    const loop = () => {
      const video = cameraRef.current?.getVideo()
      if (video && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        const detected = detectHandLandmarks(video, performance.now())
        setLandmarks(detected)

        let nextFeatures: FeatureVector | null = null
        let nextRecognition: RecognitionResult = {
          chord: 'Unknown',
          confidence: 0,
          scoreA: 0,
          scoreD: 0,
        }

        if (detected) {
          nextFeatures = extractFeatures(detected)
          nextRecognition = recognizeChord(nextFeatures, templatesRef.current)
          setFeatures(nextFeatures)
          setRecognition(nextRecognition)
        } else {
          setFeatures(null)
          setRecognition(nextRecognition)
        }

        onFrameRef.current?.(nextFeatures, nextRecognition)
      }

      frameId = requestAnimationFrame(loop)
    }

    frameId = requestAnimationFrame(loop)

    return () => cancelAnimationFrame(frameId)
  }, [cameraRef, enabled, trackerReady])

  return { landmarks, features, recognition, trackerReady }
}
