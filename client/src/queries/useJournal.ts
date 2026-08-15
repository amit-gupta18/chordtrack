import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as journalApi from '../api/journal'

export function useJournalEntries() {
  return useQuery({
    queryKey: ['journal'],
    queryFn: async () => (await journalApi.listJournalEntries()).entries,
  })
}

export function useStreak() {
  return useQuery({
    queryKey: ['journal', 'streak'],
    queryFn: async () => (await journalApi.getStreak()).streak,
  })
}

export function useCreateJournalEntry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: journalApi.createJournalEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal'] })
    },
  })
}
