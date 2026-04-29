import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useReports } from '../hooks/useReports'
import { AuthContext } from '../contexts/AuthContext'
import { OrgContext } from '../contexts/OrgContext'
import { doc, getDocs, query, where, orderBy, collection, addDoc } from 'firebase/firestore'

// Mock Firebase
vi.mock('../firebase', () => ({
  db: {}
}))

// Mock Firebase Firestore functions
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  doc: vi.fn()
}))

describe('useReports', () => {
  const mockUser = {
    id: 'user1',
    displayName: 'Test User',
    orgId: 'org1'
  }

  const mockSuperAdminUser = {
    id: 'super1',
    displayName: 'Super Admin',
    orgId: null
  }

  const mockOrg = {
    id: 'org1',
    name: 'Test Organization'
  }

  const mockBillingLogs = [
    {
      id: 'bill1',
      receiptNo: '123456',
      createdAt: '2024-01-15T10:00:00.000Z',
      cashierName: 'John Doe',
      itemCount: 3,
      subtotal: 100.00,
      discountAmount: 10.00,
      taxAmount: 9.00,
      total: 99.00,
      cart: [
        {
          id: 'item1',
          name: 'Product 1',
          price: 50.00,
          qty: 2,
          discount: { enabled: true, type: 'percentage', value: 10 }
        },
        {
          id: 'item2',
          name: 'Product 2',
          price: 10.00,
          qty: 1,
          discount: { enabled: false }
        }
      ]
    },
    {
      id: 'bill2',
      receiptNo: '123457',
      createdAt: '2024-01-15T11:00:00.000Z',
      cashierName: 'Jane Smith',
      itemCount: 2,
      subtotal: 30.00,
      discountAmount: 0.00,
      taxAmount: 3.00,
      total: 33.00,
      cart: [
        {
          id: 'item3',
          name: 'Product 3',
          price: 15.00,
          qty: 2,
          cartDiscount: '5.00'
        }
      ]
    }
  ]

  const wrapper = ({ user, selectedOrgId, children }) => {
    return (
      <AuthContext.Provider value={{ 
        userProfile: user, 
        isSuperAdmin: user?.orgId === null,
        loading: false 
      }}>
        <OrgContext.Provider value={{ selectedOrgId }}>
          {children}
        </OrgContext.Provider>
      </AuthContext.Provider>
    )
  }

  beforeEach(() => {
    vi.clearAllMocks()
    getDocs.mockResolvedValue({
      docs: mockBillingLogs.map(log => ({
        id: log.id,
        data: () => log
      }))
    })
  })

  it('should calculate correct gross sales from cart items', async () => {
    const { result } = renderHook(() => useReports(), {
      wrapper: ({ children }) => wrapper({ user: mockUser, selectedOrgId: 'org1', children })
    })

    // Generate report to populate the reports state
    await result.current.generateReport('today')

    await waitFor(() => {
      // The hook adds orgId and sorts by date descending
      const expectedReports = mockBillingLogs.map(log => ({
        ...log,
        orgId: 'org1'
      })).reverse()
      expect(result.current.reports).toEqual(expectedReports)
    })

    const summary = result.current.calculateSummary(mockBillingLogs)
    
    // Expected gross: (50 * 2) + (10 * 1) + (15 * 2) = 100 + 10 + 30 = 140
    expect(summary.grossSales).toBe(140.00)
  })

  it('should calculate correct item-level discounts', async () => {
    const { result } = renderHook(() => useReports(), {
      wrapper: ({ children }) => wrapper({ user: mockUser, selectedOrgId: 'org1', children })
    })

    const summary = result.current.calculateSummary(mockBillingLogs)
    
    // Expected item discounts:
    // Bill 1: (50 * 2) * 10% = 10 (from percentage discount)
    // Bill 2: 5.00 (from cartDiscount)
    // Total item discounts: 15.00
    // Global discounts: 10.00 (Bill 1) + 0.00 (Bill 2) = 10.00
    // Total discounts: 15.00 + 10.00 = 25.00
    expect(summary.totalDiscounts).toBe(25.00)
  })

  it('should calculate correct net sales (gross - discounts)', async () => {
    const { result } = renderHook(() => useReports(), {
      wrapper: ({ children }) => wrapper({ user: mockUser, selectedOrgId: 'org1', children })
    })

    const summary = result.current.calculateSummary(mockBillingLogs)
    
    // Expected net: 140 (gross) - 25 (total discounts) = 115
    expect(summary.netSales).toBe(115.00)
  })

  it('should handle empty cart correctly', () => {
    const { result } = renderHook(() => useReports(), {
      wrapper: ({ children }) => wrapper({ user: mockUser, selectedOrgId: 'org1', children })
    })

    const emptyBill = {
      ...mockBillingLogs[0],
      cart: []
    }

    const summary = result.current.calculateSummary([emptyBill])
    
    expect(summary.grossSales).toBe(0)
    expect(summary.totalDiscounts).toBe(10) // Only global discount
    expect(summary.netSales).toBe(-10) // 0 - 10
  })

  it('should handle missing cart correctly', () => {
    const { result } = renderHook(() => useReports(), {
      wrapper: ({ children }) => wrapper({ user: mockUser, selectedOrgId: 'org1', children })
    })

    const noCartBill = {
      ...mockBillingLogs[0],
      cart: undefined
    }

    const summary = result.current.calculateSummary([noCartBill])
    
    expect(summary.grossSales).toBe(0)
    expect(summary.totalDiscounts).toBe(10) // Only global discount
    expect(summary.netSales).toBe(-10) // 0 - 10
  })

  it('should provide correct cashier breakdown', () => {
    const { result } = renderHook(() => useReports(), {
      wrapper: ({ children }) => wrapper({ user: mockUser, selectedOrgId: 'org1', children })
    })

    const breakdown = result.current.getCashierBreakdown(mockBillingLogs)
    
    expect(breakdown).toHaveLength(2)
    
    const johnBreakdown = breakdown.find(c => c.cashierName === 'John Doe')
    expect(johnBreakdown.transactionCount).toBe(1)
    expect(johnBreakdown.grossSales).toBe(110) // (50 * 2) + (10 * 1)
    expect(johnBreakdown.totalDiscounts).toBe(20) // 10 (item) + 10 (global)
    expect(johnBreakdown.netSales).toBe(90) // 110 - 20
    
    const janeBreakdown = breakdown.find(c => c.cashierName === 'Jane Smith')
    expect(janeBreakdown.transactionCount).toBe(1)
    expect(janeBreakdown.grossSales).toBe(30) // (15 * 2)
    expect(janeBreakdown.totalDiscounts).toBe(5) // 5 (item) + 0 (global)
    expect(janeBreakdown.netSales).toBe(25) // 30 - 5
  })

  it('should provide correct daily breakdown', () => {
    const { result } = renderHook(() => useReports(), {
      wrapper: ({ children }) => wrapper({ user: mockUser, selectedOrgId: 'org1', children })
    })

    const breakdown = result.current.getDailyBreakdown(mockBillingLogs)
    
    expect(breakdown).toHaveLength(1)
    expect(breakdown[0].date).toBe('2024-01-15')
    expect(breakdown[0].transactionCount).toBe(2)
    expect(breakdown[0].grossSales).toBe(140)
    expect(breakdown[0].totalDiscounts).toBe(25)
    expect(breakdown[0].netSales).toBe(115)
  })

  it('should handle percentage discounts correctly', () => {
    const { result } = renderHook(() => useReports(), {
      wrapper: ({ children }) => wrapper({ user: mockUser, selectedOrgId: 'org1', children })
    })

    const percentageBill = {
      id: 'percent1',
      receiptNo: '123458',
      createdAt: '2024-01-15T12:00:00.000Z',
      cashierName: 'Test Cashier',
      itemCount: 1,
      subtotal: 90.00,
      discountAmount: 0.00,
      taxAmount: 9.00,
      total: 99.00,
      cart: [
        {
          id: 'item4',
          name: 'Product 4',
          price: 100.00,
          qty: 1,
          discount: { enabled: true, type: 'percentage', value: 10 }
        }
      ]
    }

    const summary = result.current.calculateSummary([percentageBill])
    
    // Gross: 100 * 1 = 100
    // Item discount: 100 * 10% = 10
    // Global discount: 0
    // Net: 100 - 10 = 90
    expect(summary.grossSales).toBe(100)
    expect(summary.totalDiscounts).toBe(10)
    expect(summary.netSales).toBe(90)
  })

  it('should handle fixed amount discounts correctly', () => {
    const { result } = renderHook(() => useReports(), {
      wrapper: ({ children }) => wrapper({ user: mockUser, selectedOrgId: 'org1', children })
    })

    const fixedBill = {
      id: 'fixed1',
      receiptNo: '123459',
      createdAt: '2024-01-15T13:00:00.000Z',
      cashierName: 'Test Cashier',
      itemCount: 1,
      subtotal: 95.00,
      discountAmount: 0.00,
      taxAmount: 9.50,
      total: 104.50,
      cart: [
        {
          id: 'item5',
          name: 'Product 5',
          price: 100.00,
          qty: 1,
          discount: { enabled: true, type: 'fixed', value: 5 }
        }
      ]
    }

    const summary = result.current.calculateSummary([fixedBill])
    
    // Gross: 100 * 1 = 100
    // Item discount: 5 (fixed, capped at line total)
    // Global discount: 0
    // Net: 100 - 5 = 95
    expect(summary.grossSales).toBe(100)
    expect(summary.totalDiscounts).toBe(5)
    expect(summary.netSales).toBe(95)
  })

  it('should handle cart-level custom discounts correctly', () => {
    const { result } = renderHook(() => useReports(), {
      wrapper: ({ children }) => wrapper({ user: mockUser, selectedOrgId: 'org1', children })
    })

    const customDiscountBill = {
      id: 'custom1',
      receiptNo: '123460',
      createdAt: '2024-01-15T14:00:00.000Z',
      cashierName: 'Test Cashier',
      itemCount: 1,
      subtotal: 85.00,
      discountAmount: 0.00,
      taxAmount: 8.50,
      total: 93.50,
      cart: [
        {
          id: 'item6',
          name: 'Product 6',
          price: 100.00,
          qty: 1,
          cartDiscount: '15.00'
        }
      ]
    }

    const summary = result.current.calculateSummary([customDiscountBill])
    
    // Gross: 100 * 1 = 100
    // Item discount: 15 (custom cart discount)
    // Global discount: 0
    // Net: 100 - 15 = 85
    expect(summary.grossSales).toBe(100)
    expect(summary.totalDiscounts).toBe(15)
    expect(summary.netSales).toBe(85)
  })

  it('should handle empty logs array correctly', () => {
    const { result } = renderHook(() => useReports(), {
      wrapper: ({ children }) => wrapper({ user: mockUser, selectedOrgId: 'org1', children })
    })

    const summary = result.current.calculateSummary([])
    
    expect(summary.grossSales).toBe(0)
    expect(summary.totalDiscounts).toBe(0)
    expect(summary.netSales).toBe(0)
    expect(summary.transactionCount).toBe(0)
    expect(summary.itemCount).toBe(0)
  })

  it('should return empty arrays for breakdowns with no data', () => {
    const { result } = renderHook(() => useReports(), {
      wrapper: ({ children }) => wrapper({ user: mockUser, selectedOrgId: 'org1', children })
    })

    const cashierBreakdown = result.current.getCashierBreakdown([])
    const dailyBreakdown = result.current.getDailyBreakdown([])
    
    expect(cashierBreakdown).toEqual([])
    expect(dailyBreakdown).toEqual([])
  })
})
