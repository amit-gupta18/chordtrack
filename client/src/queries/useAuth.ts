import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as authApi from '../api/auth'
import { useAuthStore } from '../stores/useAuthStore'

export function useMe() {
  const setUser = useAuthStore((s) => s.setUser)
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const data = await authApi.getMe()
      setUser(data.user)
      return data.user
    },
    retry: false,
  })
}

export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ['auth', 'me'] })
    },
  })
}

export function useRegister() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: authApi.register,
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ['auth', 'me'] })
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  const setUser = useAuthStore((s) => s.setUser)
  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      setUser(null)
      queryClient.clear()
    },
  })
}
