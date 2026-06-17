import { useRouter } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { logout } from '@/lib/auth'

/**
 * Logout handler shared by every layout: clears auth, drops all cached queries
 * (so the next account never sees the previous one's data), and returns to login.
 */
export function useLogout() {
  const router = useRouter()
  const queryClient = useQueryClient()

  return function handleLogout() {
    logout()
    queryClient.clear()
    router.navigate({ to: '/login' })
  }
}
