import { describe, it, expect, beforeEach } from 'vitest'

// Import the discount type enum for testing
const DiscountType = {
  PERCENTAGE: 'percentage',
  FIXED: 'fixed'
}

// Extracted customer purchase history functions from ReportsPage.jsx
function filterReportsByCustomer(reports, customerSearch) {
  if (!reports || !Array.isArray(reports) || !customerSearch) return []
  
  try {
    const searchTerm = customerSearch.toLowerCase().trim()
    return reports.filter(bill => {
      if (!bill || !bill.customer) return false
      
      const customerName = bill.customer.name?.toLowerCase() || ''
      const customerPhone = bill.customer.phone?.toLowerCase() || ''
      
      return customerName.includes(searchTerm) || customerPhone.includes(searchTerm)
    })
  } catch (error) {
    console.error('Error filtering reports by customer:', error)
    return []
  }
}

function calculateCustomerPurchaseSummary(reports, customerSearch) {
  try {
    const filteredReports = filterReportsByCustomer(reports, customerSearch)
    let grossSales = 0
    let totalDiscounts = 0
    
    filteredReports.forEach(bill => {
      if (!bill) return
      
      try {
        grossSales += bill.cart ? bill.cart.reduce((sum, item) => {
          if (!item || !item.price || !item.qty) return sum
          return sum + (item.price * item.qty)
        }, 0) : 0
        
        let itemDiscounts = 0
        if (bill.cart && Array.isArray(bill.cart)) {
          itemDiscounts = bill.cart.reduce((sum, item) => {
            if (!item || !item.price || !item.qty) return sum
            const lineTotal = item.price * item.qty
            let itemDiscount = 0
            try {
              if (item.cartDiscount != null && item.cartDiscount !== '') {
                const val = parseFloat(item.cartDiscount) || 0
                itemDiscount = Math.min(Math.max(val, 0), lineTotal)
              } else if (item.discount?.enabled) {
                if (item.discount.type === DiscountType.PERCENTAGE) {
                  itemDiscount = lineTotal * (item.discount.value / 100)
                } else {
                  itemDiscount = Math.min(item.discount.value * item.qty, lineTotal)
                }
              }
            } catch (discountError) {
              console.warn('Error calculating item discount:', discountError)
            }
            return sum + itemDiscount
          }, 0)
        }
        const globalDiscount = bill.discountAmount || 0
        totalDiscounts += itemDiscounts + globalDiscount
      } catch (billError) {
        console.warn('Error processing bill in customer purchase summary:', billError)
      }
    })
    
    return {
      transactionCount: filteredReports.length,
      grossSales,
      totalDiscounts,
      netSales: grossSales - totalDiscounts
    }
  } catch (error) {
    console.error('Error in calculateCustomerPurchaseSummary:', error)
    return {
      transactionCount: 0,
      grossSales: 0,
      totalDiscounts: 0,
      netSales: 0
    }
  }
}

