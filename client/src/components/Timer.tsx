import { SESSION_DURATION_MS } from '../types/hand'
import { formatTime, sessionProgress } from '../logic/timer'

interface TimerProps {
  remainingMs: number
  elapsedMs: number
  phase: import('../types/hand').SessionPhase
  countdownValue: number
}

export function Timer({ remainingMs, elapsedMs, phase, countdownValue }: TimerProps) {
  const progress = sessionProgress(elapsedMs)
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - progress)

  const showCountdown = phase === 'countdown'
  const showTimer = phase === 'running' || phase === 'finished'
  const centerText = showCountdown
    ? countdownValue.toString()
    : showTimer
      ? formatTime(remainingMs)
      : formatTime(SESSION_DURATION_MS)

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative flex h-36 w-36 items-center justify-center">
        <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-slate-700"
          />
          {(phase === 'running' || phase === 'finished') && (
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className="text-cyan-400 transition-[stroke-dashoffset] duration-200"
            />
          )}
        </svg>
        <div className="text-center">
          <p className="text-3xl font-bold tabular-nums text-white">{centerText}</p>
          <p className="text-xs uppercase tracking-wide text-slate-400">
            {showCountdown ? 'Get ready' : 'Remaining'}
          </p>
        </div>
      </div>
    </div>
  )
}
