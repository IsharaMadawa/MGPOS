// Password hashing utility using Web Crypto API
// Implements PBKDF2 with SHA-256 for secure password hashing

const SALT_LENGTH = 32
const ITERATIONS = 100000
const HASH_LENGTH = 32
const ALGORITHM = 'PBKDF2'

// Check if Web Crypto API is properly supported
const isWebCryptoSupported = () => {
  return typeof crypto !== 'undefined' && 
         crypto.subtle && 
         typeof crypto.subtle.importKey === 'function'
}

/**
 * Generate a random salt for password hashing
 */
async function generateSalt() {
  try {
    const arrayBuffer = new Uint8Array(SALT_LENGTH)
    crypto.getRandomValues(arrayBuffer)
    return Array.from(arrayBuffer).map(b => b.toString(16).padStart(2, '0')).join('')
  } catch (error) {
    // Fallback for environments without getRandomValues
    const crypto = await import('crypto')
    return crypto.randomBytes(SALT_LENGTH).toString('hex')
  }
}

/**
 * Fallback password hashing using Node.js crypto module (for non-browser environments)
 */
async function hashPasswordNode(password, salt = null) {
  if (!salt) {
    salt = await generateSalt()
  }

  const crypto = await import('crypto')
  const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, HASH_LENGTH, 'sha256')
  
  return { 
    hash: hash.toString('hex'), 
    salt 
  }
}

/**
 * Hash a password with PBKDF2
 * @param {string} password - The plain text password
 * @param {string} salt - The salt (optional, will generate if not provided)
 * @returns {Promise<{hash: string, salt: string}>}
 */
export async function hashPassword(password, salt = null) {
  if (!salt) {
    salt = await generateSalt()
  }

  // Use Web Crypto API if available, otherwise fallback to Node.js crypto
  if (isWebCryptoSupported()) {
    try {
      const encoder = new TextEncoder()
      const passwordBuffer = encoder.encode(password)
      const saltBuffer = encoder.encode(salt)

      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        passwordBuffer,
        { name: ALGORITHM },
        false,
        ['deriveBits']
      )

      const derivedBits = await crypto.subtle.deriveBits(
        {
          name: ALGORITHM,
          salt: saltBuffer,
          iterations: ITERATIONS,
          hash: 'SHA-256'
        },
        keyMaterial,
        HASH_LENGTH * 8
      )

      const hash = Array.from(new Uint8Array(derivedBits))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')

      return { hash, salt }
    } catch (error) {
      console.warn('Web Crypto API failed, falling back to Node.js crypto:', error.message)
      return await hashPasswordNode(password, salt)
    }
  } else {
    // Fallback for environments without Web Crypto API support
    console.warn('Web Crypto API not supported, using Node.js crypto fallback')
    return await hashPasswordNode(password, salt)
  }
}

/**
 * Verify a password against a stored hash
 * @param {string} password - The plain text password to verify
 * @param {string} storedHash - The stored hash
 * @param {string} storedSalt - The stored salt
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(password, storedHash, storedSalt) {
  const { hash } = await hashPassword(password, storedSalt)
  return hash === storedHash
}

/**
 * Legacy password verification for plaintext passwords (migration period)
 * @param {string} password - The plain text password to verify
 * @param {string} storedPassword - The stored password (could be hash or plaintext)
 * @param {string} storedSalt - The stored salt (if available)
 * @returns {Promise<boolean>}
 */
export async function verifyPasswordLegacy(password, storedPassword, storedSalt = null) {
  // If salt exists, assume it's a hashed password
  if (storedSalt) {
    return await verifyPassword(password, storedPassword, storedSalt)
  }
  
  // Otherwise, assume it's plaintext (legacy)
  return password === storedPassword
}
