import { SESSION_DURATION_MS } from '../types/hand'

export function formatTime(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export function sessionProgress(elapsedMs: number): number {
  return Math.min(1, Math.max(0, elapsedMs / SESSION_DURATION_MS))
}

export function playStartBeep(): void {
  try {
    const ctx = new AudioContext()
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()

    oscillator.type = 'sine'
    oscillator.frequency.value = 880
    gain.gain.value = 0.15

    oscillator.connect(gain)
    gain.connect(ctx.destination)

    oscillator.start()
    oscillator.stop(ctx.currentTime + 0.15)

    oscillator.onended = () => {
      void ctx.close()
    }
  } catch {
    // Audio may be blocked; non-critical
  }
}
