import { Context } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { pbkdf2Sync, randomBytes } from 'node:crypto'
import { db } from '../persistance/database'
import { sign, verify } from 'hono/jwt'
import { User } from '../../../shared/interfaces/user.interface'

const iterations = 100000 // Number of iterations (adjust for desired security and performance)
const keyLength = 64 // Length of the resulting key
const digest = 'sha256' // Hash algorithm

const PASSWORD_MIN_LENGTH = 8

export const register = async (c: Context) => {
  const requestBody = await c.req.json()

  const username = requestBody.username
  const password = requestBody.password

  const user = db.query('SELECT * FROM users WHERE username = ?').all(username)
  if (user.length > 0) {
    console.log('User already exists with that email or username', user)
    return c.text('User already exists with that email or username', 401)
  }

  const salt = randomBytes(16).toString('hex')
  const hashedPassword = pbkdf2Sync(password, salt, iterations, keyLength, digest).toString('hex')
  const userId = Bun.randomUUIDv7()

  db.query(
    'INSERT INTO users (id, username, display_name, role, password_hash, password_salt, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
  ).run(userId, username, username, 'member', hashedPassword, salt, new Date().toISOString())

  const newUser = db.query('SELECT * FROM users WHERE id = ?').all(userId)
  if (newUser.length === 0) {
    return c.text('Error Creating User ', 404)
  }

  console.log('newUser', newUser)

  return c.text('User created successfully')
}

export const login = async (c: Context) => {
  const requestBody = await c.req.json()

  console.log('Login Request Body', requestBody)

  const username = requestBody.username
  const password = requestBody.password

  // Checking to see if the user exists
  const user = db.query('SELECT * FROM users WHERE username = ?').all(username)
  if (user.length === 0) {
    console.log('User does not exist')
    return c.text('User does not exist', 401)
  }

  const userObj = user[0] as {
    id: string
    username: string
    display_name: string
    role: string
    password_hash: string
    password_salt: string
    created_at: string
  }
  console.log('user', userObj)

  // // Checking to see if the password is correct
  const hashedPassword = pbkdf2Sync(
    password,
    userObj.password_salt,
    iterations,
    keyLength,
    digest,
  ).toString('hex')
  if (userObj.password_hash !== hashedPassword) {
    console.log('Password is incorrect')
    return c.text('Password is incorrect', 401)
  }

  const payload = {
    iss: 'oss-forums',
    exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour
    user: JSON.stringify({
      id: userObj.id,
      username: userObj.username,
      display_name: userObj.display_name,
      role: userObj.role,
      created_at: userObj.created_at,
    }),
  }

  // Creating the JWT
  const userJWT = await sign(payload, Bun.env.JWT_SECRET as string, 'HS256')

  setCookie(c, 'auth_token', userJWT, {
    httpOnly: true,
    secure: true,
    sameSite: 'Strict',
    maxAge: 60 * 60,
    path: '/',
  })

  return c.text('Login successful')
}

export const logout = (c: Context) => {
  deleteCookie(c, 'auth_token')
  return c.text('Logout successful')
}

export const validate = async (c: Context) => {
  const token = getCookie(c, 'auth_token')

  if (!token) {
    return c.text('No token provided', 401)
  }

  try {
    const decoded = await verify(token, Bun.env.JWT_SECRET as string, 'HS256')

    console.log('Token is valid')

    return c.text('Token is valid', 200)
  } catch (_error) {
    return c.text('Invalid token', 401)
  }
}

// TODO - Update this with a DB call to return the user object, minus the password, salt and stuff like that
export const me = async (c: any) => {
  const token = getCookie(c, 'auth_token')
  if (!token) {
    return c.text('No token provided', 401)
  }
  const decoded = await verify(token, Bun.env.JWT_SECRET as string, 'HS256')
  return c.json(decoded)
}

// Gets the current user id from the bearer token
export const getCurrentUserId = async (c: Context) => {
  let token = c.req.header('Authorization') as string
  token = token.split(' ')[1]
  if (!token) {
    return null
  }
  const decoded = (await verify(token, Bun.env.JWT_SECRET as string, 'HS256')) as {
    iss: string
    exp: number
    user: string
  }
  console.log('Decoded Token', decoded)
  if (!decoded) {
    return null
  }
  const userObject = JSON.parse(decoded.user) as unknown as User
  if (!userObject) {
    return null
  }
  return userObject.id
}
