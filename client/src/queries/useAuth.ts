import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as authApi from '../api/auth'
import { clearToken, setToken } from '../lib/token'
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
  const setUser = useAuthStore((s) => s.setUser)
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setToken(data.token)
      setUser(data.user)
      queryClient.setQueryData(['auth', 'me'], data.user)
    },
  })
}

export function useRegister() {
  const queryClient = useQueryClient()
  const setUser = useAuthStore((s) => s.setUser)
  return useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      setToken(data.token)
      setUser(data.user)
      queryClient.setQueryData(['auth', 'me'], data.user)
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  const setUser = useAuthStore((s) => s.setUser)
  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      clearToken()
      setUser(null)
      queryClient.clear()
    },
  })
}
