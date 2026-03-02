import type {
  JwtTokenResponse,
  LoginResponse,
  PrivateKeyResponse,
  SessionBootstrapResponse,
} from '@shared/interfaces/jwt-token-response.interface'
import type { User } from '@shared/interfaces/user.interface'
import { Role } from '@shared/interfaces/user.interface'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

type AuthStatus = 'idle' | 'loading' | 'error'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'
const excludedDomains =
  import.meta.env.VITE_EXCLUDED_DOMAINS?.split(',').map((domain: string) => domain.trim()) ?? []

const DEVICE_ID_STORAGE_KEY = 'oss_forums_device_id'
const PRIVATE_KEY_STORAGE_KEY = 'oss_forums_private_key'
const SESSION_FINGERPRINT_VERSION = 'v1'
const PRIVATE_KEY_ENCRYPTION_VERSION = 1
const PRIVATE_KEY_KDF_ITERATIONS = 250000
const PRIVATE_KEY_PASSPHRASE_MIN_LENGTH = 8

type EncryptedPrivateKeyFile = {
  version: number
  issuer: string
  exportedAt: string
  encrypted: true
  algorithm: 'AES-GCM'
  tagLength?: number
  kdf: {
    name: 'PBKDF2'
    hash: 'SHA-256'
    iterations: number
    salt: string
  }
  iv: string
  ciphertext: string
}

const bytesToHex = (bytes: Uint8Array) => {
  return Array.from(bytes)
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('')
}

const digestText = async (value: string) => {
  if (!crypto?.subtle) {
    let hash = 0
    for (const character of value) {
      hash = (hash << 5) - hash + character.charCodeAt(0)
      hash |= 0
    }

    const hex = Math.abs(hash).toString(16).padStart(8, '0')
    return (hex + hex + hex + hex + hex + hex + hex + hex).slice(0, 64)
  }

  const payload = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', payload)
  return bytesToHex(new Uint8Array(digest))
}

const bytesToBase64 = (bytes: Uint8Array) => {
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }

  return btoa(binary)
}

const base64ToBytes = (value: string) => {
  const binary = atob(value)
  const output = new Uint8Array(binary.length)

  for (let index = 0; index < binary.length; index += 1) {
    output[index] = binary.charCodeAt(index)
  }

  return output
}

const bytesToArrayBuffer = (bytes: Uint8Array) => {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
}

const normalizePassphraseInput = (value: string) => {
  let normalized = value.trim()

  if (normalized.includes(':') && normalized.toLowerCase().includes('passphrase')) {
    normalized = normalized.slice(normalized.lastIndexOf(':') + 1).trim()
  }

  if (
    (normalized.startsWith('[') && normalized.endsWith(']')) ||
    (normalized.startsWith('"') && normalized.endsWith('"')) ||
    (normalized.startsWith("'") && normalized.endsWith("'")) ||
    (normalized.startsWith('`') && normalized.endsWith('`'))
  ) {
    normalized = normalized.slice(1, -1).trim()
  }

  return normalized
}

const assertWebCrypto = () => {
  if (!crypto?.subtle) {
    throw new Error('Web Crypto API is required for private key encryption.')
  }
}

const deriveEncryptionKey = async (passphrase: string, salt: Uint8Array, iterations: number) => {
  assertWebCrypto()

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey'],
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: bytesToArrayBuffer(salt),
      iterations,
    },
    keyMaterial,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false,
    ['encrypt', 'decrypt'],
  )
}

const encryptPrivateKey = async (privateKey: string, passphrase: string): Promise<EncryptedPrivateKeyFile> => {
  assertWebCrypto()

  const normalizedPassphrase = normalizePassphraseInput(passphrase)
  if (normalizedPassphrase.length < PRIVATE_KEY_PASSPHRASE_MIN_LENGTH) {
    throw new Error(
      `Passphrase must be at least ${PRIVATE_KEY_PASSPHRASE_MIN_LENGTH} characters to encrypt your private key.`,
    )
  }

  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const aesKey = await deriveEncryptionKey(normalizedPassphrase, salt, PRIVATE_KEY_KDF_ITERATIONS)
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: bytesToArrayBuffer(iv) },
    aesKey,
    bytesToArrayBuffer(new TextEncoder().encode(privateKey)),
  )

  return {
    version: PRIVATE_KEY_ENCRYPTION_VERSION,
    issuer: 'oss-forums',
    exportedAt: new Date().toISOString(),
    encrypted: true,
    algorithm: 'AES-GCM',
    tagLength: 128,
    kdf: {
      name: 'PBKDF2',
      hash: 'SHA-256',
      iterations: PRIVATE_KEY_KDF_ITERATIONS,
      salt: bytesToBase64(salt),
    },
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(encrypted)),
  }
}

