import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('Password Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Password hashing functions', () => {
    // Import the actual functions for testing
    let hashPassword, verifyPassword, verifyPasswordLegacy

    beforeAll(async () => {
      // We'll test the actual implementation by importing it
      const passwordUtils = await import('../../utils/passwordUtils.js')
      hashPassword = passwordUtils.hashPassword
      verifyPassword = passwordUtils.verifyPassword
      verifyPasswordLegacy = passwordUtils.verifyPasswordLegacy
    })

    describe('hashPassword', () => {
      it('should return hash and salt properties', async () => {
        const result = await hashPassword('testpassword')

        expect(result).toHaveProperty('hash')
        expect(result).toHaveProperty('salt')
        expect(typeof result.hash).toBe('string')
        expect(typeof result.salt).toBe('string')
        expect(result.salt.length).toBe(64) // 32 bytes = 64 hex chars
        expect(result.hash.length).toBe(64) // 32 bytes = 64 hex chars
      })

      it('should use provided salt', async () => {
        const providedSalt = 'abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234'

        const result = await hashPassword('testpassword', providedSalt)

        expect(result.salt).toBe(providedSalt)
      })

      it('should generate consistent hashes for same password and salt', async () => {
        const password = 'testpassword'
        const salt = 'testsalt123testsalt123testsalt123testsalt123testsalt123testsalt123'

        const result1 = await hashPassword(password, salt)
        const result2 = await hashPassword(password, salt)

        expect(result1.hash).toBe(result2.hash)
        expect(result1.salt).toBe(result2.salt)
      })

      it('should generate different salts for different calls', async () => {
        const result1 = await hashPassword('password1')
        const result2 = await hashPassword('password2')

        expect(result1.salt).not.toBe(result2.salt)
      })

      it('should handle empty password', async () => {
        const result = await hashPassword('')

        expect(result).toHaveProperty('hash')
        expect(result).toHaveProperty('salt')
      })
    })

    describe('verifyPassword', () => {
      it('should verify correct password', async () => {
        const password = 'testpassword'
        const salt = 'testsalt123testsalt123testsalt123testsalt123testsalt123testsalt123'
        
        // First, hash the password to get the correct hash
        const { hash: correctHash } = await hashPassword(password, salt)

        // Then verify it
        const result = await verifyPassword(password, correctHash, salt)

        expect(result).toBe(true)
      })

      it('should reject incorrect password', async () => {
        const password = 'testpassword'
        const wrongPassword = 'wrongpassword'
        const salt = 'testsalt123testsalt123testsalt123testsalt123testsalt123testsalt123'
        
        // First, hash the correct password
        const { hash: correctHash } = await hashPassword(password, salt)

        // Then try to verify with wrong password
        const result = await verifyPassword(wrongPassword, correctHash, salt)

        expect(result).toBe(false)
      })

      it('should handle empty password', async () => {
        const password = ''
        const salt = 'testsalt123testsalt123testsalt123testsalt123testsalt123testsalt123'
        
        // First, hash the empty password
        const { hash: correctHash } = await hashPassword(password, salt)

        // Then verify it
        const result = await verifyPassword(password, correctHash, salt)

        expect(result).toBe(true)
      })
    })

    describe('verifyPasswordLegacy', () => {
      it('should verify hashed password with salt', async () => {
        const password = 'testpassword'
        const salt = 'testsalt123testsalt123testsalt123testsalt123testsalt123testsalt123'
        
        // First, hash the password to get the correct hash
        const { hash: storedHash } = await hashPassword(password, salt)

        const result = await verifyPasswordLegacy(password, storedHash, salt)

        expect(result).toBe(true)
      })

      it('should verify plaintext password without salt', async () => {
        const password = 'testpassword'
        const storedPassword = 'testpassword'
        const salt = null

        const result = await verifyPasswordLegacy(password, storedPassword, salt)

        expect(result).toBe(true)
      })

      it('should reject incorrect plaintext password', async () => {
        const password = 'wrongpassword'
        const storedPassword = 'testpassword'
        const salt = null

        const result = await verifyPasswordLegacy(password, storedPassword, salt)

        expect(result).toBe(false)
      })

      it('should reject incorrect hashed password', async () => {
        const password = 'wrongpassword'
        const correctPassword = 'testpassword'
        const salt = 'testsalt123testsalt123testsalt123testsalt123testsalt123testsalt123'
        
        // First, hash the correct password
        const { hash: storedHash } = await hashPassword(correctPassword, salt)

        const result = await verifyPasswordLegacy(password, storedHash, salt)

        expect(result).toBe(false)
      })

      it('should handle empty salt as plaintext', async () => {
        const password = 'testpassword'
        const storedPassword = 'testpassword'
        const salt = ''

        const result = await verifyPasswordLegacy(password, storedPassword, salt)

        expect(result).toBe(true)
      })
    })

    describe('Password migration scenario', () => {
      it('should handle migration from plaintext to hashed', async () => {
        const password = 'testpassword'
        const plaintextPassword = 'testpassword'
        const salt = null

        // Should verify as plaintext when no salt
        const result = await verifyPasswordLegacy(password, plaintextPassword, salt)

        expect(result).toBe(true)
      })

      it('should handle already hashed passwords', async () => {
        const password = 'testpassword'
        const salt = 'testsalt123testsalt123testsalt123testsalt123testsalt123testsalt123'
        
        // First, hash the password to get the correct hash
        const { hash: hashedPassword } = await hashPassword(password, salt)

        const result = await verifyPasswordLegacy(password, hashedPassword, salt)

        expect(result).toBe(true)
      })
    })

    describe('Security edge cases', () => {
      it('should handle very long passwords', async () => {
        const longPassword = 'a'.repeat(1000)
        const salt = 'testsalt123testsalt123testsalt123testsalt123testsalt123testsalt123'

        const result = await hashPassword(longPassword, salt)

        expect(result).toHaveProperty('hash')
        expect(result).toHaveProperty('salt')
        expect(result.hash.length).toBeGreaterThanOrEqual(64)
        expect(result.salt.length).toBeGreaterThanOrEqual(64)
      })

      it('should handle special characters in passwords', async () => {
        const specialPassword = '!@#$%^&*()_+-=[]{}|;:,.<>?'
        const salt = 'testsalt123testsalt123testsalt123testsalt123testsalt123testsalt123'

        const result = await hashPassword(specialPassword, salt)

        expect(result).toHaveProperty('hash')
        expect(result).toHaveProperty('salt')
      })

      it('should handle unicode characters in passwords', async () => {
        const unicodePassword = '🔐🔑🔒'
        const salt = 'testsalt123testsalt123testsalt123testsalt123testsalt123testsalt123'

        const result = await hashPassword(unicodePassword, salt)

        expect(result).toHaveProperty('hash')
        expect(result).toHaveProperty('salt')
      })
    })
  })
})
