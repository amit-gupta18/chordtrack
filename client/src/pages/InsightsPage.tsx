import { useInsights } from '../queries/useAnalytics'

export function InsightsPage() {
  const { data: insights, isLoading, refetch, isFetching } = useInsights()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="atlas-heading">AI Insights</h1>
          <p className="atlas-subtext">Personalized coaching from your practice history.</p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="atlas-btn-secondary"
        >
          {isFetching ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      <div className="atlas-card p-6">
        {isLoading ? (
          <p className="atlas-subtext">Loading insights…</p>
        ) : (
          <p className="whitespace-pre-wrap leading-relaxed text-atlas-text">{insights}</p>
        )}
      </div>
    </div>
  )
}
