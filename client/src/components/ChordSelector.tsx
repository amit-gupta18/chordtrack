import type { ChordId, ChordTemplates, SessionPhase } from '../types/hand'
import { CALIBRATION_FRAMES, CHORD_LABELS } from '../types/hand'

interface ChordSelectorProps {
  templates: ChordTemplates
  phase: SessionPhase
  calibrationTarget: ChordId | null
  calibrationProgress: number
  onCapture: (chord: ChordId) => void
}

export function ChordSelector({
  templates,
  phase,
  calibrationTarget,
  calibrationProgress,
  onCapture,
}: ChordSelectorProps) {
  const chords: ChordId[] = ['A', 'D']

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
        Calibration
      </h2>
      <p className="mb-4 text-sm text-slate-300">
        Hold each chord shape steadily, then capture a template for A and D major.
      </p>

      <div className="space-y-3">
        {chords.map((chord) => {
          const calibrated = Boolean(templates[chord])
          const isCapturing = phase === 'calibrating' && calibrationTarget === chord

          return (
            <div
              key={chord}
              className="flex items-center justify-between gap-3 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2"
            >
              <div>
                <p className="font-medium text-white">{CHORD_LABELS[chord]}</p>
                <p className="text-xs text-slate-400">
                  {calibrated ? 'Calibrated' : 'Not captured'}
                  {isCapturing
                    ? ` · capturing ${calibrationProgress}/${CALIBRATION_FRAMES}`
                    : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onCapture(chord)}
                disabled={phase === 'running' || phase === 'countdown'}
                className="rounded-lg bg-cyan-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Capture {chord}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
