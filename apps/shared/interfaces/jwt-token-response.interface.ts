import type { User } from "./user.interface"

export interface JwtTokenResponse {
  iss: string
  exp: number
  user: User
}
