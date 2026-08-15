import type { SelfReport } from '../api/sessions'

interface SelfReportFormProps {
  onSubmit: (report: SelfReport) => void
  isSubmitting?: boolean
}

export function SelfReportForm({ onSubmit, isSubmitting }: SelfReportFormProps) {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    onSubmit({
      notesRangClearly: form.get('notesRangClearly') === 'on',
      fingersRelaxed: form.get('fingersRelaxed') === 'on',
      usedAnchorFinger: form.get('usedAnchorFinger') === 'on',
      rhythmSteady: form.get('rhythmSteady') === 'on',
    })
  }

  const fields = [
    { name: 'notesRangClearly', label: 'Notes rang clearly' },
    { name: 'fingersRelaxed', label: 'Fingers felt relaxed' },
    { name: 'usedAnchorFinger', label: 'Used anchor finger' },
    { name: 'rhythmSteady', label: 'Rhythm felt steady' },
  ] as const

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-slate-700 bg-slate-900 p-4">
      <h3 className="font-semibold text-white">How did it feel?</h3>
      {fields.map((f) => (
        <label key={f.name} className="flex items-center gap-2 text-sm text-slate-300">
          <input type="checkbox" name={f.name} className="rounded border-slate-600" />
          {f.label}
        </label>
      ))}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-emerald-600 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
      >
        {isSubmitting ? 'Saving…' : 'Save session'}
      </button>
    </form>
  )
}
