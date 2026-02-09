export type Role = 'admin' | 'member' | 'viewer'

export type User = {
  id: string
  name: string
  role: Role
  title: string
}
