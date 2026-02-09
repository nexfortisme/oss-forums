import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { User } from '../types/auth'

const seedUsers: User[] = [
  {
    id: 'user-admin',
    name: 'Avery James',
    role: 'admin',
    title: 'Community Lead',
  },
  {
    id: 'user-member-1',
    name: 'Riley Park',
    role: 'member',
    title: 'Product Engineer',
  },
  {
    id: 'user-member-2',
    name: 'Alex Nguyen',
    role: 'member',
    title: 'Support Engineer',
  },
  {
    id: 'user-viewer',
    name: 'Guest Observer',
    role: 'viewer',
    title: 'Read-only',
  },
]

export const useAuthStore = defineStore('auth', () => {
  const users = ref<User[]>([...seedUsers])
  const currentUserId = ref<string | null>(users.value[0]?.id ?? null)

  const currentUser = computed(() =>
    users.value.find((user) => user.id === currentUserId.value) ?? null,
  )

  const role = computed(() => currentUser.value?.role ?? 'viewer')
  const isAdmin = computed(() => role.value === 'admin')
  const canPost = computed(() => role.value === 'admin' || role.value === 'member')
  const canModerate = computed(() => role.value === 'admin')

  const login = (userId: string) => {
    currentUserId.value = userId
  }

  const logout = () => {
    currentUserId.value = null
  }

  const getUserById = (userId: string) => users.value.find((user) => user.id === userId)

  return {
    users,
    currentUserId,
    currentUser,
    role,
    isAdmin,
    canPost,
    canModerate,
    login,
    logout,
    getUserById,
  }
})
