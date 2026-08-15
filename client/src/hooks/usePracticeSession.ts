import { useCallback, useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { io, type Socket } from 'socket.io-client'
import { computeChromaFromFft } from '../lib/chroma'
import {
  ChromagramSmoother,
  computeRms,
  detectChordFromChroma,
} from '../lib/chordDetection'

const WS_URL = import.meta.env.VITE_WS_URL ?? 'http://localhost:3001'
const FFT_SIZE = 8192

export interface PracticeFeedback {
  detectedChord: string | null
  confidence: number
  bpmEstimate: number | null
  driftMs: number | null
  diagnosis: { chord: string; string: string; issue: string; likelyCause: string }[]
  chordSequence: string[]
}

export function usePracticeSession() {
  const queryClient = useQueryClient()
  const [isActive, setIsActive] = useState(false)
  const [feedback, setFeedback] = useState<PracticeFeedback | null>(null)
  const [lastAnalysis, setLastAnalysis] = useState<unknown>(null)
  const [error, setError] = useState<string | null>(null)

  const socketRef = useRef<Socket | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const ctxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const rafRef = useRef<number | null>(null)
  const smootherRef = useRef(new ChromagramSmoother())
  const lastRmsRef = useRef(0)
  const chordSequenceRef = useRef<string[]>([])
  const lastStableChordRef = useRef<string | null>(null)
  const stableFramesRef = useRef(0)

  const cleanup = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
    streamRef.current?.getTracks().forEach((t) => t.stop())
    void ctxRef.current?.close()
    ctxRef.current = null
    analyserRef.current = null
    socketRef.current?.disconnect()
    socketRef.current = null
    smootherRef.current.reset()
    chordSequenceRef.current = []
    lastStableChordRef.current = null
    stableFramesRef.current = 0
    setIsActive(false)
  }, [])

  const stop = useCallback(() => {
    return new Promise<void>((resolve) => {
      const socket = socketRef.current
      if (!socket?.connected) {
        cleanup()
        resolve()
        return
      }
      socket.once('practice:complete', (data) => {
        setLastAnalysis(data.analysis)
        setFeedback(null)
        cleanup()
        void queryClient.invalidateQueries({ queryKey: ['analytics'] })
        void queryClient.invalidateQueries({ queryKey: ['journal'] })
        void queryClient.invalidateQueries({ queryKey: ['sessions'] })
        resolve()
      })
      socket.emit('practice:stop')
    })
  }, [cleanup, queryClient])

  const start = useCallback(
    async (targetBpm = 80) => {
      setError(null)
      setLastAnalysis(null)
      setFeedback(null)
      smootherRef.current.reset()
      chordSequenceRef.current = []
      lastStableChordRef.current = null
      stableFramesRef.current = 0

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          },
        })
        streamRef.current = stream

        const ctx = new AudioContext()
        ctxRef.current = ctx
        if (ctx.state === 'suspended') await ctx.resume()

        const source = ctx.createMediaStreamSource(stream)
        const analyser = ctx.createAnalyser()
        analyser.fftSize = FFT_SIZE
        analyser.smoothingTimeConstant = 0.3
        analyser.minDecibels = -90
        analyser.maxDecibels = -10
        source.connect(analyser)
        analyserRef.current = analyser

        const timeBuffer = new Float32Array(analyser.fftSize)
        const freqBuffer = new Float32Array(analyser.frequencyBinCount)

        const socket = io(WS_URL, { withCredentials: true })
        socketRef.current = socket

        await new Promise<void>((resolve, reject) => {
          socket.on('connect', () => socket.emit('practice:start', { targetBpm }))
          socket.on('practice:started', () => resolve())
          socket.on('connect_error', (err) => reject(err))
        })

        socket.on('practice:feedback', (data: Partial<PracticeFeedback>) => {
          setFeedback((prev) => ({
            detectedChord: prev?.detectedChord ?? data.detectedChord ?? null,
            confidence: prev?.confidence ?? 0,
            bpmEstimate: data.bpmEstimate ?? prev?.bpmEstimate ?? null,
            driftMs: data.driftMs ?? prev?.driftMs ?? null,
            diagnosis: data.diagnosis ?? prev?.diagnosis ?? [],
            chordSequence: prev?.chordSequence ?? data.chordSequence ?? [],
          }))
        })

        const loop = () => {
          analyser.getFloatTimeDomainData(timeBuffer)
          analyser.getFloatFrequencyData(freqBuffer)

          const rms = computeRms(timeBuffer)
          const chroma = computeChromaFromFft(freqBuffer, ctx.sampleRate)
          const smoothed = smootherRef.current.push(chroma)
          const { chord, confidence } = detectChordFromChroma(smoothed, rms)

          if (chord === lastStableChordRef.current) {
            stableFramesRef.current++
          } else {
            stableFramesRef.current = chord ? 1 : 0
            lastStableChordRef.current = chord
          }

          if (
            chord &&
            stableFramesRef.current === 6 &&
            chordSequenceRef.current[chordSequenceRef.current.length - 1] !== chord
          ) {
            chordSequenceRef.current = [...chordSequenceRef.current, chord]
          }

          const onsets = rms > 0.04 && lastRmsRef.current <= 0.04
          lastRmsRef.current = rms

          setFeedback((prev) => ({
            detectedChord: chord,
            confidence,
            bpmEstimate: prev?.bpmEstimate ?? null,
            driftMs: prev?.driftMs ?? null,
            diagnosis: prev?.diagnosis ?? [],
            chordSequence: [...chordSequenceRef.current],
          }))

          socket.emit('practice:frame', {
            timestamp: performance.now(),
            rms,
            onsets,
            chroma: smoothed,
            detectedChord: chord,
            confidence,
          })

          rafRef.current = requestAnimationFrame(loop)
        }

        setIsActive(true)
        loop()
      } catch (err) {
        cleanup()
        setError(err instanceof Error ? err.message : 'Could not start practice session')
      }
    },
    [cleanup],
  )

  useEffect(() => () => cleanup(), [cleanup])

  return { isActive, feedback, lastAnalysis, error, start, stop }
}
