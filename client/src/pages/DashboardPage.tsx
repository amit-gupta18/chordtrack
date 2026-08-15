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
import { formatDurationLabel, formatTimer } from '../lib/chordDetection'
import { usePracticeSession } from '../hooks/usePracticeSession'
import { useAnalyticsOverview } from '../queries/useAnalytics'
import { useStreak } from '../queries/useJournal'
import { useSessions } from '../queries/useSessions'
import {
  SESSION_DURATION_PRESETS,
  usePracticeSettingsStore,
} from '../stores/usePracticeSettingsStore'

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
  const { data: sessions = [] } = useSessions()
  const { isActive, feedback, lastResult, error, start, stop } = usePracticeSession()
  const durationSeconds = usePracticeSettingsStore((s) => s.durationSeconds)
  const setDurationSeconds = usePracticeSettingsStore((s) => s.setDurationSeconds)

  async function handleToggle() {
    if (isActive) await stop()
    else await start(durationSeconds)
  }

  const currentChord = feedback?.detectedChord
  const chordSequence = feedback?.chordSequence ?? []
  const recentSessions = sessions.filter((s) => s.analysis).slice(0, 8)
  const activeDurationMs = feedback?.durationMs ?? durationSeconds * 1000
  const durationLabel = formatDurationLabel(durationSeconds)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="atlas-heading">Dashboard</h1>
          <p className="atlas-subtext">
            Timed chord practice — pick your session length, then we count switches, plays, and analyze your
            progression.
          </p>
        </div>
        <span className="atlas-badge">
          Streak: {streak} day{streak !== 1 ? 's' : ''}
        </span>
      </div>

      <section className="atlas-card-elevated overflow-hidden p-6">
        <div className="rounded-lg bg-atlas-blue-subtle p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm font-semibold uppercase tracking-wide text-atlas-blue">
                {isActive ? `${durationLabel} session` : 'Ready to practice'}
              </p>

              {isActive ? (
                <p className="mt-2 font-mono text-6xl font-bold tracking-tight text-atlas-navy">
                  {formatTimer(feedback?.remainingMs ?? activeDurationMs)}
                </p>
              ) : (
                <p className="mt-2 font-mono text-5xl font-bold tracking-tight text-atlas-navy">
                  {formatTimer(durationSeconds * 1000)}
                </p>
              )}

              <p className="mt-3 text-5xl font-bold tracking-tight text-atlas-navy">
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
              {isActive ? 'Stop early' : `Start ${durationLabel} session`}
            </button>
          </div>

          {!isActive && (
            <div className="mt-6 border-t border-atlas-blue/20 pt-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-atlas-muted">Session duration</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {SESSION_DURATION_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setDurationSeconds(preset)}
                    className={
                      durationSeconds === preset
                        ? 'rounded-md bg-atlas-blue px-3 py-1.5 text-sm font-semibold text-white'
                        : 'rounded-md border border-atlas-border bg-atlas-surface px-3 py-1.5 text-sm font-medium text-atlas-text hover:bg-atlas-bg'
                    }
                  >
                    {formatDurationLabel(preset)}
                  </button>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <label className="text-sm text-atlas-muted" htmlFor="session-duration">
                  Custom
                </label>
                <input
                  id="session-duration"
                  type="range"
                  min={30}
                  max={600}
                  step={15}
                  value={durationSeconds}
                  onChange={(e) => setDurationSeconds(Number(e.target.value))}
                  className="h-2 w-40 cursor-pointer accent-atlas-blue"
                />
                <span className="text-sm font-semibold text-atlas-navy">{durationLabel}</span>
              </div>
            </div>
          )}
        </div>

        {isActive && (
          <div className="mt-6 grid gap-4 sm:grid-cols-4">
            <Stat label="Time left" value={formatTimer(feedback?.remainingMs ?? 0)} />
            <Stat label="Chord switches" value={String(feedback?.switchCount ?? 0)} />
            <Stat label="Chords played" value={String(feedback?.chordPlays ?? 0)} />
            <Stat
              label="Elapsed"
              value={formatTimer(feedback?.elapsedMs ?? 0)}
            />
          </div>
        )}

        {chordSequence.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-atlas-muted">Live progression</p>
            <div className="flex flex-wrap gap-2">
              {chordSequence.map((chord, i) => (
                <span
                  key={`${chord}-${i}`}
                  className="rounded-md bg-atlas-blue-subtle px-3 py-1 text-sm font-semibold text-atlas-blue"
                >
                  {chord}
                </span>
              ))}
            </div>
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

        {lastResult && (
          <div className="mt-6 rounded-lg border border-atlas-border bg-atlas-surface p-5">
            <p className="text-sm font-semibold uppercase tracking-wide text-atlas-blue">Session summary</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-4">
              <Stat label="Duration" value={formatDurationLabel(lastResult.analysis.durationSeconds)} />
              <Stat label="Switches" value={String(lastResult.analysis.switchCount)} />
              <Stat label="Chords played" value={String(lastResult.analysis.chordPlays)} />
              <Stat
                label="Unique chords"
                value={lastResult.analysis.uniqueChords.join(', ') || '—'}
              />
            </div>

            {lastResult.analysis.detectedSequence.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {lastResult.analysis.detectedSequence.map((chord, i) => (
                  <span
                    key={`${chord}-${i}`}
                    className="rounded-md bg-atlas-blue-subtle px-3 py-1 text-sm font-semibold text-atlas-blue"
                  >
                    {chord}
                  </span>
                ))}
              </div>
            )}

            {lastResult.analysis.aiFeedback && (
              <div className="mt-4 rounded-lg bg-atlas-blue-subtle p-4 text-sm leading-relaxed text-atlas-text">
                <p className="mb-2 font-semibold text-atlas-navy">AI coach</p>
                <p className="whitespace-pre-wrap">{lastResult.analysis.aiFeedback}</p>
              </div>
            )}
          </div>
        )}
      </section>

      {recentSessions.length > 0 && (
        <section className="atlas-card p-5">
          <h2 className="text-sm font-semibold text-atlas-text">Recent practice sessions</h2>
          <ul className="mt-4 divide-y divide-atlas-border">
            {recentSessions.map((session) => (
              <li key={session._id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-atlas-navy">
                      {new Date(session.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    <p className="mt-1 text-sm text-atlas-muted">
                      {formatDurationLabel(session.analysis?.durationSeconds ?? session.durationSeconds)} ·{' '}
                      {session.analysis?.chordPlays ?? 0} plays · {session.analysis?.switchCount ?? 0} switches
                      {session.analysis?.uniqueChords.length
                        ? ` · ${session.analysis.uniqueChords.join(', ')}`
                        : ''}
                    </p>
                  </div>
                  {session.analysis?.detectedSequence.length ? (
                    <div className="flex flex-wrap gap-1">
                      {session.analysis.detectedSequence.map((chord, i) => (
                        <span
                          key={`${session._id}-${chord}-${i}`}
                          className="rounded bg-atlas-blue-subtle px-2 py-0.5 text-xs font-semibold text-atlas-blue"
                        >
                          {chord}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
                {session.analysis?.aiFeedback && (
                  <p className="mt-2 line-clamp-2 text-sm text-atlas-text">{session.analysis.aiFeedback}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

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
