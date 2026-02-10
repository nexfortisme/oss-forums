import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { Role, User } from '../types/auth'

type AuthStatus = 'idle' | 'loading' | 'error'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'

type MeResponse = {
  iss?: string
  exp?: number
  user?: string | {
    id: string
    username: string
    display_name: string
    role: string
    created_at: string
  }
}

export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref<User | null>(null)
  const status = ref<AuthStatus>('idle')
  const error = ref<string | null>(null)

  const currentUserId = computed(() => currentUser.value?.id ?? null)

  const role = computed<Role>(() => currentUser.value?.role ?? 'viewer')
  const isAdmin = computed(() => role.value === 'admin')
  const canPost = computed(() => role.value === 'admin' || role.value === 'member')
  const canModerate = computed(() => role.value === 'admin')

  const isAuthenticated = computed(() => Boolean(currentUser.value))

  const setSession = (userPayload: User) => {
    if (!userPayload) {
      currentUser.value = null
      return
    }

    const rawUser = typeof userPayload === 'string' ? JSON.parse(userPayload) : userPayload
    const name = rawUser.username ?? rawUser.email ?? 'Member'

    currentUser.value = {
      id: rawUser.id,
      name,
      role: rawUser.role as Role,
      title: rawUser.display_name,
    }
  }

  const refreshSession = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/auth/me`, {
        credentials: 'include',
      })

      if (!response.ok) {
        currentUser.value = null
        return false
      }

      const data = (await response.json()) as MeResponse

      console.log('data', data);

      setSession(JSON.parse(data.user as string) as User)
      return Boolean(currentUser.value)
    } catch (err) {
      currentUser.value = null
      error.value = err instanceof Error ? err.message : 'Failed to load session.'
      return false
    }
  }

  const login = async (username: string, password: string) => {
    status.value = 'loading'
    error.value = null

    try {
      const response = await fetch(`${apiBaseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          username: username,
          password: password,
        }),
      })

      if (!response.ok) {
        const message = await response.text()
        error.value = message || 'Login failed.'
        status.value = 'error'
        return false
      }

      await refreshSession()
      status.value = 'idle'
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Login failed.'
      status.value = 'error'
      return false
    }
  }

  const logout = async () => {
    status.value = 'loading'
    error.value = null

    try {
      await fetch(`${apiBaseUrl}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      })
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Logout failed.'
    } finally {
      currentUser.value = null
      status.value = 'idle'
    }
  }

  const register = async (payload: { username: string; email: string; password: string }) => {
    status.value = 'loading'
    error.value = null

    try {
      const response = await fetch(`${apiBaseUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const message = await response.text()
        error.value = message || 'Registration failed.'
        status.value = 'error'
        return false
      }

      status.value = 'idle'
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Registration failed.'
      status.value = 'error'
      return false
    }
  }

  return {
    currentUserId,
    currentUser,
    role,
    isAdmin,
    canPost,
    canModerate,
    isAuthenticated,
    status,
    error,
    login,
    logout,
    register,
    refreshSession,
  }
})
