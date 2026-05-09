import { renderHook, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { useCreditHistory, useCreditSummary, CreditTransactionType } from '../hooks/useCreditHistory'
import { collection, query, orderBy, onSnapshot, addDoc, doc, getDoc } from 'firebase/firestore'

// Mock Firebase
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  onSnapshot: vi.fn(),
  addDoc: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
}))

// Mock contexts
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    userProfile: { id: 'user-id', displayName: 'Test User' },
    isSuperAdmin: false
  })
}))

vi.mock('../contexts/OrgContext', () => ({
  useOrg: () => ({
    selectedOrgId: 'test-org-id'
  })
}))

// Mock logger
vi.mock('../utils/logger', () => ({
  logUserAction: vi.fn(),
  logCrudOperation: vi.fn(),
  logError: vi.fn(),
}))

// Mock Firebase config
vi.mock('../firebase', () => ({
  db: {}
}))

describe('useCreditHistory', () => {
  const mockCustomerId = 'test-customer-id'
  
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock onSnapshot to call callback immediately
    onSnapshot.mockImplementation((q, callback) => {
      callback({
        docs: [
          {
            id: 'transaction-1',
            data: () => ({
              type: CreditTransactionType.PAYMENT,
              amount: 100,
              description: 'Initial payment',
              createdAt: '2023-01-01T00:00:00.000Z',
              createdBy: 'user-id',
              createdByName: 'Test User'
            })
          },
          {
            id: 'transaction-2',
            data: () => ({
              type: CreditTransactionType.PURCHASE,
              amount: 50,
              description: 'Credit purchase',
              createdAt: '2023-01-02T00:00:00.000Z',
              createdBy: 'user-id',
              createdByName: 'Test User'
            })
          }
        ]
      })
      return vi.fn()
    })
  })

  it('should fetch credit history for customer', async () => {
    const { result } = renderHook(() => useCreditHistory(mockCustomerId))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.transactions).toHaveLength(2)
    expect(result.current.transactions[0].type).toBe(CreditTransactionType.PAYMENT)
    expect(result.current.transactions[0].amount).toBe(100)
    expect(result.current.transactions[1].type).toBe(CreditTransactionType.PURCHASE)
    expect(result.current.transactions[1].amount).toBe(50)
  })

  it('should calculate running balance correctly', async () => {
    const { result } = renderHook(() => useCreditHistory(mockCustomerId))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const transactions = result.current.transactions
    
    // First transaction (payment): +100, balance: 100
    expect(transactions[1].runningBalance).toBe(100)
    
    // Second transaction (purchase): -50, balance: 50
    expect(transactions[0].runningBalance).toBe(50)
  })

  it('should handle empty credit history', async () => {
    onSnapshot.mockImplementation((q, callback) => {
      callback({ docs: [] })
      return vi.fn()
    })

    const { result } = renderHook(() => useCreditHistory(mockCustomerId))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.transactions).toHaveLength(0)
  })

  it('should add credit transaction', async () => {
    addDoc.mockResolvedValue({ id: 'new-transaction-id' })

    const { result } = renderHook(() => useCreditHistory(mockCustomerId))

    const transactionData = {
      type: CreditTransactionType.PAYMENT,
      amount: 75,
      description: 'Test payment'
    }

    await result.current.addCreditTransaction(transactionData)

    expect(addDoc).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        type: CreditTransactionType.PAYMENT,
        amount: 75,
        description: 'Test payment',
        customerId: mockCustomerId,
        orgId: 'test-org-id',
        createdBy: 'user-id',
        createdByName: 'Test User',
        createdAt: expect.any(String)
      })
    )
  })

  it('should handle missing organization', async () => {
    vi.mock('../contexts/OrgContext', () => ({
      useOrg: () => ({
        selectedOrgId: null
      })
    }))

    const { result } = renderHook(() => useCreditHistory(mockCustomerId))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.transactions).toHaveLength(0)
  })
})

describe('useCreditSummary', () => {
  const mockCustomerId = 'test-customer-id'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should calculate credit summary correctly', async () => {
    // Mock useCreditHistory
    const mockTransactions = [
      {
        type: CreditTransactionType.PAYMENT,
        amount: 200
      },
      {
        type: CreditTransactionType.PURCHASE,
        amount: 150
      },
      {
        type: CreditTransactionType.PAYMENT,
        amount: 50
      },
      {
        type: CreditTransactionType.ADJUSTMENT,
        amount: 25
      }
    ]

    vi.doMock('../hooks/useCreditHistory', () => ({
      useCreditHistory: () => ({
        transactions: mockTransactions,
        loading: false
      }),
      useCreditSummary: vi.fn().mockImplementation(() => ({
        summary: {
          totalCredit: 125, // (200 + 50 + 25) - 150
          totalPurchases: 150,
          totalPayments: 250,
          totalAdjustments: 25,
          transactionCount: 4
        },
        loading: false
      }))
    }))

    const { result } = renderHook(() => useCreditSummary(mockCustomerId))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.summary).toEqual({
      totalCredit: 125,
      totalPurchases: 150,
      totalPayments: 250,
      totalAdjustments: 25,
      transactionCount: 4
    })
  })

  it('should handle empty transactions', async () => {
    vi.doMock('../hooks/useCreditHistory', () => ({
      useCreditHistory: () => ({
        transactions: [],
        loading: false
      }),
      useCreditSummary: vi.fn().mockImplementation(() => ({
        summary: {
          totalCredit: 0,
          totalPurchases: 0,
          totalPayments: 0,
          totalAdjustments: 0,
          transactionCount: 0
        },
        loading: false
      }))
    }))

    const { result } = renderHook(() => useCreditSummary(mockCustomerId))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.summary).toEqual({
      totalCredit: 0,
      totalPurchases: 0,
      totalPayments: 0,
      totalAdjustments: 0,
      transactionCount: 0
    })
  })
})
