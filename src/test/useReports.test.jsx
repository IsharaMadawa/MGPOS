import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useReports } from '../hooks/useReports'
import { AuthContext } from '../contexts/AuthContext'
import { OrgContext } from '../contexts/OrgContext'
import { doc, getDocs, query, where, orderBy, collection, addDoc } from 'firebase/firestore'
import { PaymentMethod } from '../constants/enums.js'

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
  doc: vi.fn(),
  getDoc: vi.fn()
}))
// Mock useOrganizations hook
vi.mock('../hooks/useOrganizations', () => ({
  useOrganizations: vi.fn(() => ({
    organizations: [],
    loading: false
  }))
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

  const mockMultiOrgAdminUser = {
    id: 'multiAdmin1',
    displayName: 'Multi Org Admin',
    role: 'admin',
    organizations: [
      { orgId: 'org1', role: 'admin' },
      { orgId: 'org2', role: 'admin' }
    ]
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
        <OrgContext.Provider value={{ 
          selectedOrgId,
          getAdminOrganizations: () => {
            if (user?.role === 'super_admin') return []
            if (user?.organizations) {
              return user.organizations.filter(org => org.role === 'admin')
            }
            return user?.role === 'admin' ? [{ orgId: user.orgId, role: 'admin' }] : []
          }
        }}>
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
      // The hook adds orgId, orgName and sorts by date descending
      const expectedReports = mockBillingLogs.map(log => ({
        ...log,
        orgId: 'org1',
        orgName: 'Unknown Organization'
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

  it('should handle multi-organization admin with selected organizations', async () => {
    const { result } = renderHook(() => useReports(), {
      wrapper: ({ children }) => wrapper({ user: mockMultiOrgAdminUser, selectedOrgId: 'org1', children })
    })

    // Generate report with multiple organizations
    await result.current.generateReport('today', null, null, ['org1', 'org2'])

    await waitFor(() => {
      expect(result.current.reports).toHaveLength(4) // 2 logs from each org
    })

    // Verify reports from both organizations are included
    const org1Reports = result.current.reports.filter(report => report.orgId === 'org1')
    const org2Reports = result.current.reports.filter(report => report.orgId === 'org2')
    
    expect(org1Reports).toHaveLength(2)
    expect(org2Reports).toHaveLength(2)
  })

  it('should handle multi-organization admin with no selected orgs (fallback to current)', async () => {
    const { result } = renderHook(() => useReports(), {
      wrapper: ({ children }) => wrapper({ user: mockMultiOrgAdminUser, selectedOrgId: 'org2', children })
    })

    // Generate report without specifying organizations (should use current org)
    await result.current.generateReport('today')

    await waitFor(() => {
      expect(result.current.reports).toHaveLength(2) // Only from current org (org2)
    })

    // Verify all reports are from the current organization
    expect(result.current.reports.every(report => report.orgId === 'org2')).toBe(true)
  })

  it('should handle single organization admin correctly', async () => {
    const { result } = renderHook(() => useReports(), {
      wrapper: ({ children }) => wrapper({ user: mockUser, selectedOrgId: 'org1', children })
    })

    // Generate report (single org admin should only get their org)
    await result.current.generateReport('today')

    await waitFor(() => {
      expect(result.current.reports).toHaveLength(2) // Only from their assigned org
    })

    // Verify all reports are from their assigned organization
    expect(result.current.reports.every(report => report.orgId === 'org1')).toBe(true)
  })

  // Payment Method Tests
  describe('Payment Method Filtering', () => {
    const mockPaymentMethodLogs = [
      {
        id: 'cash1',
        receiptNo: '200001',
        createdAt: '2024-01-15T10:00:00.000Z',
        cashierName: 'John Doe',
        paymentMethod: PaymentMethod.CASH,
        total: 100.00,
        itemCount: 2,
        cart: [
          { name: 'Product A', price: 50.00, qty: 2 }
        ],
        discountAmount: 0
      },
      {
        id: 'card1',
        receiptNo: '200002',
        createdAt: '2024-01-15T11:00:00.000Z',
        cashierName: 'Jane Smith',
        paymentMethod: PaymentMethod.CARD,
        total: 75.50,
        itemCount: 1,
        cart: [
          { name: 'Product B', price: 75.50, qty: 1 }
        ],
        discountAmount: 0
      },
      {
        id: 'split1',
        receiptNo: '200003',
        createdAt: '2024-01-15T12:00:00.000Z',
        cashierName: 'Bob Johnson',
        paymentMethod: PaymentMethod.SPLIT,
        total: 125.00,
        itemCount: 3,
        cart: [
          { name: 'Product C', price: 25.00, qty: 1 },
          { name: 'Product D', price: 50.00, qty: 1 },
          { name: 'Product E', price: 50.00, qty: 1 }
        ],
        discountAmount: 0,
        paymentDetails: {
          cashAmount: 75.00,
          cardAmount: 50.00,
          creditAmount: 0
        }
      },
      {
        id: 'credit1',
        receiptNo: '200004',
        createdAt: '2024-01-15T13:00:00.000Z',
        cashierName: 'Alice Brown',
        paymentMethod: PaymentMethod.CREDIT,
        total: 45.00,
        itemCount: 1,
        cart: [
          { name: 'Product F', price: 45.00, qty: 1 }
        ],
        discountAmount: 0,
        customer: {
          id: 'cust1',
          name: 'Credit Customer'
        }
      }
    ]

    it('should filter cash payments correctly including split payments', () => {
      const { result } = renderHook(() => useReports(), {
        wrapper: ({ children }) => wrapper({ user: mockUser, selectedOrgId: 'org1', children })
      })

      // Simulate the filterReportsByPaymentMethod function from ReportsPage
      const filterReportsByPaymentMethod = (reports, method) => {
        return reports.filter(bill => {
          if (method === PaymentMethod.CASH) {
            return bill.paymentMethod === PaymentMethod.CASH || (bill.paymentMethod === PaymentMethod.SPLIT && bill.paymentDetails?.cashAmount > 0)
          }
          return false
        })
      }

      const cashReports = filterReportsByPaymentMethod(mockPaymentMethodLogs, PaymentMethod.CASH)
      
      expect(cashReports).toHaveLength(2)
      expect(cashReports[0].paymentMethod).toBe(PaymentMethod.CASH)
      expect(cashReports[1].paymentMethod).toBe(PaymentMethod.SPLIT)
      expect(cashReports.find(r => r.paymentMethod === PaymentMethod.CREDIT)).toBeUndefined()
    })

    it('should filter card payments correctly including split payments', () => {
      const { result } = renderHook(() => useReports(), {
        wrapper: ({ children }) => wrapper({ user: mockUser, selectedOrgId: 'org1', children })
      })

      const filterReportsByPaymentMethod = (reports, method) => {
        return reports.filter(bill => {
          if (method === PaymentMethod.CARD) {
            return bill.paymentMethod === PaymentMethod.CARD || (bill.paymentMethod === PaymentMethod.SPLIT && bill.paymentDetails?.cardAmount > 0)
          }
          return false
        })
      }

      const cardReports = filterReportsByPaymentMethod(mockPaymentMethodLogs, PaymentMethod.CARD)
      
      expect(cardReports).toHaveLength(2)
      expect(cardReports[0].paymentMethod).toBe(PaymentMethod.CARD)
      expect(cardReports[1].paymentMethod).toBe(PaymentMethod.SPLIT)
      expect(cardReports.find(r => r.paymentMethod === PaymentMethod.CREDIT)).toBeUndefined()
    })

    it('should filter cash and card payments correctly excluding credit', () => {
      const { result } = renderHook(() => useReports(), {
        wrapper: ({ children }) => wrapper({ user: mockUser, selectedOrgId: 'org1', children })
      })

      const filterReportsByPaymentMethod = (reports, method) => {
        return reports.filter(bill => {
          if (method === 'cashcard') {
            return bill.paymentMethod === PaymentMethod.CASH || bill.paymentMethod === PaymentMethod.CARD || bill.paymentMethod === PaymentMethod.SPLIT
          }
          return false
        })
      }

      const cashCardReports = filterReportsByPaymentMethod(mockPaymentMethodLogs, 'cashcard')
      
      expect(cashCardReports).toHaveLength(3)
      expect(cashCardReports.find(r => r.paymentMethod === PaymentMethod.CASH)).toBeDefined()
      expect(cashCardReports.find(r => r.paymentMethod === PaymentMethod.CARD)).toBeDefined()
      expect(cashCardReports.find(r => r.paymentMethod === PaymentMethod.SPLIT)).toBeDefined()
      expect(cashCardReports.find(r => r.paymentMethod === PaymentMethod.CREDIT)).toBeUndefined()
    })

    it('should calculate payment method summary correctly for cash payments', () => {
      const { result } = renderHook(() => useReports(), {
        wrapper: ({ children }) => wrapper({ user: mockUser, selectedOrgId: 'org1', children })
      })

      const calculatePaymentMethodSummary = (reports, method) => {
        const filteredReports = reports.filter(bill => {
          if (method === PaymentMethod.CASH) {
            return bill.paymentMethod === PaymentMethod.CASH || (bill.paymentMethod === PaymentMethod.SPLIT && bill.paymentDetails?.cashAmount > 0)
          }
          return false
        })

        let totalAmount = 0
        let grossSales = 0
        let totalDiscounts = 0
        
        filteredReports.forEach(bill => {
          grossSales += bill.cart ? bill.cart.reduce((sum, item) => sum + (item.price * item.qty), 0) : 0
          totalDiscounts += bill.discountAmount || 0
          
          if (method === PaymentMethod.CASH && bill.paymentMethod === PaymentMethod.SPLIT) {
            totalAmount += bill.paymentDetails?.cashAmount || 0
          } else {
            totalAmount += bill.total || 0
          }
        })
        
        return {
          transactionCount: filteredReports.length,
          grossSales,
          totalDiscounts,
          netSales: grossSales - totalDiscounts,
          totalAmount
        }
      }

      const cashSummary = calculatePaymentMethodSummary(mockPaymentMethodLogs, PaymentMethod.CASH)
      
      expect(cashSummary.transactionCount).toBe(2)
      expect(cashSummary.grossSales).toBe(225) // 100 (cash) + 125 (split)
      expect(cashSummary.totalDiscounts).toBe(0)
      expect(cashSummary.netSales).toBe(225)
      expect(cashSummary.totalAmount).toBe(175) // 100 (cash) + 75 (split cash portion)
    })

    it('should calculate payment method summary correctly for card payments', () => {
      const { result } = renderHook(() => useReports(), {
        wrapper: ({ children }) => wrapper({ user: mockUser, selectedOrgId: 'org1', children })
      })

      const calculatePaymentMethodSummary = (reports, method) => {
        const filteredReports = reports.filter(bill => {
          if (method === PaymentMethod.CARD) {
            return bill.paymentMethod === PaymentMethod.CARD || (bill.paymentMethod === PaymentMethod.SPLIT && bill.paymentDetails?.cardAmount > 0)
          }
          return false
        })

        let totalAmount = 0
        let grossSales = 0
        let totalDiscounts = 0
        
        filteredReports.forEach(bill => {
          grossSales += bill.cart ? bill.cart.reduce((sum, item) => sum + (item.price * item.qty), 0) : 0
          totalDiscounts += bill.discountAmount || 0
          
          if (method === PaymentMethod.CARD && bill.paymentMethod === PaymentMethod.SPLIT) {
            totalAmount += bill.paymentDetails?.cardAmount || 0
          } else {
            totalAmount += bill.total || 0
          }
        })
        
        return {
          transactionCount: filteredReports.length,
          grossSales,
          totalDiscounts,
          netSales: grossSales - totalDiscounts,
          totalAmount
        }
      }

      const cardSummary = calculatePaymentMethodSummary(mockPaymentMethodLogs, PaymentMethod.CARD)
      
      expect(cardSummary.transactionCount).toBe(2)
      expect(cardSummary.grossSales).toBe(200.5) // 75.50 (card) + 125 (split)
      expect(cardSummary.totalDiscounts).toBe(0)
      expect(cardSummary.netSales).toBe(200.5)
      expect(cardSummary.totalAmount).toBe(125.50) // 75.50 (card) + 50 (split card portion)
    })

    it('should handle split payment breakdown correctly', () => {
      const { result } = renderHook(() => useReports(), {
        wrapper: ({ children }) => wrapper({ user: mockUser, selectedOrgId: 'org1', children })
      })

      const splitPayments = mockPaymentMethodLogs.filter(bill => bill.paymentMethod === PaymentMethod.SPLIT)
      
      expect(splitPayments).toHaveLength(1)
      expect(splitPayments[0].paymentDetails.cashAmount).toBe(75.00)
      expect(splitPayments[0].paymentDetails.cardAmount).toBe(50.00)
      expect(splitPayments[0].paymentDetails.creditAmount).toBe(0)
      expect(splitPayments[0].total).toBe(125.00)
    })

    it('should handle missing payment details gracefully', () => {
      const { result } = renderHook(() => useReports(), {
        wrapper: ({ children }) => wrapper({ user: mockUser, selectedOrgId: 'org1', children })
      })

      const incompleteSplitLog = {
        ...mockPaymentMethodLogs[2],
        paymentDetails: null // Missing payment details
      }

      const filterReportsByPaymentMethod = (reports, method) => {
        return reports.filter(bill => {
          if (method === PaymentMethod.CASH) {
            return bill.paymentMethod === PaymentMethod.CASH || (bill.paymentMethod === PaymentMethod.SPLIT && bill.paymentDetails?.cashAmount > 0)
          }
          return false
        })
      }

      const cashReports = filterReportsByPaymentMethod([incompleteSplitLog], PaymentMethod.CASH)
      
      // Should not include the incomplete split payment in cash reports
      expect(cashReports).toHaveLength(0)
    })

    it('should handle zero amount split payments correctly', () => {
      const { result } = renderHook(() => useReports(), {
        wrapper: ({ children }) => wrapper({ user: mockUser, selectedOrgId: 'org1', children })
      })

      const zeroSplitLog = {
        ...mockPaymentMethodLogs[2],
        paymentDetails: {
          cashAmount: 0,
          cardAmount: 125.00,
          creditAmount: 0
        }
      }

      const filterReportsByPaymentMethod = (reports, method) => {
        return reports.filter(bill => {
          if (method === PaymentMethod.CASH) {
            return bill.paymentMethod === PaymentMethod.CASH || (bill.paymentMethod === PaymentMethod.SPLIT && bill.paymentDetails?.cashAmount > 0)
          } else if (method === PaymentMethod.CARD) {
            return bill.paymentMethod === PaymentMethod.CARD || (bill.paymentMethod === PaymentMethod.SPLIT && bill.paymentDetails?.cardAmount > 0)
          }
          return false
        })
      }

      const cashReports = filterReportsByPaymentMethod([zeroSplitLog], PaymentMethod.CASH)
      const cardReports = filterReportsByPaymentMethod([zeroSplitLog], PaymentMethod.CARD)
      
      // Should only include in card reports, not cash reports
      expect(cashReports).toHaveLength(0)
      expect(cardReports).toHaveLength(1)
    })
  })
})
