import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useLogs, useAllLogs, useLogStats, getLogTypeName, getLogLevelColor } from '../hooks/useLogs'
import { LOG_LEVELS, LOG_TYPES } from '../utils/logger'
import { AuthProvider } from '../contexts/AuthContext'
import { OrgProvider } from '../contexts/OrgContext'

// Mock Firebase
vi.mock('../firebase', () => ({
  db: {}
}))

// Mock Firebase Firestore functions
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  where: vi.fn(),
  onSnapshot: vi.fn(),
  getDocs: vi.fn()
}))

// Mock contexts
vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
  AuthProvider: ({ children }) => children
}))

vi.mock('../contexts/OrgContext', () => ({
  useOrg: vi.fn(),
  OrgProvider: ({ children }) => children
}))

const mockUser = {
  id: 'user123',
  displayName: 'Test User',
  username: 'testuser',
  role: 'admin',
  orgId: 'org123'
}

const mockSuperAdmin = {
  id: 'super123',
  displayName: 'Super Admin',
  username: 'superadmin',
  role: 'super_admin',
  orgId: null
}

const wrapper = ({ children }) => children

describe('useLogs Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch logs for regular admin user', async () => {
    // Mock the contexts
    const { useAuth } = await import('../contexts/AuthContext')
    const { useOrg } = await import('../contexts/OrgContext')
    
    useAuth.mockReturnValue({
      userProfile: mockUser,
      isSuperAdmin: false
    })
    
    useOrg.mockReturnValue({
      selectedOrgId: null
    })

    const { onSnapshot } = await import('firebase/firestore')
    const mockUnsubscribe = vi.fn()
    onSnapshot.mockReturnValue(mockUnsubscribe)

    const mockLogs = [
      {
        id: 'log1',
        type: LOG_TYPES.USER_LOGIN,
        level: LOG_LEVELS.INFO,
        description: 'User logged in',
        userId: 'user123',
        userName: 'Test User',
        orgId: 'org123',
        timestamp: '2023-01-01T10:00:00Z',
        createdAt: new Date('2023-01-01T10:00:00Z')
      }
    ]

    onSnapshot.mockImplementation((query, callback) => {
      callback({
        docs: mockLogs.map(log => ({
          id: log.id,
          data: () => log
        }))
      })
      return mockUnsubscribe
    })

    const { result } = renderHook(() => useLogs(), { wrapper })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.logs).toEqual(mockLogs)
    expect(result.current.error).toBeNull()
  })

  it('should handle fetch errors', async () => {
    // Mock the contexts
    const { useAuth } = await import('../contexts/AuthContext')
    const { useOrg } = await import('../contexts/OrgContext')
    
    useAuth.mockReturnValue({
      userProfile: mockUser,
      isSuperAdmin: false
    })
    
    useOrg.mockReturnValue({
      selectedOrgId: null
    })

    const { onSnapshot } = await import('firebase/firestore')
    const mockUnsubscribe = vi.fn()
    onSnapshot.mockReturnValue(mockUnsubscribe)

    const mockError = new Error('Failed to fetch logs')
    onSnapshot.mockImplementation((query, callback, errorCallback) => {
      errorCallback(mockError)
      return mockUnsubscribe
    })

    const { result } = renderHook(() => useLogs(), { wrapper })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('Failed to fetch logs: Failed to fetch logs')
    expect(result.current.logs).toEqual([])
  })

  it('should apply basic query structure correctly', async () => {
    // Mock the contexts
    const { useAuth } = await import('../contexts/AuthContext')
    const { useOrg } = await import('../contexts/OrgContext')
    
    useAuth.mockReturnValue({
      userProfile: mockUser,
      isSuperAdmin: false
    })
    
    useOrg.mockReturnValue({
      selectedOrgId: null
    })

    const { onSnapshot, query, orderBy, limit } = await import('firebase/firestore')
    const mockUnsubscribe = vi.fn()
    onSnapshot.mockReturnValue(mockUnsubscribe)

    const options = {
      limit: 50
    }

    renderHook(() => useLogs(options), { wrapper })

    await waitFor(() => {
      // Should only use orderBy and limit (no where clause - filtering done client-side)
      expect(orderBy).toHaveBeenCalledWith('createdAt', 'desc')
      expect(limit).toHaveBeenCalledWith(100) // orgId exists so limit * 2
    })
  })
})

