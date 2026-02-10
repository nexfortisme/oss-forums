import { User } from '../../../shared/interfaces/user.interface'
import { db } from '../persistance/database'

export const getUserById = (userId: string): User | null => {
  const user = db.query('SELECT * FROM users WHERE id = ?').get(userId)
  if (!user) {
    return null
  }
  return user as User
}