const isEncryptedPrivateKeyFile = (value: unknown): value is EncryptedPrivateKeyFile => {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Partial<EncryptedPrivateKeyFile>
  return (
    candidate.encrypted === true &&
    candidate.algorithm === 'AES-GCM' &&
    !!candidate.kdf &&
    candidate.kdf.name === 'PBKDF2' &&
    candidate.kdf.hash === 'SHA-256' &&
    typeof candidate.kdf.iterations === 'number' &&
    typeof candidate.kdf.salt === 'string' &&
    typeof candidate.iv === 'string' &&
    typeof candidate.ciphertext === 'string'
  )
}

const decryptPrivateKey = async (payload: EncryptedPrivateKeyFile, passphrase: string) => {
  assertWebCrypto()

  const normalizedPassphrase = normalizePassphraseInput(passphrase)
  if (!normalizedPassphrase) {
    throw new Error('Passphrase is required to decrypt this private key file.')
  }

  const salt = base64ToBytes(payload.kdf.salt)
  const iv = base64ToBytes(payload.iv)
  const ciphertext = base64ToBytes(payload.ciphertext)
  const aesKey = await deriveEncryptionKey(normalizedPassphrase, salt, payload.kdf.iterations)

  try {
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: bytesToArrayBuffer(iv),
        tagLength: payload.tagLength ?? 128,
      },
      aesKey,
      bytesToArrayBuffer(ciphertext),
    )

    return new TextDecoder().decode(new Uint8Array(decrypted)).trim()
  } catch {
    throw new Error('Unable to decrypt private key. Check the passphrase and try again.')
  }
}

const normalizePrivateKeyInput = async (value: string, passphrase = '') => {
  const raw = value.trim()
  if (!raw) {
    return ''
  }

  if (raw.startsWith('{')) {
    let parsed: { privateKey?: unknown } | EncryptedPrivateKeyFile

    try {
      parsed = JSON.parse(raw) as { privateKey?: unknown } | EncryptedPrivateKeyFile
    } catch {
      return raw
    }

    if (typeof parsed === 'object' && parsed && 'privateKey' in parsed) {
      if (typeof parsed.privateKey === 'string') {
        return parsed.privateKey.trim()
      }
    }

    if (isEncryptedPrivateKeyFile(parsed)) {
      return decryptPrivateKey(parsed, passphrase)
    }
  }

  return raw
}

