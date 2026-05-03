import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock Web Crypto API for testing
const mockWebCrypto = {
  subtle: {
    importKey: vi.fn(),
    deriveBits: vi.fn()
  },
  getRandomValues: vi.fn()
}

// Mock Node.js crypto module
const mockNodeCrypto = {
  randomBytes: vi.fn(),
  pbkdf2Sync: vi.fn()
}

describe('Password Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Reset global crypto mock
    global.crypto = mockWebCrypto
    
    // Mock crypto module import
    vi.doMock('crypto', () => mockNodeCrypto)
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
      it('should generate salt when not provided', async () => {
        // Mock Web Crypto API
        mockWebCrypto.getRandomValues.mockReturnValue(new Uint8Array([1, 2, 3, 4]))
        mockWebCrypto.subtle.importKey.mockResolvedValue({})
        mockWebCrypto.subtle.deriveBits.mockResolvedValue(
          new Uint8Array([10, 20, 30, 40])
        )

        const result = await hashPassword('testpassword')

        expect(result).toHaveProperty('hash')
        expect(result).toHaveProperty('salt')
        expect(typeof result.hash).toBe('string')
        expect(typeof result.salt).toBe('string')
        expect(mockWebCrypto.getRandomValues).toHaveBeenCalled()
      })

      it('should use provided salt', async () => {
        const providedSalt = 'abcd1234'
        mockWebCrypto.subtle.importKey.mockResolvedValue({})
        mockWebCrypto.subtle.deriveBits.mockResolvedValue(
          new Uint8Array([10, 20, 30, 40])
        )

        const result = await hashPassword('testpassword', providedSalt)

        expect(result.hash).toBe('0a141e28')
        expect(result.salt).toBe(providedSalt)
      })

      it('should fallback to Node.js crypto when Web Crypto fails', async () => {
        // Mock Web Crypto failure
        mockWebCrypto.subtle.importKey.mockRejectedValue(new Error('Web Crypto failed'))
        
        // Mock Node.js crypto
        mockNodeCrypto.randomBytes.mockReturnValue(Buffer.from('12345678', 'hex'))
        mockNodeCrypto.pbkdf2Sync.mockReturnValue(Buffer.from('abcdef123456', 'hex'))

        const result = await hashPassword('testpassword')

        expect(result.hash).toBe('abcdef123456')
        expect(result.salt).toBe('12345678')
        expect(mockNodeCrypto.randomBytes).toHaveBeenCalled()
        expect(mockNodeCrypto.pbkdf2Sync).toHaveBeenCalled()
      })

      it('should fallback to Node.js crypto when Web Crypto not supported', async () => {
        // Mock unsupported environment
        global.crypto = undefined

        mockNodeCrypto.randomBytes.mockReturnValue(Buffer.from('87654321', 'hex'))
        mockNodeCrypto.pbkdf2Sync.mockReturnValue(Buffer.from('fedcba654321', 'hex'))

        const result = await hashPassword('testpassword')

        expect(result.hash).toBe('fedcba654321')
        expect(result.salt).toBe('87654321')
      })

      it('should generate consistent hashes for same password and salt', async () => {
        const password = 'testpassword'
        const salt = 'testsalt123'

        mockWebCrypto.subtle.importKey.mockResolvedValue({})
        mockWebCrypto.subtle.deriveBits.mockResolvedValue(
          new Uint8Array([50, 60, 70, 80])
        )

        const result1 = await hashPassword(password, salt)
        const result2 = await hashPassword(password, salt)

        expect(result1.hash).toBe(result2.hash)
        expect(result1.salt).toBe(result2.salt)
      })

      it('should generate different salts for different calls', async () => {
        mockWebCrypto.getRandomValues
          .mockReturnValueOnce(new Uint8Array([1, 2, 3, 4]))
          .mockReturnValueOnce(new Uint8Array([5, 6, 7, 8]))

        mockWebCrypto.subtle.importKey.mockResolvedValue({})
        mockWebCrypto.subtle.deriveBits.mockResolvedValue(
          new Uint8Array([10, 20, 30, 40])
        )

        const result1 = await hashPassword('password1')
        const result2 = await hashPassword('password2')

        expect(result1.salt).not.toBe(result2.salt)
      })

      it('should handle empty password', async () => {
        mockWebCrypto.getRandomValues.mockReturnValue(new Uint8Array([1, 1, 1, 1]))
        mockWebCrypto.subtle.importKey.mockResolvedValue({})
        mockWebCrypto.subtle.deriveBits.mockResolvedValue(
          new Uint8Array([5, 5, 5, 5])
        )

        const result = await hashPassword('')

        expect(result).toHaveProperty('hash')
        expect(result).toHaveProperty('salt')
        expect(result.hash).toBe('05050505')
      })
    })

    describe('verifyPassword', () => {
      it('should verify correct password', async () => {
        const password = 'testpassword'
        const salt = 'testsalt123'
        const correctHash = 'abcdef123456'

        mockWebCrypto.subtle.importKey.mockResolvedValue({})
        mockWebCrypto.subtle.deriveBits.mockResolvedValue(
          new Uint8Array([171, 205, 239, 18, 54, 86]) // hex: abdef123456
        )

        const result = await verifyPassword(password, correctHash, salt)

        expect(result).toBe(true)
      })

      it('should reject incorrect password', async () => {
        const password = 'wrongpassword'
        const salt = 'testsalt123'
        const correctHash = 'abcdef123456'

        mockWebCrypto.subtle.importKey.mockResolvedValue({})
        mockWebCrypto.subtle.deriveBits.mockResolvedValue(
          new Uint8Array([100, 200, 300, 400]) // Different hash
        )

        const result = await verifyPassword(password, correctHash, salt)

        expect(result).toBe(false)
      })

      it('should handle empty password', async () => {
        const password = ''
        const salt = 'testsalt123'
        const hash = 'emptyhash123'

        mockWebCrypto.subtle.importKey.mockResolvedValue({})
        mockWebCrypto.subtle.deriveBits.mockResolvedValue(
          new Uint8Array([101, 109, 112, 116, 121, 104, 97, 115, 104, 49, 50, 51])
        )

        const result = await verifyPassword(password, hash, salt)

        expect(result).toBe(true)
      })
    })

    describe('verifyPasswordLegacy', () => {
      it('should verify hashed password with salt', async () => {
        const password = 'testpassword'
        const storedHash = 'abcdef123456'
        const salt = 'testsalt123'

        mockWebCrypto.subtle.importKey.mockResolvedValue({})
        mockWebCrypto.subtle.deriveBits.mockResolvedValue(
          new Uint8Array([171, 205, 239, 18, 54, 86])
        )

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
        const storedHash = 'abcdef123456'
        const salt = 'testsalt123'

        mockWebCrypto.subtle.importKey.mockResolvedValue({})
        mockWebCrypto.subtle.deriveBits.mockResolvedValue(
          new Uint8Array([100, 200, 300, 400])
        )

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
        const hashedPassword = 'abcdef123456'
        const salt = 'testsalt123'

        mockWebCrypto.subtle.importKey.mockResolvedValue({})
        mockWebCrypto.subtle.deriveBits.mockResolvedValue(
          new Uint8Array([171, 205, 239, 18, 54, 86])
        )

        const result = await verifyPasswordLegacy(password, hashedPassword, salt)

        expect(result).toBe(true)
      })
    })

    describe('Security edge cases', () => {
      it('should handle very long passwords', async () => {
        const longPassword = 'a'.repeat(1000)
        const salt = 'testsalt123'

        mockWebCrypto.getRandomValues.mockReturnValue(new Uint8Array(32))
        mockWebCrypto.subtle.importKey.mockResolvedValue({})
        mockWebCrypto.subtle.deriveBits.mockResolvedValue(new Uint8Array(32))

        const result = await hashPassword(longPassword, salt)

        expect(result).toHaveProperty('hash')
        expect(result).toHaveProperty('salt')
        expect(result.hash.length).toBeGreaterThan(0)
      })

      it('should handle special characters in passwords', async () => {
        const specialPassword = '!@#$%^&*()_+-=[]{}|;:,.<>?'
        const salt = 'testsalt123'

        mockWebCrypto.getRandomValues.mockReturnValue(new Uint8Array(32))
        mockWebCrypto.subtle.importKey.mockResolvedValue({})
        mockWebCrypto.subtle.deriveBits.mockResolvedValue(new Uint8Array(32))

        const result = await hashPassword(specialPassword, salt)

        expect(result).toHaveProperty('hash')
        expect(result).toHaveProperty('salt')
      })

      it('should handle unicode characters in passwords', async () => {
        const unicodePassword = '🔐🔑🔒'
        const salt = 'testsalt123'

        mockWebCrypto.getRandomValues.mockReturnValue(new Uint8Array(32))
        mockWebCrypto.subtle.importKey.mockResolvedValue({})
        mockWebCrypto.subtle.deriveBits.mockResolvedValue(new Uint8Array(32))

        const result = await hashPassword(unicodePassword, salt)

        expect(result).toHaveProperty('hash')
        expect(result).toHaveProperty('salt')
      })
    })
  })

  describe('Password migration functions', () => {
    let verifyAndMigratePassword, migrateUserPassword

    beforeAll(async () => {
      const migrationUtils = await import('../../utils/migratePasswords.js')
      verifyAndMigratePassword = migrationUtils.verifyAndMigratePassword
      migrateUserPassword = migrationUtils.migrateUserPassword
    })

    describe('verifyAndMigratePassword', () => {
      it('should verify and migrate legacy plaintext password', async () => {
        const password = 'testpassword'
        const storedPassword = 'testpassword'
        const storedSalt = null
        const userId = 'user123'

        // Mock the migration function
        const mockMigrateUserPassword = vi.fn().mockResolvedValue(true)
        vi.doMock('../../utils/migratePasswords.js', () => ({
          verifyAndMigratePassword: vi.fn().mockImplementation(async (pwd, stored, salt, id) => {
            if (!salt && pwd === stored) {
              await mockMigrateUserPassword(id, stored)
              return true
            }
            return false
          }),
          migrateUserPassword: mockMigrateUserPassword
        }))

        const result = await verifyAndMigratePassword(password, storedPassword, storedSalt, userId)

        expect(result).toBe(true)
        expect(mockMigrateUserPassword).toHaveBeenCalledWith(userId, storedPassword)
      })

      it('should verify hashed password without migration', async () => {
        const password = 'testpassword'
        const storedPassword = 'abcdef123456'
        const storedSalt = 'testsalt123'
        const userId = 'user123'

        // Mock hashed password verification
        const mockHashPassword = vi.fn().mockResolvedValue({ hash: 'abcdef123456' })
        vi.doMock('../../utils/passwordUtils.js', () => ({
          hashPassword: mockHashPassword
        }))

        const result = await verifyAndMigratePassword(password, storedPassword, storedSalt, userId)

        expect(result).toBe(true)
      })

      it('should reject incorrect password', async () => {
        const password = 'wrongpassword'
        const storedPassword = 'testpassword'
        const storedSalt = null
        const userId = 'user123'

        const result = await verifyAndMigratePassword(password, storedPassword, storedSalt, userId)

        expect(result).toBe(false)
      })
    })
  })
})
