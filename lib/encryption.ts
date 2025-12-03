import crypto from 'crypto'

// Use environment variable or default for development
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'dev-key-change-in-production-32char'
const ALGORITHM = 'aes-256-gcm'

// Validate encryption key in production
if (process.env.NODE_ENV === 'production' && ENCRYPTION_KEY === 'dev-key-change-in-production-32char') {
  throw new Error('ENCRYPTION_KEY environment variable must be set in production')
}

/**
 * Encrypts a string using AES-256-GCM
 */
export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY.slice(0, 32)),
    iv
  )
  
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const authTag = cipher.getAuthTag()
  
  return JSON.stringify({
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  })
}

/**
 * Decrypts a string encrypted with encrypt()
 */
export function decrypt(encryptedData: string): string {
  const { encrypted, iv, authTag } = JSON.parse(encryptedData)
  
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY.slice(0, 32)),
    Buffer.from(iv, 'hex')
  )
  
  decipher.setAuthTag(Buffer.from(authTag, 'hex'))
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}

/**
 * Encrypts credentials object with sensitive fields
 */
export function encryptCredentials(credentials: {
  apiKey?: string
  clientId?: string
  clientSecret?: string
  accessToken?: string
  refreshToken?: string
  expiresAt?: number
  [key: string]: any
}): string {
  // Encrypt sensitive fields only
  const encrypted: any = { ...credentials }
  
  if (credentials.apiKey) {
    encrypted.apiKey = encrypt(credentials.apiKey)
  }
  if (credentials.clientSecret) {
    encrypted.clientSecret = encrypt(credentials.clientSecret)
  }
  if (credentials.accessToken) {
    encrypted.accessToken = encrypt(credentials.accessToken)
  }
  if (credentials.refreshToken) {
    encrypted.refreshToken = encrypt(credentials.refreshToken)
  }
  
  // Mark as encrypted for future decryption
  encrypted._encrypted = true
  encrypted._encryptedAt = new Date().toISOString()
  
  return JSON.stringify(encrypted)
}

/**
 * Decrypts credentials object
 */
export function decryptCredentials(encryptedData: string | any): any {
  // Handle already parsed objects
  const data = typeof encryptedData === 'string' 
    ? JSON.parse(encryptedData) 
    : encryptedData
  
  // Handle legacy unencrypted data
  if (!data._encrypted) {
    console.warn('Credentials not encrypted - legacy data detected')
    return data
  }
  
  const decrypted: any = { ...data }
  
  // Decrypt each sensitive field
  if (data.apiKey) {
    try {
      decrypted.apiKey = decrypt(data.apiKey)
    } catch (e) {
      console.error('Failed to decrypt apiKey:', e)
      decrypted.apiKey = null
    }
  }
  if (data.clientSecret) {
    try {
      decrypted.clientSecret = decrypt(data.clientSecret)
    } catch (e) {
      console.error('Failed to decrypt clientSecret:', e)
      decrypted.clientSecret = null
    }
  }
  if (data.accessToken) {
    try {
      decrypted.accessToken = decrypt(data.accessToken)
    } catch (e) {
      console.error('Failed to decrypt accessToken:', e)
      decrypted.accessToken = null
    }
  }
  if (data.refreshToken) {
    try {
      decrypted.refreshToken = decrypt(data.refreshToken)
    } catch (e) {
      console.error('Failed to decrypt refreshToken:', e)
      decrypted.refreshToken = null
    }
  }
  
  // Remove encryption metadata
  delete decrypted._encrypted
  delete decrypted._encryptedAt
  
  return decrypted
}

/**
 * Test if encryption is working correctly
 */
export function testEncryption(): boolean {
  try {
    const testData = 'test-secret-token-12345'
    const encrypted = encrypt(testData)
    const decrypted = decrypt(encrypted)
    return testData === decrypted
  } catch (error) {
    console.error('Encryption test failed:', error)
    return false
  }
}


