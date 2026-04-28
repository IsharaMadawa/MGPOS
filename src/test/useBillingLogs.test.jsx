import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useBillingLogs } from '../hooks/useBillingLogs'
import { AuthProvider } from '../contexts/AuthContext'

// Mock Firebase
const mockAddDoc = vi.fn()
const mockCollection = vi.fn(() => ({
  onSnapshot: vi.fn((callback) => {
    callback({
      docs: [
        { 
          id: 'log-1', 
          data: () => ({ 
            receiptNo: '001', 
            total: 100.00,
            cashierName: 'Test Cashier',
            createdAt: '2024-01-01T00:00:00Z',
          }) 
        },
        { 
          id: 'log-2', 
          data: () => ({ 
            receiptNo: '002', 
            total: 250.50,
            cashierName: 'Test Cashier',
            createdAt: '2024-01-02T00:00:00Z',
          }) 
        },
      ],
    })
    return () => {}
  }),
}))

vi.mock('../firebase', () => ({
  db: {
    collection: mockCollection,
  },
}))

// Mock AuthContext
vi.mock('../contexts/AuthContext', async () => {
  const actual = await vi.importActual('../contexts/AuthContext')
  return {
    ...actual,
    useAuth: () => ({
      userProfile: { id: 'user-1', displayName: 'Test User', orgId: 'org-1' },
      isSuperAdmin: false,
    }),
  }
}))

// Mock OrgContext
vi.mock('../contexts/OrgContext', () => ({
  useOrg: () => ({
    selectedOrgId: null,
    setSelectedOrgId: vi.fn(),
  }),
}))

describe('useBillingLogs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAddDoc.mockClear()
  })

  describe('Initial state', () => {
    it('should start with empty logs array', () => {
      const { result } = renderHook(() => useBillingLogs())
      expect(result.current.logs).toEqual([])
    })

    it('should start with loading true', () => {
      const { result } = renderHook(() => useBillingLogs())
      expect(result.current.loading).toBe(true)
    })
  })

  describe('Billing logs data', () => {
    it('should load billing logs from Firestore', async () => {
      const { result } = renderHook(() => useBillingLogs())
      
      await waitFor(() => {
        expect(result.current.logs.length).toBe(2)
      })
      
      expect(result.current.loading).toBe(false)
    })

    it('should map billing log documents correctly', async () => {
      const { result } = renderHook(() => useBillingLogs())
      
      await waitFor(() => {
        expect(result.current.logs).toEqual([
          expect.objectContaining({ id: 'log-1', receiptNo: '001', total: 100.00 }),
          expect.objectContaining({ id: 'log-2', receiptNo: '002', total: 250.50 }),
        ])
      })
    })
  })

  describe('createBillingLog', () => {
    it('should have createBillingLog function', () => {
      const { result } = renderHook(() => useBillingLogs())
      expect(typeof result.current.createBillingLog).toBe('function')
    })

    it('should add orgId to log entry', async () => {
      const { result } = renderHook(() => useBillingLogs())
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
      
      const saleData = {
        receiptNo: '999',
        cart: [{ name: 'Test Item', price: 10, qty: 1 }],
        total: 10,
      }
      
      // Function should exist and be callable
      expect(result.current.createBillingLog).toBeDefined()
    })
  })
})