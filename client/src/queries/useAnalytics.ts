import { useQuery } from '@tanstack/react-query'
import * as analyticsApi from '../api/analytics'

export function useAnalyticsOverview() {
  return useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: analyticsApi.getAnalyticsOverview,
  })
}

export function useInsights() {
  return useQuery({
    queryKey: ['insights'],
    queryFn: async () => (await analyticsApi.getInsights()).insights,
  })
}