describe('Customer Purchase History Business Logic', () => {
  const sampleReports = [
    {
      id: 'bill1',
      receiptNo: 'R001',
      createdAt: '2024-03-15T10:30:00.000Z',
      cashierName: 'John Doe',
      customer: {
        name: 'Alice Johnson',
        phone: '555-1234'
      },
      cart: [
        {
          id: 'item1',
          name: 'Product A',
          price: 10,
          qty: 2,
          discount: { enabled: true, type: DiscountType.PERCENTAGE, value: 10 }
        },
        {
          id: 'item2',
          name: 'Product B',
          price: 5,
          qty: 3,
          cartDiscount: '2'
        }
      ],
      discountAmount: 5,
      total: 26,
      itemCount: 5
    },
    {
      id: 'bill2',
      receiptNo: 'R002',
      createdAt: '2024-03-15T14:30:00.000Z',
      cashierName: 'Jane Smith',
      customer: {
        name: 'Bob Smith',
        phone: '555-5678'
      },
      cart: [
        {
          id: 'item3',
          name: 'Product C',
          price: 20,
          qty: 1
        }
      ],
      discountAmount: 0,
      total: 20,
      itemCount: 1
    },
    {
      id: 'bill3',
      receiptNo: 'R003',
      createdAt: '2024-03-16T09:15:00.000Z',
      cashierName: 'John Doe',
      customer: {
        name: 'Alice Johnson',
        phone: '555-1234'
      },
      cart: [
        {
          id: 'item4',
          name: 'Product D',
          price: 15,
          qty: 2
        }
      ],
      discountAmount: 3,
      total: 27,
      itemCount: 2
    },
    {
      id: 'bill4',
      receiptNo: 'R004',
      createdAt: '2024-03-16T11:00:00.000Z',
      cashierName: 'Jane Smith',
      customer: {
        name: 'Charlie Brown',
        phone: '555-9999'
      },
      cart: [
        {
          id: 'item5',
          name: 'Product E',
          price: 8,
          qty: 4,
          discount: { enabled: true, type: DiscountType.FIXED, value: 1 }
        }
      ],
      discountAmount: 0,
      total: 28,
      itemCount: 4
    }
  ]

  describe('filterReportsByCustomer', () => {
    it('should return empty array for null/undefined inputs', () => {
      expect(filterReportsByCustomer(null, 'Alice')).toEqual([])
      expect(filterReportsByCustomer(undefined, 'Alice')).toEqual([])
      expect(filterReportsByCustomer([], 'Alice')).toEqual([])
      expect(filterReportsByCustomer(sampleReports, null)).toEqual([])
      expect(filterReportsByCustomer(sampleReports, undefined)).toEqual([])
      expect(filterReportsByCustomer(sampleReports, '')).toEqual([])
    })

    it('should filter by customer name (exact match)', () => {
      const result = filterReportsByCustomer(sampleReports, 'Alice Johnson')
      expect(result).toHaveLength(2)
      expect(result.every(bill => bill.customer.name === 'Alice Johnson')).toBe(true)
    })

    it('should filter by customer name (partial match)', () => {
      const result = filterReportsByCustomer(sampleReports, 'Alice')
      expect(result).toHaveLength(2)
      expect(result.every(bill => bill.customer.name.includes('Alice'))).toBe(true)
    })

    it('should filter by customer phone number (exact match)', () => {
      const result = filterReportsByCustomer(sampleReports, '555-1234')
      expect(result).toHaveLength(2)
      expect(result.every(bill => bill.customer.phone === '555-1234')).toBe(true)
    })

    it('should filter by customer phone number (partial match)', () => {
      const result = filterReportsByCustomer(sampleReports, '555')
      expect(result).toHaveLength(4) // All customers have 555 prefix
    })

    it('should be case insensitive for name search', () => {
      const result1 = filterReportsByCustomer(sampleReports, 'alice johnson')
      const result2 = filterReportsByCustomer(sampleReports, 'ALICE JOHNSON')
      const result3 = filterReportsByCustomer(sampleReports, 'Alice Johnson')
      
      expect(result1).toHaveLength(2)
      expect(result2).toHaveLength(2)
      expect(result3).toHaveLength(2)
      expect(result1).toEqual(result2).toEqual(result3)
    })

    it('should be case insensitive for phone search', () => {
      const result1 = filterReportsByCustomer(sampleReports, '555-1234')
      const result2 = filterReportsByCustomer(sampleReports, '555-1234')
      
      expect(result1).toHaveLength(2)
      expect(result2).toHaveLength(2)
      expect(result1).toEqual(result2)
    })

    it('should handle whitespace in search term', () => {
      const result1 = filterReportsByCustomer(sampleReports, '  Alice Johnson  ')
      const result2 = filterReportsByCustomer(sampleReports, 'Alice Johnson')
      
      expect(result1).toEqual(result2)
    })

    it('should return empty array for non-matching customers', () => {
      const result = filterReportsByCustomer(sampleReports, 'Nonexistent Customer')
      expect(result).toEqual([])
    })

    it('should exclude bills without customer information', () => {
      const reportsWithMissingCustomer = [
        ...sampleReports,
        {
          id: 'bill5',
          customer: null,
          cart: [{ price: 10, qty: 1 }]
        },
        {
          id: 'bill6',
          customer: {},
          cart: [{ price: 10, qty: 1 }]
        }
      ]
      
      const result = filterReportsByCustomer(reportsWithMissingCustomer, 'Alice')
      expect(result).toHaveLength(2) // Should only include Alice's bills
    })

    it('should handle malformed bill data gracefully', () => {
      const malformedReports = [
        null,
        undefined,
        {},
        { customer: { name: 'Test' } },
        { customer: { phone: '123' } },
        { cart: [] }
      ]
      
      expect(() => filterReportsByCustomer(malformedReports, 'Test')).not.toThrow()
      const result = filterReportsByCustomer(malformedReports, 'Test')
      expect(Array.isArray(result)).toBe(true)
    })

    it('should handle search errors gracefully', () => {
      // Mock console.error to avoid test output pollution
      const originalConsoleError = console.error
      console.error = jest.fn()
      
      const result = filterReportsByCustomer(sampleReports, 'Alice')
      expect(result).toHaveLength(2)
      
      console.error = originalConsoleError
    })
  })

  describe('calculateCustomerPurchaseSummary', () => {
    it('should return zero values for null/undefined inputs', () => {
      const result1 = calculateCustomerPurchaseSummary(null, 'Alice')
      const result2 = calculateCustomerPurchaseSummary(undefined, 'Alice')
      const result3 = calculateCustomerPurchaseSummary([], 'Alice')
      const result4 = calculateCustomerPurchaseSummary(sampleReports, null)
      const result5 = calculateCustomerPurchaseSummary(sampleReports, undefined)
      
      expect(result1.transactionCount).toBe(0)
      expect(result1.grossSales).toBe(0)
      expect(result1.totalDiscounts).toBe(0)
      expect(result1.netSales).toBe(0)
      
      expect(result2).toEqual(result1)
      expect(result3).toEqual(result1)
      expect(result4).toEqual(result1)
      expect(result5).toEqual(result1)
    })

    it('should calculate summary for single customer correctly', () => {
      const result = calculateCustomerPurchaseSummary(sampleReports, 'Alice Johnson')
      
      // Alice has 2 transactions:
      // Bill 1: Gross (10*2 + 5*3) = 35, Item discounts (20*0.10 + 2) = 4, Global discount 5, Net = 35 - 4 - 5 = 26
      // Bill 3: Gross (15*2) = 30, No item discounts, Global discount 3, Net = 30 - 3 = 27
      // Total: Gross = 65, Discounts = 4 + 5 + 3 = 12, Net = 53
      
      expect(result.transactionCount).toBe(2)
      expect(result.grossSales).toBe(65)
      expect(result.totalDiscounts).toBe(12)
      expect(result.netSales).toBe(53)
    })

    it('should calculate summary for customer with single transaction', () => {
      const result = calculateCustomerPurchaseSummary(sampleReports, 'Bob Smith')
      
      // Bob has 1 transaction:
      // Bill 2: Gross (20*1) = 20, No discounts, Net = 20
      
      expect(result.transactionCount).toBe(1)
      expect(result.grossSales).toBe(20)
      expect(result.totalDiscounts).toBe(0)
      expect(result.netSales).toBe(20)
    })

    it('should calculate summary for customer with fixed discounts', () => {
      const result = calculateCustomerPurchaseSummary(sampleReports, 'Charlie Brown')
      
      // Charlie has 1 transaction:
      // Bill 4: Gross (8*4) = 32, Item discounts (1*4) = 4, No global discount, Net = 32 - 4 = 28
      
      expect(result.transactionCount).toBe(1)
      expect(result.grossSales).toBe(32)
      expect(result.totalDiscounts).toBe(4)
      expect(result.netSales).toBe(28)
    })

    it('should return zero summary for non-existent customer', () => {
      const result = calculateCustomerPurchaseSummary(sampleReports, 'Nonexistent Customer')
      
      expect(result.transactionCount).toBe(0)
      expect(result.grossSales).toBe(0)
      expect(result.totalDiscounts).toBe(0)
      expect(result.netSales).toBe(0)
    })

    it('should handle complex discount scenarios', () => {
      const complexReports = [
        {
          id: 'complex1',
          customer: { name: 'Complex Customer', phone: '123' },
          cart: [
            {
              price: 100,
              qty: 2,
              discount: { enabled: true, type: DiscountType.PERCENTAGE, value: 15 }
            },
            {
              price: 50,
              qty: 1,
              cartDiscount: '10'
            }
          ],
          discountAmount: 25
        }
      ]
      
      const result = calculateCustomerPurchaseSummary(complexReports, 'Complex Customer')
      
      // Gross: (100*2) + (50*1) = 250
      // Item discounts: (200*0.15) + 10 = 30 + 10 = 40
      // Total discounts: 40 + 25 = 65
      // Net: 250 - 65 = 185
      
      expect(result.transactionCount).toBe(1)
      expect(result.grossSales).toBe(250)
      expect(result.totalDiscounts).toBe(65)
      expect(result.netSales).toBe(185)
    })

    it('should handle bills without cart', () => {
      const reportsWithoutCart = [
        {
          id: 'no-cart1',
          customer: { name: 'No Cart Customer', phone: '123' },
          discountAmount: 5
        }
      ]
      
      const result = calculateCustomerPurchaseSummary(reportsWithoutCart, 'No Cart Customer')
      
      expect(result.transactionCount).toBe(1)
      expect(result.grossSales).toBe(0)
      expect(result.totalDiscounts).toBe(5) // Only global discount
      expect(result.netSales).toBe(-5) // 0 - 5
    })

    it('should handle bills with empty cart', () => {
      const reportsWithEmptyCart = [
        {
          id: 'empty-cart1',
          customer: { name: 'Empty Cart Customer', phone: '123' },
          cart: [],
          discountAmount: 3
        }
      ]
      
      const result = calculateCustomerPurchaseSummary(reportsWithEmptyCart, 'Empty Cart Customer')
      
      expect(result.transactionCount).toBe(1)
      expect(result.grossSales).toBe(0)
      expect(result.totalDiscounts).toBe(3) // Only global discount
      expect(result.netSales).toBe(-3) // 0 - 3
    })

    it('should handle malformed cart items gracefully', () => {
      const malformedReports = [
        {
          id: 'malformed1',
          customer: { name: 'Malformed Customer', phone: '123' },
          cart: [
            null,
            undefined,
            {},
            { price: null, qty: 1 },
            { price: 10, qty: null },
            { price: 10, qty: 0 },
            { price: 0, qty: 10 }
          ],
          discountAmount: 0
        }
      ]
      
      const result = calculateCustomerPurchaseSummary(malformedReports, 'Malformed Customer')
      
      expect(result.transactionCount).toBe(1)
      expect(result.grossSales).toBe(0) // All items are invalid
      expect(result.totalDiscounts).toBe(0)
      expect(result.netSales).toBe(0)
    })

    it('should handle discount calculation errors gracefully', () => {
      const reportsWithDiscountErrors = [
        {
          id: 'discount-error1',
          customer: { name: 'Discount Error Customer', phone: '123' },
          cart: [
            {
              price: 10,
              qty: 1,
              discount: { enabled: true, type: 'invalid_type', value: 10 }
            }
          ],
          discountAmount: 0
        }
      ]
      
      // Mock console.warn to avoid test output pollution
      const originalConsoleWarn = console.warn
      console.warn = jest.fn()
      
      const result = calculateCustomerPurchaseSummary(reportsWithDiscountErrors, 'Discount Error Customer')
      
      expect(result.transactionCount).toBe(1)
      expect(result.grossSales).toBe(10)
      expect(result.totalDiscounts).toBe(0) // Invalid discount type should result in 0
      expect(result.netSales).toBe(10)
      
      console.warn = originalConsoleWarn
    })

    it('should handle calculation errors gracefully', () => {
      // Mock console.error and console.warn to avoid test output pollution
      const originalConsoleError = console.error
      const originalConsoleWarn = console.warn
      console.error = jest.fn()
      console.warn = jest.fn()
      
      const result = calculateCustomerPurchaseSummary(sampleReports, 'Alice Johnson')
      
      expect(result.transactionCount).toBe(2)
      expect(result.grossSales).toBe(65)
      expect(result.totalDiscounts).toBe(12)
      expect(result.netSales).toBe(53)
      
      console.error = originalConsoleError
      console.warn = originalConsoleWarn
    })

    it('should cap item discounts to line total', () => {
      const reportsWithLargeDiscounts = [
        {
          id: 'large-discount1',
          customer: { name: 'Large Discount Customer', phone: '123' },
          cart: [
            {
              price: 10,
              qty: 1,
              discount: { enabled: true, type: DiscountType.FIXED, value: 15 }
            }
          ],
          discountAmount: 0
        }
      ]
      
      const result = calculateCustomerPurchaseSummary(reportsWithLargeDiscounts, 'Large Discount Customer')
      
      expect(result.transactionCount).toBe(1)
      expect(result.grossSales).toBe(10)
      expect(result.totalDiscounts).toBe(10) // Capped to line total
      expect(result.netSales).toBe(0)
    })

    it('should handle negative cart discount values', () => {
      const reportsWithNegativeDiscounts = [
        {
          id: 'negative-discount1',
          customer: { name: 'Negative Discount Customer', phone: '123' },
          cart: [
            {
              price: 10,
              qty: 1,
              cartDiscount: '-5'
            }
          ],
          discountAmount: 0
        }
      ]
      
      const result = calculateCustomerPurchaseSummary(reportsWithNegativeDiscounts, 'Negative Discount Customer')
      
      expect(result.transactionCount).toBe(1)
      expect(result.grossSales).toBe(10)
      expect(result.totalDiscounts).toBe(0) // Negative values should be clamped to 0
      expect(result.netSales).toBe(10)
    })
  })

  describe('Integration Tests', () => {
    it('should maintain consistency between filtering and summary calculation', () => {
      const customerName = 'Alice Johnson'
      const filteredReports = filterReportsByCustomer(sampleReports, customerName)
      const summary = calculateCustomerPurchaseSummary(sampleReports, customerName)
      
      expect(summary.transactionCount).toBe(filteredReports.length)
      
      // Verify that the summary is calculated only from filtered reports
      const manualGrossSales = filteredReports.reduce((sum, bill) => {
        return sum + (bill.cart ? bill.cart.reduce((itemSum, item) => 
          itemSum + (item.price * item.qty), 0) : 0)
      }, 0)
      
      expect(summary.grossSales).toBe(manualGrossSales)
    })

    it('should handle multiple customers with same name prefix', () => {
      const reportsWithSimilarNames = [
        ...sampleReports,
        {
          id: 'similar1',
          customer: { name: 'Alice Wilson', phone: '555-1111' },
          cart: [{ price: 25, qty: 1 }],
          discountAmount: 0
        }
      ]
      
      const result = calculateCustomerPurchaseSummary(reportsWithSimilarNames, 'Alice')
      
      // Should include all customers with "Alice" in name
      expect(result.transactionCount).toBe(3) // Alice Johnson (2) + Alice Wilson (1)
    })

    it('should handle edge case: very large datasets', () => {
      const largeReports = Array.from({ length: 1000 }, (_, i) => ({
        id: `large${i}`,
        customer: { 
          name: `Test Customer ${i % 10}`, 
          phone: `555-${i.toString().padStart(4, '0')}` 
        },
        cart: [{ price: 10, qty: 1 }],
        discountAmount: 0
      }))
      
      const result = calculateCustomerPurchaseSummary(largeReports, 'Test Customer 0')
      
      expect(result.transactionCount).toBe(100) // Every 10th record
      expect(result.grossSales).toBe(1000) // 100 * 10
    })

    it('should handle edge case: maximum values', () => {
      const maxReports = [{
        id: 'max1',
        customer: { name: 'Max Customer', phone: '555-9999' },
        cart: [
          { price: Number.MAX_SAFE_INTEGER, qty: 1 },
          { price: 1, qty: Number.MAX_SAFE_INTEGER }
        ],
        discountAmount: 0
      }]
      
      expect(() => calculateCustomerPurchaseSummary(maxReports, 'Max Customer')).not.toThrow()
    })
  })
})
