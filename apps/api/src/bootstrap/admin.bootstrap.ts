import { createCipheriv, createHash, pbkdf2Sync, randomBytes } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { Role } from '../../../shared/interfaces/user.interface'
import { db } from '../persistance/database'

const passwordHashIterations = 100000
const passwordHashKeyLength = 64
const passwordHashDigest = 'sha256'

const privateKeyFileVersion = 1
const privateKeyKdfIterations = 250000
const privateKeyKdfDigest = 'sha256'

type EncryptedAdminPrivateKeyFile = {
  version: number
  issuer: string
  exportedAt: string
  encrypted: true
  algorithm: 'AES-GCM'
  tagLength: number
  kdf: {
    name: 'PBKDF2'
    hash: 'SHA-256'
    iterations: number
    salt: string
  }
  iv: string
  ciphertext: string
}

const generateAlphaNumeric = (length: number) => {
  const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let output = ''

  while (output.length < length) {
    const bytes = randomBytes(length)
    for (const value of bytes) {
      output += alphabet[value % alphabet.length]
      if (output.length >= length) {
        break
      }
    }
  }

  return output
}

const generatePassphrase = () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
  const segment = (size: number) => {
    let output = ''
    while (output.length < size) {
      const bytes = randomBytes(size)
      for (const value of bytes) {
        output += alphabet[value % alphabet.length]
        if (output.length >= size) {
          break
        }
      }
    }
    return output
  }

  return `${segment(6)}-${segment(6)}-${segment(6)}-${segment(6)}`
}

const hashValue = (value: string) => {
  return createHash('sha256').update(value).digest('hex')
}

const encryptPrivateKeyForBootstrap = (
  privateKey: string,
  passphrase: string,
): EncryptedAdminPrivateKeyFile => {
  const salt = randomBytes(16)
  const iv = randomBytes(12)
  const derivedKey = pbkdf2Sync(passphrase, salt, privateKeyKdfIterations, 32, privateKeyKdfDigest)
  const cipher = createCipheriv('aes-256-gcm', derivedKey, iv)
  const encrypted = Buffer.concat([cipher.update(privateKey, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  const ciphertextWithAuthTag = Buffer.concat([encrypted, authTag])

  return {
    version: privateKeyFileVersion,
    issuer: 'oss-forums',
    exportedAt: new Date().toISOString(),
    encrypted: true,
    algorithm: 'AES-GCM',
    tagLength: 128,
    kdf: {
      name: 'PBKDF2',
      hash: 'SHA-256',
      iterations: privateKeyKdfIterations,
      salt: salt.toString('base64'),
    },
    iv: iv.toString('base64'),
    ciphertext: ciphertextWithAuthTag.toString('base64'),
  }
}

const readBootstrapFilePath = () => {
  const configuredPath = Bun.env.ADMIN_BOOTSTRAP_KEY_PATH?.trim()
  if (configuredPath) {
    return resolve(configuredPath)
  }

  return resolve(process.cwd(), 'bootstrap-secrets', 'admin-private-key.encrypted.json')
}

export const ensureInitialAdminUser = async () => {
  const userCountRow = db.query('SELECT COUNT(*) AS count FROM users').get() as { count: number } | null
  const userCount = userCountRow?.count ?? 0

  if (userCount > 0) {
    return
  }

  const userId = Bun.randomUUIDv7()
  const username = `admin-${generateAlphaNumeric(8)}`
  const displayName = 'Administrator'
  const pseudoPassword = randomBytes(48).toString('hex')
  const passwordSalt = randomBytes(16).toString('hex')
  const passwordHash = pbkdf2Sync(
    pseudoPassword,
    passwordSalt,
    passwordHashIterations,
    passwordHashKeyLength,
    passwordHashDigest,
  ).toString('hex')
  const privateKey = randomBytes(48).toString('base64url')
  const privateKeyHash = hashValue(privateKey)
  const decryptionPassphrase = generatePassphrase()
  const encryptedPrivateKeyFile = encryptPrivateKeyForBootstrap(privateKey, decryptionPassphrase)
  const bootstrapFilePath = readBootstrapFilePath()

  db.query(
    'INSERT INTO users (id, username, display_name, role, password_hash, password_salt, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
  ).run(userId, username, displayName, Role.ADMIN, passwordHash, passwordSalt, new Date().toISOString())

  db.query(
    'INSERT INTO user_private_keys (id, user_id, key_hash, created_at, last_used_at, revoked_at) VALUES (?, ?, ?, ?, ?, ?)',
  ).run(
    Bun.randomUUIDv7(),
    userId,
    privateKeyHash,
    new Date().toISOString(),
    new Date().toISOString(),
    null,
  )

  try {
    await mkdir(dirname(bootstrapFilePath), { recursive: true })
    await writeFile(bootstrapFilePath, JSON.stringify(encryptedPrivateKeyFile, null, 2), {
      encoding: 'utf8',
      mode: 0o600,
    })
  } catch (error) {
    db.query('DELETE FROM user_private_keys WHERE user_id = ?').run(userId)
    db.query('DELETE FROM users WHERE id = ?').run(userId)
    throw error
  }

  console.log('==============================================================')
  console.log('Initial admin account has been provisioned.')
  console.log(`Admin username: ${username}`)
  console.log(`Encrypted private key file: ${bootstrapFilePath}`)
  console.log(`Private key decryption passphrase (copy exactly): [${decryptionPassphrase}]`)
  console.log(
    'Store this passphrase safely. It is shown only during initial admin provisioning.',
  )
  console.log('==============================================================')
}
