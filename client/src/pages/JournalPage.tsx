import { useJournalEntries, useStreak } from '../queries/useJournal'
import type { JournalEntry } from '../api/journal'

export function JournalPage() {
  const { data: entries = [], isLoading } = useJournalEntries()
  const { data: streak = 0 } = useStreak()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="atlas-heading">Practice Journal</h1>
          <p className="atlas-subtext">Auto-logged from your practice sessions.</p>
        </div>
        <span className="atlas-badge">
          Streak: {streak} day{streak !== 1 ? 's' : ''}
        </span>
      </div>

      {isLoading ? (
        <p className="atlas-subtext">Loading…</p>
      ) : entries.length === 0 ? (
        <p className="atlas-card p-6 text-atlas-muted">
          No practice logged yet. Start a session on the Dashboard and play — entries appear here automatically.
        </p>
      ) : (
        <ul className="space-y-3">
          {entries.map((entry: JournalEntry) => (
            <li key={entry._id} className="atlas-card p-4">
              <p className="text-sm font-medium text-atlas-muted">
                {new Date(entry.date).toLocaleDateString()}
              </p>
              <ul className="mt-2 space-y-1 text-sm text-atlas-navy">
                {entry.exercises.map((ex, i) => (
                  <li key={i}>{ex.name} — {ex.durationMinutes} min</li>
                ))}
              </ul>
              {entry.notes && (
                <p className="mt-3 whitespace-pre-wrap border-t border-atlas-border pt-3 text-sm text-atlas-text">
                  {entry.notes}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
