import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as sessionsApi from '../api/sessions'
import type { CreateSessionPayload } from '../api/sessions'

export function useSessions() {
  return useQuery({
    queryKey: ['sessions'],
    queryFn: async () => (await sessionsApi.listSessions()).sessions,
  })
}

export function useCreateSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateSessionPayload) => sessionsApi.createSession(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sessions'] }),
  })
}
