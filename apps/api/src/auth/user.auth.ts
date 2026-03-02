import { Context } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { createHash, pbkdf2Sync, randomBytes } from 'node:crypto'
import { sign, verify } from 'hono/jwt'
import { Role, User } from '../../../shared/interfaces/user.interface'
import { db } from '../persistance/database'

const iterations = 100000
const keyLength = 64
const digest = 'sha256'
const PASSWORD_MIN_LENGTH = 8
const AUTO_USERNAME_LENGTH = 12
const JWT_TTL_SECONDS = 60 * 60

const disallowedUsernameTerms = [
  'ass',
  'bitch',
  'cunt',
  'dick',
  'fag',
  'fuck',
  'nigger',
  'penis',
  'porn',
  'pussy',
  'shit',
  'slut',
  'whore',
]

type DbUser = {
  id: string
  username: string
  display_name: string
  role: Role
  password_hash: string
  password_salt: string
  created_at: string
}

type AuthTokenPayload = {
  iss: string
  exp: number
  user: string
}

type ParsedTokenUser = {
  id: string
  username: string
  display_name?: string
  role: Role
}

type BootstrapSessionRequest = {
  deviceId?: string
  sessionFingerprint?: string
  privateKey?: string
}

const readJwtSecret = () => {
  const secret = Bun.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET is not configured')
  }
  return secret
}

const hashValue = (value: string) => createHash('sha256').update(value).digest('hex')

const generateRandomAlphaNumeric = (length: number) => {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let output = ''

  while (output.length < length) {
    const bytes = randomBytes(length)
    for (const byte of bytes) {
      output += alphabet[byte % alphabet.length]
      if (output.length >= length) {
        break
      }
    }
  }

  return output
}

const containsDisallowedTerm = (value: string) => {
  const lower = value.toLowerCase()
  return disallowedUsernameTerms.some((term) => lower.includes(term))
}

const getUserByIdRecord = (userId: string) => {
  return db.query('SELECT * FROM users WHERE id = ?').get(userId) as DbUser | null
}

const getUserByUsernameRecord = (username: string) => {
  return db.query('SELECT * FROM users WHERE username = ?').get(username) as DbUser | null
}

const toPublicUser = (user: DbUser): User => {
  return {
    id: user.id,
    username: user.username,
    display_name: user.display_name,
    role: user.role,
    created_at: user.created_at,
  }
}

const parseTokenUser = (decoded: unknown): ParsedTokenUser | null => {
  if (!decoded || typeof decoded !== 'object') {
    return null
  }

  const payload = decoded as { user?: unknown }
  if (typeof payload.user !== 'string') {
    return null
  }

  try {
    const parsed = JSON.parse(payload.user) as {
      id?: unknown
      username?: unknown
      display_name?: unknown
      role?: unknown
    }

    if (
      typeof parsed.id !== 'string' ||
      typeof parsed.username !== 'string' ||
      typeof parsed.role !== 'string'
    ) {
      return null
    }

    const displayName = typeof parsed.display_name === 'string' ? parsed.display_name : undefined

    return {
      id: parsed.id,
      username: parsed.username,
      display_name: displayName,
      role: parsed.role as Role,
    }
  } catch {
    return null
  }
}

const buildAuthTokenPayload = (user: DbUser): AuthTokenPayload => {
  return {
    iss: 'oss-forums',
    exp: Math.floor(Date.now() / 1000) + JWT_TTL_SECONDS,
    user: JSON.stringify({
      id: user.id,
      username: user.username,
      display_name: user.display_name,
      role: user.role,
    }),
  }
}

const setAuthCookie = (c: Context, authToken: string) => {
  setCookie(c, 'auth_token', authToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'Strict',
    maxAge: JWT_TTL_SECONDS,
    path: '/',
  })
}

const readAuthTokenFromRequest = (c: Context) => {
  const authHeader = c.req.header('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7).trim()
  }

  return getCookie(c, 'auth_token') ?? null
}

const signAuthToken = async (c: Context, user: DbUser) => {
  const payload = buildAuthTokenPayload(user)
  const authToken = await sign(payload, readJwtSecret(), 'HS256')
  setAuthCookie(c, authToken)
  return authToken
}

