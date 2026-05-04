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
const { createLog, logUserAction } = await import('../utils/logger')

describe('Super Admin Logging Behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Super Admin Operations within Organizations', () => {
    it('should NOT log when super admin performs operation in organization with logging disabled', async () => {
      // Mock organization settings with logging disabled
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ loggingEnabled: false })
      })

      const logData = {
        type: 'user_create',
        level: 'info',
        description: 'Super admin created user in organization',
        userId: 'super-admin-123',
        userName: 'Super Admin',
        orgId: 'org-123' // Organization context provided
      }

      const result = await createLog(logData)

      // Should return null when organization logging is disabled
      expect(result).toBeNull()
      expect(addDoc).not.toHaveBeenCalled()
    })

    it('should log when super admin performs operation in organization with logging enabled', async () => {
      // Mock organization settings with logging enabled
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ loggingEnabled: true })
      })

      // Mock addDoc to return a document ID
      addDoc.mockResolvedValue({ id: 'log123' })

      const logData = {
        type: 'user_create',
        level: 'info',
        description: 'Super admin created user in organization',
        userId: 'super-admin-123',
        userName: 'Super Admin',
        orgId: 'org-123' // Organization context provided
      }

      const result = await createLog(logData)

      // Should create log when organization logging is enabled
      expect(result).toEqual({
        id: 'log123',
        type: 'user_create',
        level: 'info',
        description: 'Super admin created user in organization',
        userId: 'super-admin-123',
        userName: 'Super Admin',
        orgId: 'org-123',
        metadata: {},
        createdAt: expect.any(Date),
        timestamp: expect.any(String)
      })
      expect(addDoc).toHaveBeenCalled()
    })

    it('should NOT log when super admin performs operation in new organization (no settings)', async () => {
      // Mock no settings document (new organization)
      getDoc.mockResolvedValue({
        exists: () => false
      })

      const logData = {
        type: 'org_update',
        level: 'info',
        description: 'Super admin updated organization',
        userId: 'super-admin-123',
        userName: 'Super Admin',
        orgId: 'new-org-456' // New organization context
      }

      const result = await createLog(logData)

      // Should return null for new organizations (logging disabled by default)
      expect(result).toBeNull()
      expect(addDoc).not.toHaveBeenCalled()
    })
  })

  describe('Super Admin System-Level Operations', () => {
    it('should always log system-level operations (no organization context)', async () => {
      // Mock addDoc to return a document ID
      addDoc.mockResolvedValue({ id: 'syslog123' })

      const logData = {
        type: 'system_error',
        level: 'error',
        description: 'System-level error occurred',
        userId: 'super-admin-123',
        userName: 'Super Admin',
        orgId: null // No organization context (system-level)
      }

      const result = await createLog(logData)

      // Should always create system logs regardless of organization settings
      expect(result).toEqual({
        id: 'syslog123',
        type: 'system_error',
        level: 'error',
        description: 'System-level error occurred',
        userId: 'super-admin-123',
        userName: 'Super Admin',
        orgId: null,
        metadata: {},
        createdAt: expect.any(Date),
        timestamp: expect.any(String)
      })
      expect(addDoc).toHaveBeenCalled()
    })

    it('should always log login screen changes (system-wide)', async () => {
      // Mock addDoc to return a document ID
      addDoc.mockResolvedValue({ id: 'ui-log-123' })

      const logData = {
        type: 'ui_change',
        level: 'info',
        description: 'Login screen updated: Self signup functionality removed',
        userId: 'system',
        userName: 'System',
        orgId: null // System-wide change
      }

      const result = await createLog(logData)

      // Should always log system-wide UI changes
      expect(result).toEqual({
        id: 'ui-log-123',
        type: 'ui_change',
        level: 'info',
        description: 'Login screen updated: Self signup functionality removed',
        userId: 'system',
        userName: 'System',
        orgId: null,
        metadata: {},
        createdAt: expect.any(Date),
        timestamp: expect.any(String)
      })
      expect(addDoc).toHaveBeenCalled()
    })
  })

  describe('logUserAction with Super Admin Context', () => {
    it('should respect organization logging settings for super admin actions', async () => {
      // Mock organization settings with logging disabled
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ loggingEnabled: false })
      })

      const superAdminUser = {
        id: 'super-admin-123',
        displayName: 'Super Admin',
        username: 'superadmin'
      }

      const result = await logUserAction(
        'user_create',
        'Created user: John Doe (johndoe) with role: user',
        superAdminUser,
        'org-123' // Organization context
      )

      // Should return null when organization logging is disabled
      expect(result).toBeNull()
      expect(addDoc).not.toHaveBeenCalled()
    })

    it('should log super admin actions when organization logging is enabled', async () => {
      // Mock organization settings with logging enabled
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ loggingEnabled: true })
      })

      // Mock addDoc to return a document ID
      addDoc.mockResolvedValue({ id: 'super-admin-log-123' })

      const superAdminUser = {
        id: 'super-admin-123',
        displayName: 'Super Admin',
        username: 'superadmin'
      }

      const result = await logUserAction(
        'user_create',
        'Created user: John Doe (johndoe) with role: user',
        superAdminUser,
        'org-123' // Organization context
      )

      // Should create log when organization logging is enabled
      expect(result).toEqual({
        id: 'super-admin-log-123',
        type: 'user_create',
        level: 'info',
        description: 'Created user: John Doe (johndoe) with role: user',
        userId: 'super-admin-123',
        userName: 'Super Admin',
        orgId: 'org-123',
        metadata: {},
        createdAt: expect.any(Date),
        timestamp: expect.any(String)
      })
      expect(addDoc).toHaveBeenCalled()
    })
  })
})

console.log('Super Admin logging behavior tests completed!')
