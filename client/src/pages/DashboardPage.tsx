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

const CHART_GRID = '#DFE1E6'
const CHART_AXIS = '#6B778C'
const CHART_BLUE = '#0C66E4'
const CHART_TEAL = '#00B8D9'
const TOOLTIP_STYLE = {
  background: '#FFFFFF',
  border: '1px solid #DFE1E6',
  borderRadius: 6,
  color: '#172B4D',
  fontSize: 12,
}

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
          <h1 className="atlas-heading">Dashboard</h1>
          <p className="atlas-subtext">Play your guitar — chords are detected automatically.</p>
        </div>
        <span className="atlas-badge">
          Streak: {streak} day{streak !== 1 ? 's' : ''}
        </span>
      </div>

      <section className="atlas-card-elevated overflow-hidden p-6">
        <div className="rounded-lg bg-atlas-blue-subtle p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-atlas-blue">Now playing</p>
              <p className="mt-1 text-7xl font-bold tracking-tight text-atlas-navy">
                {currentChord ?? '—'}
              </p>
              {isActive && (
                <p className="mt-2 text-sm text-atlas-muted">
                  {currentChord
                    ? `${Math.round((feedback?.confidence ?? 0) * 100)}% match`
                    : 'Play a chord — hold it steady for a moment'}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={handleToggle}
              className={isActive ? 'atlas-btn-danger px-6 py-3' : 'atlas-btn-primary px-6 py-3'}
            >
              {isActive ? 'Stop practice' : 'Start practice'}
            </button>
          </div>
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
                className="rounded-md bg-atlas-blue-subtle px-3 py-1 text-sm font-semibold text-atlas-blue"
              >
                {chord}
              </span>
            ))}
          </div>
        )}

        {feedback?.diagnosis && feedback.diagnosis.length > 0 && (
          <ul className="mt-4 space-y-2 rounded-lg border border-atlas-warning/30 bg-[#FFFAE6] p-4 text-sm text-atlas-text">
            {feedback.diagnosis.map((d, i) => (
              <li key={i}>
                <span className="font-semibold text-atlas-warning">{d.string} string</span> — {d.likelyCause}
              </li>
            ))}
          </ul>
        )}

        {error && <p className="atlas-error mt-4">{error}</p>}

        {lastAnalysis != null && (
          <p className="atlas-success-text mt-4">
            Practice saved — journal and analytics updated automatically.
          </p>
        )}
      </section>

      {isLoading ? (
        <p className="atlas-subtext">Loading analytics…</p>
      ) : data ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <ChartCard title="Transitions over time">
            <LineChart data={data.transitionsOverTime}>
              <CartesianGrid stroke={CHART_GRID} />
              <XAxis dataKey="date" stroke={CHART_AXIS} tick={{ fontSize: 11 }} />
              <YAxis stroke={CHART_AXIS} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Line type="monotone" dataKey="transitions" stroke={CHART_BLUE} strokeWidth={2} dot={false} />
            </LineChart>
          </ChartCard>

          <ChartCard title="Most practiced chords">
            <BarChart
              data={data.mostPracticedChords.map((c) => ({
                name: `${c.chordPair.from}↔${c.chordPair.to}`,
                count: c.count,
              }))}
            >
              <CartesianGrid stroke={CHART_GRID} />
              <XAxis dataKey="name" stroke={CHART_AXIS} tick={{ fontSize: 11 }} />
              <YAxis stroke={CHART_AXIS} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="count" fill={CHART_BLUE} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartCard>

          <ChartCard title="BPM progression" className="lg:col-span-2">
            <LineChart data={data.bpmProgression}>
              <CartesianGrid stroke={CHART_GRID} />
              <XAxis dataKey="date" stroke={CHART_AXIS} tick={{ fontSize: 11 }} />
              <YAxis stroke={CHART_AXIS} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Line type="monotone" dataKey="avgBpm" stroke={CHART_TEAL} strokeWidth={2} dot={false} />
            </LineChart>
          </ChartCard>
        </div>
      ) : null}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-atlas-border bg-atlas-surface p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-atlas-muted">{label}</p>
      <p className="text-2xl font-semibold text-atlas-navy">{value}</p>
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
    <div className={`atlas-card p-4 ${className}`}>
      <h2 className="mb-4 text-sm font-semibold text-atlas-text">{title}</h2>
      <ResponsiveContainer width="100%" height={220}>
        {children}
      </ResponsiveContainer>
    </div>
  )
}
