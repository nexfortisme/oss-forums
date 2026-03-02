import type { User } from './user.interface'

export interface JwtTokenResponse {
  iss: string
  exp: number
  user: User | string
}

export interface LoginResponse {
  message: string
  userId: string
  token: string
}

export interface SessionBootstrapResponse {
  message: string
  token: string
  user: User
  privateKey?: string
  created: boolean
}

export interface PrivateKeyResponse {
  privateKey: string
}
