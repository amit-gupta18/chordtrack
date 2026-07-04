interface SwitchCounterProps {
  count: number
}

export function SwitchCounter({ count }: SwitchCounterProps) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/80 px-6 py-4 text-center">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        Successful Switches
      </p>
      <p className="mt-1 text-6xl font-bold tabular-nums text-cyan-300">{count}</p>
    </div>
  )
}
