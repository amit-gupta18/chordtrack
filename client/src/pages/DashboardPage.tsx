import type { ReactElement } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { usePracticeSession } from '../hooks/usePracticeSession'
import { useAnalyticsOverview } from '../queries/useAnalytics'
import { useStreak } from '../queries/useJournal'

export function DashboardPage() {
  const { data, isLoading } = useAnalyticsOverview()
  const { data: streak = 0 } = useStreak()
  const { isActive, feedback, lastAnalysis, error, start, stop } = usePracticeSession()

  async function handleToggle() {
    if (isActive) await stop()
    else await start(80)
  }

  const currentChord = feedback?.detectedChord
  const chordSequence = feedback?.chordSequence ?? []

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-slate-400">Play your guitar — chords are detected automatically.</p>
        </div>
        <span className="rounded-full bg-emerald-900 px-4 py-1 text-sm text-emerald-300">
          Streak: {streak} day{streak !== 1 ? 's' : ''}
        </span>
      </div>

      <section className="rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-900 to-slate-950 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-400">Now playing</p>
            <p className="mt-1 text-7xl font-bold tracking-tight text-white">
              {currentChord ?? '—'}
            </p>
            {isActive && (
              <p className="mt-2 text-sm text-slate-400">
                {currentChord
                  ? `${Math.round((feedback?.confidence ?? 0) * 100)}% match`
                  : 'Play a chord — hold it steady for a moment'}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleToggle}
            className={`rounded-xl px-6 py-3 font-semibold text-white transition ${
              isActive
                ? 'bg-red-600 hover:bg-red-500'
                : 'bg-emerald-600 hover:bg-emerald-500'
            }`}
          >
            {isActive ? 'Stop practice' : 'Start practice'}
          </button>
        </div>

        {isActive && (
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <Stat label="BPM" value={feedback?.bpmEstimate?.toString() ?? '—'} />
            <Stat label="Timing drift" value={feedback?.driftMs != null ? `${feedback.driftMs}ms` : '—'} />
            <Stat label="Chords played" value={String(chordSequence.length)} />
          </div>
        )}

        {chordSequence.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {chordSequence.map((chord, i) => (
              <span
                key={`${chord}-${i}`}
                className="rounded-lg bg-slate-800 px-3 py-1 text-sm font-medium text-slate-200"
              >
                {chord}
              </span>
            ))}
          </div>
        )}

        {feedback?.diagnosis && feedback.diagnosis.length > 0 && (
          <ul className="mt-4 space-y-2 rounded-xl bg-slate-800/50 p-4 text-sm text-slate-300">
            {feedback.diagnosis.map((d, i) => (
              <li key={i}>
                <span className="font-medium text-amber-300">{d.string} string</span> — {d.likelyCause}
              </li>
            ))}
          </ul>
        )}

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

        {lastAnalysis != null && (
          <p className="mt-4 text-sm text-emerald-300">
            Practice saved — journal and analytics updated automatically.
          </p>
        )}
      </section>

      {isLoading ? (
        <p className="text-slate-400">Loading analytics…</p>
      ) : data ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <ChartCard title="Transitions over time">
            <LineChart data={data.transitionsOverTime}>
              <CartesianGrid stroke="#334155" />
              <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 11 }} />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: 'none' }} />
              <Line type="monotone" dataKey="transitions" stroke="#34d399" />
            </LineChart>
          </ChartCard>

          <ChartCard title="Most practiced chords">
            <BarChart
              data={data.mostPracticedChords.map((c) => ({
                name: `${c.chordPair.from}↔${c.chordPair.to}`,
                count: c.count,
              }))}
            >
              <CartesianGrid stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: 'none' }} />
              <Bar dataKey="count" fill="#34d399" />
            </BarChart>
          </ChartCard>

          <ChartCard title="BPM progression" className="lg:col-span-2">
            <LineChart data={data.bpmProgression}>
              <CartesianGrid stroke="#334155" />
              <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 11 }} />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: 'none' }} />
              <Line type="monotone" dataKey="avgBpm" stroke="#60a5fa" />
            </LineChart>
          </ChartCard>
        </div>
      ) : null}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-800/60 p-4">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-2xl font-semibold text-white">{value}</p>
    </div>
  )
}

function ChartCard({
  title,
  children,
  className = '',
}: {
  title: string
  children: ReactElement
  className?: string
}) {
  return (
    <div className={`rounded-xl border border-slate-700 bg-slate-900 p-4 ${className}`}>
      <h2 className="mb-4 text-sm font-semibold text-slate-300">{title}</h2>
      <ResponsiveContainer width="100%" height={220}>
        {children}
      </ResponsiveContainer>
    </div>
  )
}