describe('useAllLogs Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch all logs for super admin', async () => {
    // Mock the contexts
    const { useAuth } = await import('../contexts/AuthContext')
    const { useOrg } = await import('../contexts/OrgContext')
    
    useAuth.mockReturnValue({
      userProfile: mockSuperAdmin,
      isSuperAdmin: true
    })
    
    useOrg.mockReturnValue({
      selectedOrgId: null
    })

    const { onSnapshot } = await import('firebase/firestore')
    const mockUnsubscribe = vi.fn()
    onSnapshot.mockReturnValue(mockUnsubscribe)

    const mockLogs = [
      {
        id: 'log1',
        type: LOG_TYPES.USER_LOGIN,
        level: LOG_LEVELS.INFO,
        description: 'User logged in',
        userId: 'user123',
        userName: 'Test User',
        orgId: 'org123',
        timestamp: '2023-01-01T10:00:00Z'
      },
      {
        id: 'log2',
        type: LOG_TYPES.PRODUCT_CREATE,
        level: LOG_LEVELS.INFO,
        description: 'Product created',
        userId: 'user456',
        userName: 'Another User',
        orgId: 'org456',
        timestamp: '2023-01-01T11:00:00Z'
      }
    ]

    onSnapshot.mockImplementation((query, callback) => {
      callback({
        docs: mockLogs.map(log => ({
          id: log.id,
          data: () => log
        }))
      })
      return mockUnsubscribe
    })

    const { result } = renderHook(() => useAllLogs(), { wrapper })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.logs).toEqual(mockLogs)
    expect(result.current.error).toBeNull()
  })

  it('should return unauthorized error for non-super admin', async () => {
    // Mock the contexts
    const { useAuth } = await import('../contexts/AuthContext')
    const { useOrg } = await import('../contexts/OrgContext')
    
    useAuth.mockReturnValue({
      userProfile: mockUser,
      isSuperAdmin: false
    })
    
    useOrg.mockReturnValue({
      selectedOrgId: null
    })

    const { result } = renderHook(() => useAllLogs(), { wrapper })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('Unauthorized: Super admin access required')
    expect(result.current.logs).toEqual([])
  })

  it('should filter logs by organization for super admin', async () => {
    // Mock the contexts
    const { useAuth } = await import('../contexts/AuthContext')
    const { useOrg } = await import('../contexts/OrgContext')
    
    useAuth.mockReturnValue({
      userProfile: mockSuperAdmin,
      isSuperAdmin: true
    })
    
    useOrg.mockReturnValue({
      selectedOrgId: 'org123'
    })

    const { onSnapshot, orderBy, limit } = await import('firebase/firestore')
    const mockUnsubscribe = vi.fn()
    onSnapshot.mockReturnValue(mockUnsubscribe)

    const options = {
      orgId: 'org123',
      limit: 50
    }

    renderHook(() => useAllLogs(options), { wrapper })

    await waitFor(() => {
      // Should only use orderBy and limit (no where clause - filtering done client-side)
      expect(orderBy).toHaveBeenCalledWith('createdAt', 'desc')
      expect(limit).toHaveBeenCalledWith(100) // orgId exists so limit * 2
    })
  })
})

describe('useLogStats Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should calculate log statistics correctly', async () => {
    // Mock the contexts
    const { useAuth } = await import('../contexts/AuthContext')
    const { useOrg } = await import('../contexts/OrgContext')
    
    useAuth.mockReturnValue({
      userProfile: mockUser,
      isSuperAdmin: false
    })
    
    useOrg.mockReturnValue({
      selectedOrgId: null
    })

    const { getDocs, collection, query, orderBy, limit, where } = await import('firebase/firestore')

    const mockLogs = [
      { type: LOG_TYPES.USER_LOGIN, level: LOG_LEVELS.INFO, orgId: 'org123' },
      { type: LOG_TYPES.USER_LOGIN, level: LOG_LEVELS.INFO, orgId: 'org123' },
      { type: LOG_TYPES.PRODUCT_CREATE, level: LOG_LEVELS.INFO, orgId: 'org123' },
      { type: LOG_TYPES.SYSTEM_ERROR, level: LOG_LEVELS.ERROR, orgId: 'org123' },
      { type: LOG_TYPES.SYSTEM_WARNING, level: LOG_LEVELS.WARNING, orgId: 'org123' }
    ]

    // Mock the first getDocs call (system_logs)
    getDocs.mockResolvedValueOnce({
      docs: mockLogs.map((log, index) => ({
        id: `log${index}`,
        data: () => log
      }))
    })

    const { result } = renderHook(() => useLogStats(), { wrapper })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.stats.total).toBe(5)
    expect(result.current.stats.byLevel[LOG_LEVELS.INFO]).toBe(3)
    expect(result.current.stats.byLevel[LOG_LEVELS.ERROR]).toBe(1)
    expect(result.current.stats.byLevel[LOG_LEVELS.WARNING]).toBe(1)
    expect(result.current.stats.recentActivity).toHaveLength(5)
  })
})

describe('Helper Functions', () => {
  describe('getLogTypeName', () => {
    it('should return human-readable names for log types', () => {
      expect(getLogTypeName(LOG_TYPES.USER_LOGIN)).toBe('User Login')
      expect(getLogTypeName(LOG_TYPES.PRODUCT_CREATE)).toBe('Product Created')
      expect(getLogTypeName(LOG_TYPES.SYSTEM_ERROR)).toBe('System Error')
      expect(getLogTypeName('unknown_type')).toBe('unknown_type')
    })
  })

  describe('getLogLevelColor', () => {
    it('should return correct colors for log levels', () => {
      expect(getLogLevelColor(LOG_LEVELS.INFO)).toBe('blue')
      expect(getLogLevelColor(LOG_LEVELS.WARNING)).toBe('yellow')
      expect(getLogLevelColor(LOG_LEVELS.ERROR)).toBe('red')
      expect(getLogLevelColor(LOG_LEVELS.SUCCESS)).toBe('green')
      expect(getLogLevelColor('unknown_level')).toBe('gray')
    })
  })
})
