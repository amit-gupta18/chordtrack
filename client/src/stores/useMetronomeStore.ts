import { create } from 'zustand'

export type TimeSignature = '4/4' | '3/4' | '6/8'

interface MetronomeStore {
  bpm: number
  isPlaying: boolean
  timeSignature: TimeSignature
  currentBeat: number
  setBpm: (bpm: number) => void
  setIsPlaying: (playing: boolean) => void
  setTimeSignature: (sig: TimeSignature) => void
  setCurrentBeat: (beat: number) => void
  tapTempo: (timestamps: number[]) => void
  tapTimestamps: number[]
  addTap: () => void
}

export const useMetronomeStore = create<MetronomeStore>((set, get) => ({
  bpm: 80,
  isPlaying: false,
  timeSignature: '4/4',
  currentBeat: 0,
  tapTimestamps: [],

  setBpm: (bpm) => set({ bpm: Math.min(200, Math.max(40, bpm)) }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setTimeSignature: (timeSignature) => set({ timeSignature, currentBeat: 0 }),
  setCurrentBeat: (currentBeat) => set({ currentBeat }),

  addTap: () => {
    const now = performance.now()
    const taps = [...get().tapTimestamps, now].slice(-4)
    set({ tapTimestamps: taps })
    if (taps.length >= 2) {
      const intervals = []
      for (let i = 1; i < taps.length; i++) {
        intervals.push(taps[i]! - taps[i - 1]!)
      }
      const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length
      set({ bpm: Math.min(200, Math.max(40, Math.round(60_000 / avg))) })
    }
  },

  tapTempo: (timestamps) => {
    if (timestamps.length < 2) return
    const intervals = []
    for (let i = 1; i < timestamps.length; i++) {
      intervals.push(timestamps[i]! - timestamps[i - 1]!)
    }
    const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length
    set({ bpm: Math.min(200, Math.max(40, Math.round(60_000 / avg))) })
  },
}))