const generateSafeAutoUsername = () => {
  for (let attempt = 0; attempt < 128; attempt++) {
    const candidate = generateRandomAlphaNumeric(AUTO_USERNAME_LENGTH)

    if (containsDisallowedTerm(candidate)) {
      continue
    }

    const existingUser = getUserByUsernameRecord(candidate)
    if (!existingUser) {
      return candidate
    }
  }

  const fallback = `user${Bun.randomUUIDv7().replace(/-/g, '').slice(0, 10)}`
  if (containsDisallowedTerm(fallback)) {
    return `user${Date.now().toString(36)}`
  }

  return fallback
}

const createProvisionedUser = () => {
  const username = generateSafeAutoUsername()
  const pseudoPassword = randomBytes(48).toString('hex')
  const salt = randomBytes(16).toString('hex')
  const hashedPassword = pbkdf2Sync(pseudoPassword, salt, iterations, keyLength, digest).toString('hex')
  const userId = Bun.randomUUIDv7()
  const createdAt = new Date().toISOString()

  db.query(
    'INSERT INTO users (id, username, display_name, role, password_hash, password_salt, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
  ).run(userId, username, username, Role.MEMBER, hashedPassword, salt, createdAt)

  const user = getUserByIdRecord(userId)
  if (!user) {
    throw new Error('Failed to auto-provision user')
  }

  return user
}

const createPrivateKeyForUser = (userId: string) => {
  for (let attempt = 0; attempt < 5; attempt++) {
    const privateKey = randomBytes(48).toString('base64url')
    const keyHash = hashValue(privateKey)
    const now = new Date().toISOString()

    try {
      db.query(
        'INSERT INTO user_private_keys (id, user_id, key_hash, created_at, last_used_at, revoked_at) VALUES (?, ?, ?, ?, ?, ?)',
      ).run(Bun.randomUUIDv7(), userId, keyHash, now, now, null)

      return privateKey
    } catch (_error) {
      // Retry on the rare case of a hash collision.
    }
  }

  throw new Error('Failed to generate private key')
}

const getUserByPrivateKey = (privateKey: string) => {
  const keyHash = hashValue(privateKey)
  const user = db
    .query(
      `
      SELECT users.*
      FROM user_private_keys
      INNER JOIN users ON users.id = user_private_keys.user_id
      WHERE user_private_keys.key_hash = ?
      AND user_private_keys.revoked_at IS NULL
      LIMIT 1
      `,
    )
    .get(keyHash) as DbUser | null

  if (!user) {
    return null
  }

  db.query('UPDATE user_private_keys SET last_used_at = ? WHERE key_hash = ?').run(
    new Date().toISOString(),
    keyHash,
  )

  return user
}

const getUserByDeviceSession = (deviceId: string, sessionFingerprint: string) => {
  return db
    .query(
      `
      SELECT users.*
      FROM device_sessions
      INNER JOIN users ON users.id = device_sessions.user_id
      WHERE device_sessions.device_id = ?
      AND device_sessions.session_fingerprint = ?
      LIMIT 1
      `,
    )
    .get(deviceId, sessionFingerprint) as DbUser | null
}

const upsertDeviceSession = (userId: string, deviceId: string, sessionFingerprint: string) => {
  const now = new Date().toISOString()

  db.query(
    `
    INSERT INTO device_sessions (id, user_id, device_id, session_fingerprint, created_at, last_seen_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT (device_id, session_fingerprint)
    DO UPDATE SET user_id = excluded.user_id, last_seen_at = excluded.last_seen_at
    `,
  ).run(Bun.randomUUIDv7(), userId, deviceId, sessionFingerprint, now, now)
}

export const register = async (c: Context) => {
  const requestBody = await c.req.json()

  const username = typeof requestBody.username === 'string' ? requestBody.username.trim() : ''
  const password = typeof requestBody.password === 'string' ? requestBody.password : ''

  if (!username) {
    return c.text('Username is required', 400)
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    return c.text(`Password must be at least ${PASSWORD_MIN_LENGTH} characters`, 400)
  }

  const user = getUserByUsernameRecord(username)
  if (user) {
    return c.text('User already exists with that email or username', 401)
  }

  const salt = randomBytes(16).toString('hex')
  const hashedPassword = pbkdf2Sync(password, salt, iterations, keyLength, digest).toString('hex')
  const userId = Bun.randomUUIDv7()

  db.query(
    'INSERT INTO users (id, username, display_name, role, password_hash, password_salt, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
  ).run(userId, username, username, Role.MEMBER, hashedPassword, salt, new Date().toISOString())

  const newUser = getUserByIdRecord(userId)
  if (!newUser) {
    return c.text('Error creating user', 404)
  }

  return c.text('User created successfully')
}

