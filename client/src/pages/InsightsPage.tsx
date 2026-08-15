import { useInsights } from '../queries/useAnalytics'

export function InsightsPage() {
  const { data: insights, isLoading, refetch, isFetching } = useInsights()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">AI Insights</h1>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-50"
        >
          {isFetching ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-900 p-6">
        {isLoading ? (
          <p className="text-slate-400">Loading insights…</p>
        ) : (
          <p className="whitespace-pre-wrap leading-relaxed text-slate-200">{insights}</p>
        )}
      </div>
    </div>
  )
}
