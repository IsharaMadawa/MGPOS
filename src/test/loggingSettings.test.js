import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Firebase
vi.mock('../firebase', () => ({
  db: {}
}))

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  collection: vi.fn(),
  addDoc: vi.fn(),
  serverTimestamp: vi.fn(() => new Date())
}))

// Import after mocking
const { doc, getDoc, collection, addDoc } = await import('firebase/firestore')

// Import logger functions after mocking
const { isLoggingEnabled, createLog } = await import('../utils/logger')

describe('Logging Settings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('isLoggingEnabled', () => {
    it('should return true when no orgId is provided (system logs)', async () => {
      const result = await isLoggingEnabled(null)
      expect(result).toBe(true)
    })

    it('should return true when orgId is empty string (system logs)', async () => {
      const result = await isLoggingEnabled('')
      expect(result).toBe(true)
    })

    it('should return true when logging is explicitly enabled', async () => {
      const mockDocSnap = {
        exists: () => true,
        data: () => ({ loggingEnabled: true })
      }
      getDoc.mockResolvedValue(mockDocSnap)

      const result = await isLoggingEnabled('org123')
      expect(result).toBe(true)
    })

    it('should return false when logging is explicitly disabled', async () => {
      const mockDocSnap = {
        exists: () => true,
        data: () => ({ loggingEnabled: false })
      }
      getDoc.mockResolvedValue(mockDocSnap)

      const result = await isLoggingEnabled('org123')
      expect(result).toBe(false)
    })

    it('should return false when logging setting is not present (new org default)', async () => {
      const mockDocSnap = {
        exists: () => true,
        data: () => ({ someOtherSetting: true })
      }
      getDoc.mockResolvedValue(mockDocSnap)

      const result = await isLoggingEnabled('org123')
      expect(result).toBe(false)
    })

    it('should return false when settings document does not exist', async () => {
      const mockDocSnap = {
        exists: () => false
      }
      getDoc.mockResolvedValue(mockDocSnap)

      const result = await isLoggingEnabled('org123')
      expect(result).toBe(false)
    })

    it('should return true on error (fail-safe)', async () => {
      getDoc.mockRejectedValue(new Error('Firebase error'))

      const result = await isLoggingEnabled('org123')
      expect(result).toBe(true)
    })
  })

  describe('createLog with logging disabled', () => {
    it('should return null when logging is disabled for organization', async () => {
      const mockDocSnap = {
        exists: () => true,
        data: () => ({ loggingEnabled: false })
      }
      getDoc.mockResolvedValue(mockDocSnap)

      const logData = {
        type: 'user_login',
        level: 'info',
        description: 'User logged in',
        userId: 'user123',
        userName: 'Test User',
        orgId: 'org123'
      }

      const result = await createLog(logData)
      expect(result).toBeNull()
    })

    it('should create log when logging is enabled', async () => {
      const mockDocSnap = {
        exists: () => true,
        data: () => ({ loggingEnabled: true })
      }
      getDoc.mockResolvedValue(mockDocSnap)
      addDoc.mockResolvedValue({ id: 'log123' })

      const logData = {
        type: 'user_login',
        level: 'info',
        description: 'User logged in',
        userId: 'user123',
        userName: 'Test User',
        orgId: 'org123'
      }

      const result = await createLog(logData)
      expect(result).toEqual({
        id: 'log123',
        type: 'user_login',
        level: 'info',
        description: 'User logged in',
        userId: 'user123',
        userName: 'Test User',
        orgId: 'org123',
        metadata: {},
        createdAt: expect.any(Date),
        timestamp: expect.any(String)
      })
      expect(addDoc).toHaveBeenCalled()
    })
  })
})
