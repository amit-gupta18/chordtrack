import { useEffect, useRef } from 'react'
import { useMetronomeStore } from '../../stores/useMetronomeStore'

export function Metronome() {
  const { bpm, isPlaying, timeSignature, currentBeat, setBpm, setIsPlaying, setTimeSignature, setCurrentBeat, addTap } =
    useMetronomeStore()

  const intervalRef = useRef<number | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)

  const beatsPerBar = timeSignature === '3/4' ? 3 : timeSignature === '6/8' ? 6 : 4

  useEffect(() => {
    if (!isPlaying) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      setCurrentBeat(0)
      return
    }

    const msPerBeat = 60_000 / bpm
    let beat = 0

    intervalRef.current = window.setInterval(() => {
      beat = (beat % beatsPerBar) + 1
      setCurrentBeat(beat)

      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext()
      const ctx = audioCtxRef.current
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = beat === 1 ? 1000 : 800
      gain.gain.value = 0.1
      osc.start()
      osc.stop(ctx.currentTime + 0.05)
    }, msPerBeat)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isPlaying, bpm, beatsPerBar, setCurrentBeat])

  return (
    <div className="atlas-card space-y-4 p-6">
      <h2 className="text-xl font-semibold text-atlas-navy">Metronome</h2>

      <div className="flex items-center justify-center gap-2">
        {Array.from({ length: beatsPerBar }, (_, i) => (
          <div
            key={i}
            className={`h-4 w-4 rounded-full transition ${
              currentBeat === i + 1 && isPlaying ? 'scale-125 bg-atlas-blue' : 'bg-atlas-border'
            }`}
          />
        ))}
      </div>

      <div className="flex items-center gap-4">
        <label className="text-sm text-atlas-text">
          BPM
          <input
            type="range"
            min={40}
            max={200}
            value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
            className="ml-2 w-48 accent-atlas-blue"
          />
          <span className="ml-2 font-mono font-semibold text-atlas-navy">{bpm}</span>
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['4/4', '3/4', '6/8'] as const).map((sig) => (
          <button
            key={sig}
            type="button"
            onClick={() => setTimeSignature(sig)}
            className={
              timeSignature === sig
                ? 'atlas-nav-link-active'
                : 'rounded-md border border-atlas-border px-3 py-1 text-sm text-atlas-text hover:bg-atlas-bg'
            }
          >
            {sig}
          </button>
        ))}
        <button type="button" onClick={addTap} className="atlas-btn-secondary px-3 py-1">
          Tap tempo
        </button>
      </div>

      <button
        type="button"
        onClick={() => setIsPlaying(!isPlaying)}
        className={`w-full py-3 ${isPlaying ? 'atlas-btn-danger' : 'atlas-btn-primary'}`}
      >
        {isPlaying ? 'Stop' : 'Start'}
      </button>
    </div>
  )
}
