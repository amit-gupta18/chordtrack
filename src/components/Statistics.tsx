import type { RecognitionResult, SessionStats } from '../types/hand'
import { confidencePercent } from '../vision/chordRecognizer'

interface StatisticsProps {
  stats: SessionStats
  recognition: RecognitionResult
  phase: import('../types/hand').SessionPhase
}

function formatMs(ms: number | null): string {
  if (ms === null) return '—'
  return `${(ms / 1000).toFixed(2)}s`
}

export function Statistics({ stats, recognition, phase }: StatisticsProps) {
  const confidence = confidencePercent(recognition)
  const currentChord =
    phase === 'running' || phase === 'finished'
      ? stats.stableChord
      : recognition.chord

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
        Statistics
      </h2>

      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-slate-400">Current Chord</dt>
          <dd className="text-lg font-semibold text-white">{currentChord}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Switches / Min</dt>
          <dd className="text-lg font-semibold text-white">
            {stats.switchesPerMinute.toFixed(1)}
          </dd>
        </div>
        <div>
          <dt className="text-slate-400">Avg Switch Time</dt>
          <dd className="text-lg font-semibold text-white">
            {formatMs(stats.avgSwitchTimeMs)}
          </dd>
        </div>
        <div>
          <dt className="text-slate-400">Detected (raw)</dt>
          <dd className="text-lg font-semibold text-white">{recognition.chord}</dd>
        </div>
      </dl>

      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between text-xs text-slate-400">
          <span>Confidence</span>
          <span>{confidence}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-700">
          <div
            className="h-full rounded-full bg-cyan-400 transition-all duration-150"
            style={{ width: `${confidence}%` }}
          />
        </div>
      </div>
    </div>
  )
}
