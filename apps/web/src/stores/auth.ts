import type { JwtTokenResponse } from '@shared/interfaces/jwt-token-response.interface'
import type { User } from '@shared/interfaces/user.interface'
import { Role } from '@shared/interfaces/user.interface'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

type AuthStatus = 'idle' | 'loading' | 'error'

const apiBaseUrl = import.meta.env.API_BASE_URL ?? 'http://localhost:3000'
const excludedDomains =
  import.meta.env.VITE_EXCLUDED_DOMAINS?.split(',').map((domain: string) => domain.trim()) ?? []

export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref<User | null>(null)
  const status = ref<AuthStatus>('idle')
  const error = ref<string | null>(null)

  const currentUserId = computed(() => currentUser.value?.id ?? null)

  const role = computed<Role>(() => currentUser.value?.role ?? Role.VIEWER)
  const isAdmin = computed(() => role.value === Role.ADMIN)
  const canPost = computed(() => role.value === Role.ADMIN || role.value === Role.MEMBER)
  const canModerate = computed(() => role.value === Role.ADMIN)

  const isAuthenticated = computed(() => Boolean(currentUser.value))

  const isExcludedDomain = computed(() => {
    return excludedDomains.includes(window.location.hostname)
  })

  const setSession = (userPayload: User) => {
    if (!userPayload) {
      currentUser.value = null
      return
    }

    const rawUser = typeof userPayload === 'string' ? JSON.parse(userPayload) : userPayload

    currentUser.value = {
      id: rawUser.id,
      username: rawUser.username ?? 'Member',
      role: rawUser.role as Role,
      display_name: rawUser.display_name ?? 'Member',
    }
  }

  const refreshSession = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/auth/me`, {
        credentials: 'include',
      })

      console.log('response', response)

      if (!response.ok) {
        console.log('response not ok', response)
        currentUser.value = null
        return false
      }

      const data = (await response.json()) as JwtTokenResponse

      console.log('data', data)

      // This is some hoky bull shit. Fix this.
      setSession(JSON.parse(data.user as unknown as string) as User)
      return Boolean(currentUser.value)
    } catch (err) {
      console.log('error', err)
      currentUser.value = null
      // error.value = err instanceof Error ? err.message : 'Failed to load session.'
      return false
    }
  }

  const login = async (username: string, password: string) => {
    status.value = 'loading'
    error.value = null

    try {
      if (isExcludedDomain.value) {
        setNullSession()
        return false
      }

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
      if (isExcludedDomain.value) {
        setNullSession()
        return false
      }

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
      if (isExcludedDomain.value) {
        setNullSession()
        return false
      }

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

  const getUserById = (userId: string): User => {
    if (isExcludedDomain.value) {
      setNullSession()
      return null as unknown as User
    }

    return {
      id: userId,
      username: 'John Doe',
      display_name: 'John Doe',
      role: Role.ADMIN,
    } as User
  }

  const setNullSession = () => {
    setSession(null as unknown as User)
  }

  return {
    currentUserId,
    currentUser,
    role,
    isAdmin,
    canPost,
    canModerate,
    isAuthenticated,
    isExcludedDomain,
    status,
    error,
    login,
    logout,
    register,
    refreshSession,
    getUserById,
    setNullSession,
  }
})
