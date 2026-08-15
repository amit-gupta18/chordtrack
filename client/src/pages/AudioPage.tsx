import { useState } from 'react'
import { useCreateSession } from '../queries/useSessions'
import { useAudioCapture } from '../hooks/useAudioCapture'

export function AudioPage() {
  const createSession = useCreateSession()
  const { isCapturing, feedback, error, start, stop, finish } = useAudioCapture()
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const [bpm, setBpm] = useState(80)

  async function handleStart() {
    const { session } = await createSession.mutateAsync({
      type: 'chordTransition',
      chordPair: { from: 'A', to: 'D' },
      bpm,
      durationSeconds: 60,
      transitionsCompleted: 0,
    })
    setSessionId(session._id)
    await start(session._id, ['A', 'D', 'A', 'D'], bpm)
  }

  async function handleStop() {
    if (!sessionId) return
    const analysis = await finish(sessionId)
    setResult(JSON.stringify(analysis, null, 2))
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-white">Live Audio Analyzer</h1>
      <p className="text-sm text-slate-400">
        Mic captures audio, streams pitch data to the server for chord matching and rhythm feedback.
      </p>

      <label className="flex items-center gap-2 text-sm text-slate-300">
        Target BPM
        <input
          type="number"
          min={40}
          max={200}
          value={bpm}
          onChange={(e) => setBpm(Number(e.target.value))}
          className="w-20 rounded border border-slate-600 bg-slate-800 px-2 py-1 text-white"
        />
      </label>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleStart}
          disabled={isCapturing || createSession.isPending}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          Start
        </button>
        <button
          type="button"
          onClick={handleStop}
          disabled={!isCapturing}
          className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-50"
        >
          Stop & analyze
        </button>
        <button
          type="button"
          onClick={stop}
          className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
        >
          Cancel
        </button>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {feedback && (
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-4 text-sm text-slate-200">
          <p>Detected chord: {feedback.detectedChord ?? '—'}</p>
          <p>BPM estimate: {feedback.bpmEstimate ?? '—'}</p>
          <p>Drift: {feedback.driftMs != null ? `${feedback.driftMs}ms` : '—'}</p>
          {feedback.diagnosis.length > 0 && (
            <ul className="mt-2 list-disc pl-4">
              {feedback.diagnosis.map((d, i) => (
                <li key={i}>{d.string} string on {d.chord}: {d.likelyCause}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {result && (
        <pre className="overflow-auto rounded-xl border border-slate-700 bg-slate-900 p-4 text-xs text-slate-300">
          {result}
        </pre>
      )}
    </div>
  )
}
