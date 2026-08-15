import { useState } from 'react'
import { useCreateJournalEntry, useJournalEntries, useStreak } from '../queries/useJournal'
import type { JournalEntry } from '../api/journal'

export function JournalPage() {
  const { data: entries = [], isLoading } = useJournalEntries()
  const { data: streak = 0 } = useStreak()
  const createEntry = useCreateJournalEntry()
  const [name, setName] = useState('')
  const [duration, setDuration] = useState(15)
  const [notes, setNotes] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await createEntry.mutateAsync({
      date: new Date().toISOString(),
      exercises: [{ name, durationMinutes: duration }],
      notes,
    })
    setName('')
    setNotes('')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Practice Journal</h1>
        <span className="rounded-full bg-emerald-900 px-4 py-1 text-sm text-emerald-300">
          Streak: {streak} day{streak !== 1 ? 's' : ''}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-slate-700 bg-slate-900 p-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Exercise name"
          required
          className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white"
        />
        <input
          type="number"
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          placeholder="Duration (minutes)"
          min={1}
          className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white"
        />
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes"
          rows={3}
          className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white"
        />
        <button
          type="submit"
          disabled={createEntry.isPending}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          Add entry
        </button>
      </form>

      {isLoading ? (
        <p className="text-slate-400">Loading…</p>
      ) : (
        <ul className="space-y-3">
          {entries.map((entry: JournalEntry) => (
            <li key={entry._id} className="rounded-xl border border-slate-700 bg-slate-900 p-4">
              <p className="text-sm text-slate-400">{new Date(entry.date).toLocaleDateString()}</p>
              <ul className="mt-1 text-sm text-slate-200">
                {entry.exercises.map((ex, i: number) => (
                  <li key={i}>{ex.name} — {ex.durationMinutes} min</li>
                ))}
              </ul>
              {entry.notes && <p className="mt-2 text-sm text-slate-300">{entry.notes}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
