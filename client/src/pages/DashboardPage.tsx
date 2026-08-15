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
import { useAnalyticsOverview } from '../queries/useAnalytics'
import { useStreak } from '../queries/useJournal'

export function DashboardPage() {
  const { data, isLoading } = useAnalyticsOverview()
  const { data: streak = 0 } = useStreak()

  if (isLoading) return <p className="text-slate-400">Loading analytics…</p>
  if (!data) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Analytics Dashboard</h1>
        <span className="rounded-full bg-emerald-900 px-4 py-1 text-sm text-emerald-300">
          Streak: {streak} days
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
          <h2 className="mb-4 text-sm font-semibold text-slate-300">Transitions over time</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data.transitionsOverTime}>
              <CartesianGrid stroke="#334155" />
              <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 11 }} />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: 'none' }} />
              <Line type="monotone" dataKey="transitions" stroke="#34d399" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
          <h2 className="mb-4 text-sm font-semibold text-slate-300">Most practiced chord pairs</h2>
          <ResponsiveContainer width="100%" height={220}>
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
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-900 p-4 lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-slate-300">BPM progression</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data.bpmProgression}>
              <CartesianGrid stroke="#334155" />
              <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 11 }} />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: 'none' }} />
              <Line type="monotone" dataKey="avgBpm" stroke="#60a5fa" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
