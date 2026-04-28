import { describe, it, expect, vi, beforeEach } from 'vitest'
import { 
  createLog, 
  createOrgLog, 
  logUserAction, 
  logCrudOperation, 
  logError, 
  logWarning,
  LOG_LEVELS,
  LOG_TYPES 
} from '../utils/logger'

// Mock Firebase
vi.mock('../firebase', () => ({
  db: {
    collection: vi.fn(() => ({
      add: vi.fn()
    }))
  }
}))

// Mock serverTimestamp
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => ({
    add: vi.fn()
  })),
  serverTimestamp: vi.fn(() => new Date('2023-01-01T00:00:00.000Z')),
  addDoc: vi.fn(),
  doc: vi.fn()
}))

describe('Logger Utility Functions', () => {
  const mockUser = {
    id: 'user123',
    displayName: 'Test User',
    username: 'testuser'
  }
  
  const mockOrgId = 'org123'
  
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createLog', () => {
    it('should create a log entry with required fields', async () => {
      const { addDoc } = await import('firebase/firestore')
      const mockDocRef = { id: 'log123' }
      addDoc.mockResolvedValue(mockDocRef)

      const logData = {
        type: LOG_TYPES.USER_LOGIN,
        description: 'User logged in',
        userId: mockUser.id,
        userName: mockUser.displayName,
        orgId: mockOrgId
      }

      const result = await createLog(logData)

      expect(addDoc).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          type: LOG_TYPES.USER_LOGIN,
          level: LOG_LEVELS.INFO,
          description: 'User logged in',
          userId: mockUser.id,
          userName: mockUser.displayName,
          orgId: mockOrgId,
          metadata: {},
          createdAt: expect.any(Object),
          timestamp: expect.any(String)
        })
      )
      
      expect(result).toEqual({
        id: 'log123',
        type: LOG_TYPES.USER_LOGIN,
        level: LOG_LEVELS.INFO,
        description: 'User logged in',
        userId: mockUser.id,
        userName: mockUser.displayName,
        orgId: mockOrgId,
        metadata: {},
        createdAt: expect.any(Object),
        timestamp: expect.any(String)
      })
    })

    it('should throw error when required fields are missing', async () => {
      const incompleteLogData = {
        type: LOG_TYPES.USER_LOGIN,
        description: 'User logged in'
        // missing userId and userName
      }

      await expect(createLog(incompleteLogData)).rejects.toThrow('Missing required log fields')
    })

    it('should use default level when not provided', async () => {
      const { addDoc } = await import('firebase/firestore')
      addDoc.mockResolvedValue({ id: 'log123' })

      const logData = {
        type: LOG_TYPES.USER_LOGIN,
        description: 'User logged in',
        userId: mockUser.id,
        userName: mockUser.displayName,
        orgId: mockOrgId
      }

      await createLog(logData)

      expect(addDoc).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          level: LOG_LEVELS.INFO
        })
      )
    })
  })

  describe('createOrgLog', () => {
    it('should create an organization-specific log entry', async () => {
      const { addDoc, collection } = await import('firebase/firestore')
      const mockDocRef = { id: 'orgLog123' }
      addDoc.mockResolvedValue(mockDocRef)

      const logData = {
        type: LOG_TYPES.PRODUCT_CREATE,
        description: 'Product created',
        userId: mockUser.id,
        userName: mockUser.displayName,
        orgId: mockOrgId
      }

      const result = await createOrgLog(logData)

      expect(collection).toHaveBeenCalledWith(
        expect.any(Object),
        'organizations',
        mockOrgId,
        'logs'
      )
      
      expect(addDoc).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          type: LOG_TYPES.PRODUCT_CREATE,
          description: 'Product created',
          userId: mockUser.id,
          userName: mockUser.displayName,
          createdAt: expect.any(Object),
          timestamp: expect.any(String)
        })
      )
    })

    it('should throw error when orgId is missing', async () => {
      const logData = {
        type: LOG_TYPES.PRODUCT_CREATE,
        description: 'Product created',
        userId: mockUser.id,
        userName: mockUser.displayName
        // missing orgId
      }

      await expect(createOrgLog(logData)).rejects.toThrow('Organization ID is required for organization logs')
    })
  })

  describe('logUserAction', () => {
    it('should create a user action log with correct parameters', async () => {
      const createLogSpy = vi.spyOn({ createLog }, 'createLog').mockResolvedValue({ id: 'log123' })

      await logUserAction(
        LOG_TYPES.USER_LOGIN,
        'User logged in successfully',
        mockUser,
        mockOrgId,
        { ipAddress: '192.168.1.1' }
      )

      expect(createLogSpy).toHaveBeenCalledWith({
        type: LOG_TYPES.USER_LOGIN,
        level: LOG_LEVELS.INFO,
        description: 'User logged in successfully',
        userId: mockUser.id,
        userName: mockUser.displayName,
        orgId: mockOrgId,
        metadata: { ipAddress: '192.168.1.1' }
      })
    })
  })

  describe('logCrudOperation', () => {
    it('should log create operations', async () => {
      const createLogSpy = vi.spyOn({ createLog }, 'createLog').mockResolvedValue({ id: 'log123' })
      
      const entityData = {
        id: 'product123',
        name: 'Test Product',
        price: 9.99
      }

      await logCrudOperation('create', 'product', entityData, mockUser, mockOrgId)

      expect(createLogSpy).toHaveBeenCalledWith({
        type: LOG_TYPES.PRODUCT_CREATE,
        level: LOG_LEVELS.INFO,
        description: 'Created product: Test Product',
        userId: mockUser.id,
        userName: mockUser.displayName,
        orgId: mockOrgId,
        metadata: {
          operation: 'create',
          entityType: 'product',
          entityId: 'product123',
          entityData: entityData
        }
      })
    })

    it('should log update operations', async () => {
      const createLogSpy = vi.spyOn({ createLog }, 'createLog').mockResolvedValue({ id: 'log123' })
      
      const entityData = {
        id: 'product123',
        name: 'Updated Product',
        price: 12.99
      }

      await logCrudOperation('update', 'product', entityData, mockUser, mockOrgId)

      expect(createLogSpy).toHaveBeenCalledWith({
        type: LOG_TYPES.PRODUCT_UPDATE,
        level: LOG_LEVELS.INFO,
        description: 'Updated product: Updated Product',
        userId: mockUser.id,
        userName: mockUser.displayName,
        orgId: mockOrgId,
        metadata: {
          operation: 'update',
          entityType: 'product',
          entityId: 'product123',
          entityData: entityData
        }
      })
    })

    it('should log delete operations', async () => {
      const createLogSpy = vi.spyOn({ createLog }, 'createLog').mockResolvedValue({ id: 'log123' })
      
      const entityData = {
        id: 'product123',
        name: 'Product to Delete',
        price: 9.99
      }

      await logCrudOperation('delete', 'product', entityData, mockUser, mockOrgId)

      expect(createLogSpy).toHaveBeenCalledWith({
        type: LOG_TYPES.PRODUCT_DELETE,
        level: LOG_LEVELS.INFO,
        description: 'Deleted product: Product to Delete',
        userId: mockUser.id,
        userName: mockUser.displayName,
        orgId: mockOrgId,
        metadata: {
          operation: 'delete',
          entityType: 'product',
          entityId: 'product123',
          entityData: entityData
        }
      })
    })

    it('should handle entity without name', async () => {
      const createLogSpy = vi.spyOn({ createLog }, 'createLog').mockResolvedValue({ id: 'log123' })
      
      const entityData = {
        id: 'product123',
        price: 9.99
        // no name field
      }

      await logCrudOperation('create', 'product', entityData, mockUser, mockOrgId)

      expect(createLogSpy).toHaveBeenCalledWith({
        type: LOG_TYPES.PRODUCT_CREATE,
        level: LOG_LEVELS.INFO,
        description: 'Created product: product123',
        userId: mockUser.id,
        userName: mockUser.displayName,
        orgId: mockOrgId,
        metadata: {
          operation: 'create',
          entityType: 'product',
          entityId: 'product123',
          entityData: entityData
        }
      })
    })

    it('should throw error for invalid operation', async () => {
      const entityData = { id: 'product123', name: 'Test Product' }

      await expect(
        logCrudOperation('invalid', 'product', entityData, mockUser, mockOrgId)
      ).rejects.toThrow('Invalid operation: invalid for entity: product')
    })
  })

  describe('logError', () => {
    it('should log error with error details', async () => {
      const createLogSpy = vi.spyOn({ createLog }, 'createLog').mockResolvedValue({ id: 'log123' })
      
      const error = new Error('Test error message')
      error.stack = 'Error stack trace'

      await logError('Database connection failed', error, mockUser, mockOrgId, { query: 'SELECT * FROM users' })

      expect(createLogSpy).toHaveBeenCalledWith({
        type: LOG_TYPES.SYSTEM_ERROR,
        level: LOG_LEVELS.ERROR,
        description: 'Database connection failed',
        userId: mockUser.id,
        userName: mockUser.displayName,
        orgId: mockOrgId,
        metadata: {
          errorMessage: 'Test error message',
          errorStack: 'Error stack trace',
          query: 'SELECT * FROM users'
        }
      })
    })

    it('should work without user context', async () => {
      const createLogSpy = vi.spyOn({ createLog }, 'createLog').mockResolvedValue({ id: 'log123' })
      
      const error = new Error('System error')

      await logError('Critical system failure', error, null, null)

      expect(createLogSpy).toHaveBeenCalledWith({
        type: LOG_TYPES.SYSTEM_ERROR,
        level: LOG_LEVELS.ERROR,
        description: 'Critical system failure',
        userId: undefined,
        userName: undefined,
        orgId: null,
        metadata: {
          errorMessage: 'System error',
          errorStack: expect.any(String)
        }
      })
    })
  })

  describe('logWarning', () => {
    it('should log warning message', async () => {
      const createLogSpy = vi.spyOn({ createLog }, 'createLog').mockResolvedValue({ id: 'log123' })

      await logWarning('API rate limit approaching', mockUser, mockOrgId, { currentRate: 95 })

      expect(createLogSpy).toHaveBeenCalledWith({
        type: LOG_TYPES.SYSTEM_WARNING,
        level: LOG_LEVELS.WARNING,
        description: 'API rate limit approaching',
        userId: mockUser.id,
        userName: mockUser.displayName,
        orgId: mockOrgId,
        metadata: { currentRate: 95 }
      })
    })

    it('should work without user context', async () => {
      const createLogSpy = vi.spyOn({ createLog }, 'createLog').mockResolvedValue({ id: 'log123' })

      await logWarning('System maintenance scheduled', null, null)

      expect(createLogSpy).toHaveBeenCalledWith({
        type: LOG_TYPES.SYSTEM_WARNING,
        level: LOG_LEVELS.WARNING,
        description: 'System maintenance scheduled',
        userId: undefined,
        userName: undefined,
        orgId: null,
        metadata: {}
      })
    })
  })
})
