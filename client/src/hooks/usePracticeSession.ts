import { useCallback, useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { io, type Socket } from 'socket.io-client'
import { getToken } from '../lib/token'
import { computeChromaFromFft } from '../lib/chroma'
import {
  ChordSessionTracker,
  ChromagramSmoother,
  clampSessionDuration,
  computeRms,
  detectChordFromChroma,
} from '../lib/chordDetection'

const WS_URL = import.meta.env.VITE_WS_URL ?? 'http://localhost:3001'
const FFT_SIZE = 8192

export interface PracticeFeedback {
  detectedChord: string | null
  confidence: number
  remainingMs: number
  elapsedMs: number
  durationMs: number
  switchCount: number
  chordPlays: number
  bpmEstimate: number | null
  driftMs: number | null
  diagnosis: { chord: string; string: string; issue: string; likelyCause: string }[]
  chordSequence: string[]
  progression: { chord: string; atMs: number }[]
}

export interface SessionResult {
  sessionId: string
  analysis: {
    detectedSequence: string[]
    switchCount: number
    chordPlays: number
    uniqueChords: string[]
    chordFrequency: { chord: string; count: number }[]
    progressionTimestamps: { chord: string; atMs: number }[]
    aiFeedback?: string
    durationSeconds: number
  }
}

export function usePracticeSession() {
  const queryClient = useQueryClient()
  const [isActive, setIsActive] = useState(false)
  const [feedback, setFeedback] = useState<PracticeFeedback | null>(null)
  const [lastResult, setLastResult] = useState<SessionResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const socketRef = useRef<Socket | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const ctxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const rafRef = useRef<number | null>(null)
  const timerRef = useRef<number | null>(null)
  const smootherRef = useRef(new ChromagramSmoother())
  const trackerRef = useRef<ChordSessionTracker | null>(null)
  const sessionStartRef = useRef(0)
  const durationMsRef = useRef(60_000)
  const stoppingRef = useRef(false)
  const lastRmsRef = useRef(0)

  const cleanup = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    if (timerRef.current) clearInterval(timerRef.current)
    rafRef.current = null
    timerRef.current = null
    streamRef.current?.getTracks().forEach((t) => t.stop())
    void ctxRef.current?.close()
    ctxRef.current = null
    analyserRef.current = null
    socketRef.current?.disconnect()
    socketRef.current = null
    smootherRef.current.reset()
    trackerRef.current = null
    stoppingRef.current = false
    setIsActive(false)
  }, [])

  const stop = useCallback(() => {
    if (stoppingRef.current) {
      return Promise.resolve()
    }
    stoppingRef.current = true

    return new Promise<void>((resolve) => {
      const socket = socketRef.current
      if (!socket?.connected) {
        cleanup()
        resolve()
        return
      }

      const tracker = trackerRef.current
      socket.emit('practice:stop', {
        clientStats: tracker
          ? {
              progression: tracker.progression,
              switchCount: tracker.switchCount,
              chordPlays: tracker.chordPlays,
              sequence: tracker.sequence,
            }
          : undefined,
      })

      socket.once('practice:complete', (data: SessionResult & { analysis: SessionResult['analysis'] }) => {
        setLastResult({
          sessionId: data.sessionId,
          analysis: data.analysis,
        })
        setFeedback(null)
        cleanup()
        void queryClient.invalidateQueries({ queryKey: ['analytics'] })
        void queryClient.invalidateQueries({ queryKey: ['journal'] })
        void queryClient.invalidateQueries({ queryKey: ['sessions'] })
        resolve()
      })
    })
  }, [cleanup, queryClient])

  const start = useCallback(
    async (durationSeconds: number) => {
      const durationSecondsClamped = clampSessionDuration(durationSeconds)
      const durationMs = durationSecondsClamped * 1000
      durationMsRef.current = durationMs

      setError(null)
      setLastResult(null)
      setFeedback(null)
      smootherRef.current.reset()
      sessionStartRef.current = performance.now()
      trackerRef.current = new ChordSessionTracker(sessionStartRef.current)
      stoppingRef.current = false

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
        analyser.smoothingTimeConstant = 0.2
        analyser.minDecibels = -90
        analyser.maxDecibels = -10
        source.connect(analyser)
        analyserRef.current = analyser

        const timeBuffer = new Float32Array(analyser.fftSize)
        const freqBuffer = new Float32Array(analyser.frequencyBinCount)

        const socket = io(WS_URL, { auth: { token: getToken() } })
        socketRef.current = socket

        await new Promise<void>((resolve, reject) => {
          socket.on('connect', () =>
            socket.emit('practice:start', { durationSeconds: durationSecondsClamped }),
          )
          socket.on('practice:started', () => resolve())
          socket.on('connect_error', (err) => reject(err))
        })

        socket.on('practice:feedback', (data: Partial<PracticeFeedback>) => {
          setFeedback((prev) =>
            prev
              ? {
                  ...prev,
                  bpmEstimate: data.bpmEstimate ?? prev.bpmEstimate,
                  driftMs: data.driftMs ?? prev.driftMs,
                  diagnosis: data.diagnosis ?? prev.diagnosis,
                }
              : prev,
          )
        })

        const updateTimer = () => {
          const elapsed = performance.now() - sessionStartRef.current
          const remaining = Math.max(0, durationMsRef.current - elapsed)
          setFeedback((prev) =>
            prev ? { ...prev, elapsedMs: elapsed, remainingMs: remaining } : prev,
          )
          if (remaining <= 0) void stop()
        }

        timerRef.current = window.setInterval(updateTimer, 100)

        const loop = () => {
          const tracker = trackerRef.current
          if (!tracker) return

          analyser.getFloatTimeDomainData(timeBuffer)
          analyser.getFloatFrequencyData(freqBuffer)

          const rms = computeRms(timeBuffer)
          const chroma = computeChromaFromFft(freqBuffer, ctx.sampleRate)
          const smoothed = smootherRef.current.push(chroma)
          const { chord: rawChord, confidence } = detectChordFromChroma(smoothed, rms)
          const displayChord = tracker.update(rawChord)

          const onsets = rms > 0.035 && lastRmsRef.current <= 0.035
          lastRmsRef.current = rms

          const elapsed = performance.now() - sessionStartRef.current
          const remaining = Math.max(0, durationMsRef.current - elapsed)

          setFeedback({
            detectedChord: displayChord,
            confidence,
            elapsedMs: elapsed,
            remainingMs: remaining,
            durationMs: durationMsRef.current,
            switchCount: tracker.switchCount,
            chordPlays: tracker.chordPlays,
            bpmEstimate: null,
            driftMs: null,
            diagnosis: [],
            chordSequence: [...tracker.sequence],
            progression: [...tracker.progression],
          })

          socket.emit('practice:frame', {
            timestamp: performance.now(),
            rms,
            onsets,
            chroma: smoothed,
            detectedChord: displayChord,
            confidence,
          })

          rafRef.current = requestAnimationFrame(loop)
        }

        setIsActive(true)
        setFeedback({
          detectedChord: null,
          confidence: 0,
          elapsedMs: 0,
          remainingMs: durationMs,
          durationMs,
          switchCount: 0,
          chordPlays: 0,
          bpmEstimate: null,
          driftMs: null,
          diagnosis: [],
          chordSequence: [],
          progression: [],
        })
        loop()
      } catch (err) {
        cleanup()
        setError(err instanceof Error ? err.message : 'Could not start practice session')
      }
    },
    [cleanup, stop],
  )

  useEffect(() => () => cleanup(), [cleanup])

  return { isActive, feedback, lastResult, error, start, stop }
}