export const login = async (c: Context) => {
  const requestBody = await c.req.json()

  const username = typeof requestBody.username === 'string' ? requestBody.username.trim() : ''
  const password = typeof requestBody.password === 'string' ? requestBody.password : ''

  if (!username || !password) {
    return c.text('Username and password are required', 400)
  }

  const userObj = getUserByUsernameRecord(username)
  if (!userObj) {
    return c.text('User does not exist', 401)
  }

  const hashedPassword = pbkdf2Sync(
    password,
    userObj.password_salt,
    iterations,
    keyLength,
    digest,
  ).toString('hex')

  if (userObj.password_hash !== hashedPassword) {
    return c.text('Password is incorrect', 401)
  }

  const authToken = await signAuthToken(c, userObj)

  return c.json({
    message: 'Login successful',
    userId: userObj.id,
    token: authToken,
  })
}

export const bootstrapSession = async (c: Context) => {
  const requestBody = (await c.req.json().catch(() => null)) as BootstrapSessionRequest | null
  const deviceId = typeof requestBody?.deviceId === 'string' ? requestBody.deviceId.trim() : ''
  const sessionFingerprint =
    typeof requestBody?.sessionFingerprint === 'string' ? requestBody.sessionFingerprint.trim() : ''
  const privateKey = typeof requestBody?.privateKey === 'string' ? requestBody.privateKey.trim() : ''

  if (!deviceId || !sessionFingerprint) {
    return c.text('Invalid session payload', 400)
  }

  const normalizedFingerprint = hashValue(`${deviceId}:${sessionFingerprint}`)
  let user = privateKey ? getUserByPrivateKey(privateKey) : null

  if (!user) {
    user = getUserByDeviceSession(deviceId, normalizedFingerprint)
  }

  let created = false
  let privateKeyForResponse: string | undefined

  if (!user) {
    user = createProvisionedUser()
    created = true
    privateKeyForResponse = createPrivateKeyForUser(user.id)
  } else if (privateKey) {
    privateKeyForResponse = privateKey
  }

  upsertDeviceSession(user.id, deviceId, normalizedFingerprint)

  const authToken = await signAuthToken(c, user)

  return c.json({
    message: created ? 'User provisioned successfully' : 'Session authenticated',
    token: authToken,
    user: toPublicUser(user),
    privateKey: privateKeyForResponse,
    created,
  })
}

export const issuePrivateKey = async (c: Context) => {
  const token = readAuthTokenFromRequest(c)
  if (!token) {
    return c.text('No token provided', 401)
  }

  try {
    const decoded = await verify(token, readJwtSecret(), 'HS256')
    const userPayload = parseTokenUser(decoded)

    if (!userPayload) {
      return c.text('Unauthorized', 401)
    }

    const user = getUserByIdRecord(userPayload.id)
    if (!user) {
      return c.text('User does not exist', 404)
    }

    const privateKey = createPrivateKeyForUser(user.id)

    return c.json({ privateKey })
  } catch (_error) {
    return c.text('Invalid token', 401)
  }
}

export const logout = (c: Context) => {
  deleteCookie(c, 'auth_token')
  return c.text('Logout successful')
}

export const validate = async (c: Context) => {
  const token = readAuthTokenFromRequest(c)

  if (!token) {
    return c.text('No token provided', 401)
  }

  try {
    await verify(token, readJwtSecret(), 'HS256')
    return c.text('Token is valid', 200)
  } catch (_error) {
    return c.text('Invalid token', 401)
  }
}

export const me = async (c: Context) => {
  const token = readAuthTokenFromRequest(c)
  if (!token) {
    return c.text('No token provided', 401)
  }

  try {
    const decoded = await verify(token, readJwtSecret(), 'HS256')
    return c.json(decoded)
  } catch (_error) {
    return c.text('Invalid token', 401)
  }
}

export const getCurrentUserId = async (c: Context) => {
  const token = readAuthTokenFromRequest(c)
  if (!token) {
    return null
  }

  try {
    const decoded = (await verify(token, readJwtSecret(), 'HS256')) as AuthTokenPayload
    const userObject = parseTokenUser(decoded)
    if (!userObject) {
      return null
    }

    return userObject.id
  } catch {
    return null
  }
}
