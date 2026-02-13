import type { User } from './user.interface'

export interface JwtTokenResponse {
  iss: string
  exp: number
  user: User
}

export interface LoginResponse {
  message: string
  userId: string
  token: string
}
