import { useCallback, useEffect, useRef, useState } from 'react'
import { YIN } from 'pitchfinder'
import { io, type Socket } from 'socket.io-client'

const WS_URL = import.meta.env.VITE_WS_URL ?? 'http://localhost:3001'

interface AudioFeedback {
  detectedChord: string | null
  bpmEstimate: number | null
  driftMs: number | null
  diagnosis: { chord: string; string: string; issue: string; likelyCause: string }[]
}

export function useAudioCapture() {
  const [isCapturing, setIsCapturing] = useState(false)
  const [feedback, setFeedback] = useState<AudioFeedback | null>(null)
  const [error, setError] = useState<string | null>(null)
  const socketRef = useRef<Socket | null>(null)
  const rafRef = useRef<number | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const ctxRef = useRef<AudioContext | null>(null)
  const lastRmsRef = useRef(0)

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach((t) => t.stop())
    ctxRef.current?.close()
    socketRef.current?.disconnect()
    socketRef.current = null
    setIsCapturing(false)
  }, [])

  const start = useCallback(
    async (sessionId: string, expectedSequence: string[], targetBpm: number) => {
      setError(null)
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        streamRef.current = stream
        const ctx = new AudioContext()
        ctxRef.current = ctx
        const source = ctx.createMediaStreamSource(stream)
        const analyser = ctx.createAnalyser()
        analyser.fftSize = 2048
        source.connect(analyser)

        const detectPitch = YIN({ sampleRate: ctx.sampleRate })
        const buffer = new Float32Array(analyser.fftSize)

        const socket = io(WS_URL, { withCredentials: true })
        socketRef.current = socket

        socket.on('connect', () => {
          socket.emit('audio:start', { sessionId, expectedSequence, targetBpm })
        })

        socket.on('audio:feedback', (data: AudioFeedback) => setFeedback(data))
        socket.on('audio:error', (data: { error: string }) => setError(data.error))

        const loop = () => {
          analyser.getFloatTimeDomainData(buffer)
          let sum = 0
          for (let i = 0; i < buffer.length; i++) sum += buffer[i]! * buffer[i]!
          const rms = Math.sqrt(sum / buffer.length)
          const frequency = detectPitch(buffer) ?? null
          const onsets = rms > 0.05 && lastRmsRef.current <= 0.05
          lastRmsRef.current = rms

          socket.emit('audio:frame', {
            timestamp: performance.now(),
            frequency,
            rms,
            onsets,
          })

          rafRef.current = requestAnimationFrame(loop)
        }

        setIsCapturing(true)
        loop()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Mic access failed')
      }
    },
    [],
  )

  const finish = useCallback((sessionId: string) => {
    return new Promise<unknown>((resolve) => {
      const socket = socketRef.current
      if (!socket) return resolve(null)
      socket.once('audio:complete', (data) => {
        stop()
        resolve(data.analysis)
      })
      socket.emit('audio:stop', { sessionId })
    })
  }, [stop])

  useEffect(() => () => stop(), [stop])

  return { isCapturing, feedback, error, start, stop, finish }
}