export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref<User | null>(null)
  const status = ref<AuthStatus>('idle')
  const error = ref<string | null>(null)
  const demoMode = ref(false)

  const currentUserId = computed(() => currentUser.value?.id ?? null)
  const role = computed<Role>(() => currentUser.value?.role ?? Role.VIEWER)
  const isAdmin = computed(() => role.value === Role.ADMIN)
  const canPost = computed(() => role.value === Role.ADMIN || role.value === Role.MEMBER)
  const canModerate = computed(() => role.value === Role.ADMIN)
  const isAuthenticated = computed(() => Boolean(currentUser.value))

  const isExcludedDomain = computed(() => {
    return excludedDomains.includes(window.location.hostname) || demoMode.value
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
      display_name: rawUser.display_name ?? rawUser.username ?? 'Member',
    }
  }

  const setNullSession = () => {
    setSession(null as unknown as User)
  }

  const getOrCreateDeviceId = () => {
    let deviceId = localStorage.getItem(DEVICE_ID_STORAGE_KEY)
    if (!deviceId) {
      deviceId = crypto.randomUUID()
      localStorage.setItem(DEVICE_ID_STORAGE_KEY, deviceId)
    }
    return deviceId
  }

  const buildSessionFingerprint = async (deviceId: string) => {
    const sessionParts = [
      SESSION_FINGERPRINT_VERSION,
      deviceId,
      navigator.userAgent,
      navigator.language,
      navigator.platform ?? 'unknown-platform',
      Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'unknown-timezone',
      String(navigator.hardwareConcurrency ?? 0),
      `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`,
    ]

    return digestText(sessionParts.join('|'))
  }

  const provisionSession = async (privateKeyOverride?: string) => {
    const deviceId = getOrCreateDeviceId()
    const sessionFingerprint = await buildSessionFingerprint(deviceId)
    const storedPrivateKey = localStorage.getItem(PRIVATE_KEY_STORAGE_KEY) ?? undefined
    const privateKey = privateKeyOverride ?? storedPrivateKey

    const response = await fetch(`${apiBaseUrl}/auth/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        deviceId,
        sessionFingerprint,
        privateKey,
      }),
    })

    if (!response.ok) {
      const message = await response.text()
      error.value = message || 'Failed to restore session.'
      currentUser.value = null
      return false
    }

    const data = (await response.json()) as SessionBootstrapResponse
    sessionStorage.setItem('auth_token', data.token)

    if (data.privateKey) {
      localStorage.setItem(PRIVATE_KEY_STORAGE_KEY, data.privateKey)
    } else if (privateKey) {
      localStorage.setItem(PRIVATE_KEY_STORAGE_KEY, privateKey)
    }

    setSession(data.user)
    return Boolean(currentUser.value)
  }

  const refreshSession = async () => {
    status.value = 'loading'
    error.value = null

    try {
      if (isExcludedDomain.value) {
        setNullSession()
        status.value = 'idle'
        return false
      }

      const authToken = sessionStorage.getItem('auth_token')
      if (authToken) {
        const response = await fetch(`${apiBaseUrl}/auth/me`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        })

        if (response.ok) {
          const data = (await response.json()) as JwtTokenResponse
          const userPayload =
            typeof data.user === 'string' ? (JSON.parse(data.user) as User) : data.user
          setSession(userPayload)
          status.value = 'idle'
          return Boolean(currentUser.value)
        }

        sessionStorage.removeItem('auth_token')
      }

      const sessionProvisioned = await provisionSession()
      status.value = sessionProvisioned ? 'idle' : 'error'
      return sessionProvisioned
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load session.'
      currentUser.value = null
      demoMode.value = true
      status.value = 'error'
      return false
    }
  }

  const login = async (username: string, password: string) => {
    status.value = 'loading'
    error.value = null

    try {
      if (isExcludedDomain.value) {
        setNullSession()
        status.value = 'idle'
        return false
      }

      const response = await fetch(`${apiBaseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          username,
          password,
        }),
      })

      if (!response.ok) {
        const message = await response.text()
        error.value = message || 'Login failed.'
        status.value = 'error'
        return false
      }

      const data = (await response.json()) as LoginResponse
      sessionStorage.setItem('auth_token', data.token)
      await refreshSession()
      status.value = 'idle'
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Login failed.'
      status.value = 'error'
      return false
    }
  }

  const requestPrivateKey = async () => {
    const authToken = sessionStorage.getItem('auth_token')
    if (!authToken) {
      return null
    }

    const response = await fetch(`${apiBaseUrl}/auth/private-key`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      credentials: 'include',
    })

    if (!response.ok) {
      return null
    }

    const data = (await response.json()) as PrivateKeyResponse
    localStorage.setItem(PRIVATE_KEY_STORAGE_KEY, data.privateKey)
    return data.privateKey
  }

  const downloadPrivateKey = async (passphrase: string) => {
    status.value = 'loading'
    error.value = null

    try {
      let privateKey = localStorage.getItem(PRIVATE_KEY_STORAGE_KEY)

      if (!privateKey) {
        privateKey = await requestPrivateKey()
      }

      if (!privateKey) {
        error.value = 'No private key available for this session.'
        status.value = 'error'
        return false
      }

      const encryptedPayload = await encryptPrivateKey(privateKey, passphrase)
      const filePayload = JSON.stringify(encryptedPayload, null, 2)

      const blob = new Blob([filePayload], { type: 'application/json' })
      const objectUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = 'oss-forums-private-key.encrypted.json'
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(objectUrl)

      status.value = 'idle'
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to download private key.'
      status.value = 'error'
      return false
    }
  }

  const reauthenticateWithPrivateKey = async (privateKeyInput: string, passphrase = '') => {
    status.value = 'loading'
    error.value = null

    const previousPrivateKey = localStorage.getItem(PRIVATE_KEY_STORAGE_KEY)
    let privateKey = ''

    try {
      privateKey = await normalizePrivateKeyInput(privateKeyInput, passphrase)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Private key authentication failed.'
      status.value = 'error'
      return false
    }

    if (!privateKey) {
      error.value = 'Private key is required.'
      status.value = 'error'
      return false
    }

    localStorage.setItem(PRIVATE_KEY_STORAGE_KEY, privateKey)
    sessionStorage.removeItem('auth_token')

    try {
      const success = await provisionSession(privateKey)
      if (!success) {
        if (previousPrivateKey) {
          localStorage.setItem(PRIVATE_KEY_STORAGE_KEY, previousPrivateKey)
        } else {
          localStorage.removeItem(PRIVATE_KEY_STORAGE_KEY)
        }
        status.value = 'error'
        return false
      }

      status.value = 'idle'
      return true
    } catch (err) {
      if (previousPrivateKey) {
        localStorage.setItem(PRIVATE_KEY_STORAGE_KEY, previousPrivateKey)
      } else {
        localStorage.removeItem(PRIVATE_KEY_STORAGE_KEY)
      }
      error.value = err instanceof Error ? err.message : 'Private key authentication failed.'
      status.value = 'error'
      return false
    }
  }

  const register = async (payload: { username: string; email: string; password: string }) => {
    status.value = 'loading'
    error.value = null

    try {
      if (isExcludedDomain.value) {
        setNullSession()
        status.value = 'idle'
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
    register,
    refreshSession,
    getUserById,
    setNullSession,
    downloadPrivateKey,
    reauthenticateWithPrivateKey,
  }
})
