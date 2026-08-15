import { useJournalEntries, useStreak } from '../queries/useJournal'
import type { JournalEntry } from '../api/journal'

export function JournalPage() {
  const { data: entries = [], isLoading } = useJournalEntries()
  const { data: streak = 0 } = useStreak()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Practice Journal</h1>
          <p className="text-sm text-slate-400">Auto-logged from your practice sessions.</p>
        </div>
        <span className="rounded-full bg-emerald-900 px-4 py-1 text-sm text-emerald-300">
          Streak: {streak} day{streak !== 1 ? 's' : ''}
        </span>
      </div>

      {isLoading ? (
        <p className="text-slate-400">Loading…</p>
      ) : entries.length === 0 ? (
        <p className="rounded-xl border border-slate-700 bg-slate-900 p-6 text-slate-400">
          No practice logged yet. Start a session on the Dashboard and play — entries appear here automatically.
        </p>
      ) : (
        <ul className="space-y-3">
          {entries.map((entry: JournalEntry) => (
            <li key={entry._id} className="rounded-xl border border-slate-700 bg-slate-900 p-4">
              <p className="text-sm text-slate-400">{new Date(entry.date).toLocaleDateString()}</p>
              <ul className="mt-2 space-y-1 text-sm text-slate-200">
                {entry.exercises.map((ex, i) => (
                  <li key={i}>{ex.name} — {ex.durationMinutes} min</li>
                ))}
              </ul>
              {entry.notes && (
                <p className="mt-3 whitespace-pre-wrap text-sm text-slate-300">{entry.notes}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
