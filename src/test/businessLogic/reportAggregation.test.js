import { describe, it, expect, beforeEach } from 'vitest'

// Extracted report aggregation functions from useReports.js
function calculateSummary(logs) {
  if (!logs || logs.length === 0) {
    return {
      totalSales: 0,
      grossSales: 0,
      totalDiscounts: 0,
      netSales: 0,
      totalTax: 0,
      transactionCount: 0,
      itemCount: 0,
    }
  }

  let grossSales = 0
  let totalDiscounts = 0
  let netSales = 0
  let totalTax = 0
  let itemCount = 0

  logs.forEach(log => {
    // Calculate true gross amount from cart items (price × quantity before any discounts)
    const trueGross = log.cart ? log.cart.reduce((sum, item) => sum + (item.price * item.qty), 0) : 0
    grossSales += trueGross
    
    // Calculate total discounts (item-level + global)
    let itemDiscounts = 0
    if (log.cart) {
      itemDiscounts = log.cart.reduce((sum, item) => {
        const lineTotal = item.price * item.qty
        // Re-calculate item discount using the same logic as CartPanel
        let itemDiscount = 0
        if (item.cartDiscount != null && item.cartDiscount !== '') {
          const val = parseFloat(item.cartDiscount) || 0
          itemDiscount = Math.min(Math.max(val, 0), lineTotal)
        } else if (item.discount?.enabled) {
          if (item.discount.type === 'percentage') {
            itemDiscount = lineTotal * (item.discount.value / 100)
          } else {
            itemDiscount = Math.min(item.discount.value * item.qty, lineTotal)
          }
        }
        return sum + itemDiscount
      }, 0)
    }
    
    const globalDiscount = log.discountAmount || 0
    totalDiscounts += itemDiscounts + globalDiscount
    
    // Net sales should be gross minus discounts (excluding tax)
    netSales += (trueGross - itemDiscounts - globalDiscount)
    
    totalTax += log.taxAmount || 0
    itemCount += log.itemCount || 0
  })

  return {
    totalSales: grossSales,
    grossSales,
    totalDiscounts,
    netSales,
    totalTax,
    transactionCount: logs.length,
    itemCount,
  }
}

function getCashierBreakdown(logs) {
  const cashierMap = new Map()
  
  logs.forEach(log => {
    const cashier = log.cashierName || 'Unknown'
    if (!cashierMap.has(cashier)) {
      cashierMap.set(cashier, {
        cashierName: cashier,
        transactionCount: 0,
        totalSales: 0,
        grossSales: 0,
        totalDiscounts: 0,
        netSales: 0,
      })
    }
    
    // Calculate true gross amount from cart items
    const trueGross = log.cart ? log.cart.reduce((sum, item) => sum + (item.price * item.qty), 0) : 0
    
    // Calculate item discounts
    let itemDiscounts = 0
    if (log.cart) {
      itemDiscounts = log.cart.reduce((sum, item) => {
        const lineTotal = item.price * item.qty
        let itemDiscount = 0
        if (item.cartDiscount != null && item.cartDiscount !== '') {
          const val = parseFloat(item.cartDiscount) || 0
          itemDiscount = Math.min(Math.max(val, 0), lineTotal)
        } else if (item.discount?.enabled) {
          if (item.discount.type === 'percentage') {
            itemDiscount = lineTotal * (item.discount.value / 100)
          } else {
            itemDiscount = Math.min(item.discount.value * item.qty, lineTotal)
          }
        }
        return sum + itemDiscount
      }, 0)
    }
    
    const globalDiscount = log.discountAmount || 0
    const totalDiscounts = itemDiscounts + globalDiscount
    const netSales = trueGross - totalDiscounts
    
    const data = cashierMap.get(cashier)
    data.transactionCount += 1
    data.totalSales += trueGross
    data.grossSales += trueGross
    data.totalDiscounts += totalDiscounts
    data.netSales += netSales
  })

  return Array.from(cashierMap.values()).sort((a, b) => b.netSales - a.netSales)
}

function getDailyBreakdown(logs) {
  const dailyMap = new Map()
  
  logs.forEach(log => {
    let date
    try {
      date = new Date(log.createdAt).toISOString().split('T')[0]
    } catch (error) {
      // Handle invalid dates by using a fallback date
      date = 'invalid-date'
    }
    
    if (!dailyMap.has(date)) {
      dailyMap.set(date, {
        date,
        transactionCount: 0,
        grossSales: 0,
        totalDiscounts: 0,
        netSales: 0,
      })
    }
    
    // Calculate true gross amount from cart items
    const trueGross = log.cart ? log.cart.reduce((sum, item) => sum + (item.price * item.qty), 0) : 0
    
    // Calculate item discounts
    let itemDiscounts = 0
    if (log.cart) {
      itemDiscounts = log.cart.reduce((sum, item) => {
        const lineTotal = item.price * item.qty
        let itemDiscount = 0
        if (item.cartDiscount != null && item.cartDiscount !== '') {
          const val = parseFloat(item.cartDiscount) || 0
          itemDiscount = Math.min(Math.max(val, 0), lineTotal)
        } else if (item.discount?.enabled) {
          if (item.discount.type === 'percentage') {
            itemDiscount = lineTotal * (item.discount.value / 100)
          } else {
            itemDiscount = Math.min(item.discount.value * item.qty, lineTotal)
          }
        }
        return sum + itemDiscount
      }, 0)
    }
    
    const globalDiscount = log.discountAmount || 0
    const totalDiscounts = itemDiscounts + globalDiscount
    const netSales = trueGross - totalDiscounts
    
    const data = dailyMap.get(date)
    data.transactionCount += 1
    data.grossSales += trueGross
    data.totalDiscounts += totalDiscounts
    data.netSales += netSales
  })

  return Array.from(dailyMap.values()).sort((a, b) => b.date.localeCompare(a.date))
}

function getItemDiscount(item) {
  const lineTotal = item.price * item.qty
  let itemDiscount = 0
  if (item.cartDiscount != null && item.cartDiscount !== '') {
    const val = parseFloat(item.cartDiscount) || 0
    itemDiscount = Math.min(Math.max(val, 0), lineTotal)
  } else if (item.discount?.enabled) {
    if (item.discount.type === 'percentage') {
      itemDiscount = lineTotal * (item.discount.value / 100)
    } else {
      itemDiscount = Math.min(item.discount.value * item.qty, lineTotal)
    }
  }
  return itemDiscount
}

describe('Report Aggregation Business Logic', () => {
  const sampleLog = {
    id: 'log1',
    createdAt: '2024-03-15T10:30:00.000Z',
    cashierName: 'John Doe',
    cart: [
      {
        id: 'item1',
        name: 'Product A',
        price: 10,
        qty: 2,
        discount: { enabled: true, type: 'percentage', value: 10 }
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
    taxAmount: 2,
    itemCount: 5
  }

  const sampleLog2 = {
    id: 'log2',
    createdAt: '2024-03-15T14:30:00.000Z',
    cashierName: 'Jane Smith',
    cart: [
      {
        id: 'item3',
        name: 'Product C',
        price: 20,
        qty: 1
      }
    ],
    discountAmount: 0,
    taxAmount: 1,
    itemCount: 1
  }

  describe('calculateSummary', () => {
    it('should return zero values for empty logs', () => {
      const result = calculateSummary([])
      
      expect(result.totalSales).toBe(0)
      expect(result.grossSales).toBe(0)
      expect(result.totalDiscounts).toBe(0)
      expect(result.netSales).toBe(0)
      expect(result.totalTax).toBe(0)
      expect(result.transactionCount).toBe(0)
      expect(result.itemCount).toBe(0)
    })

    it('should return zero values for null/undefined logs', () => {
      const result1 = calculateSummary(null)
      const result2 = calculateSummary(undefined)
      
      expect(result1.totalSales).toBe(0)
      expect(result2.totalSales).toBe(0)
    })

    it('should calculate basic summary correctly', () => {
      const logs = [sampleLog]
      const result = calculateSummary(logs)
      
      // Gross: (10 * 2) + (5 * 3) = 35
      // Item discounts: (20 * 0.10) + 2 = 4
      // Total discounts: 4 + 5 = 9
      // Net sales: 35 - 9 = 26
      expect(result.grossSales).toBe(35)
      expect(result.totalDiscounts).toBe(9)
      expect(result.netSales).toBe(26)
      expect(result.totalTax).toBe(2)
      expect(result.transactionCount).toBe(1)
      expect(result.itemCount).toBe(5)
    })

    it('should calculate summary for multiple logs', () => {
      const logs = [sampleLog, sampleLog2]
      const result = calculateSummary(logs)
      
      // Log 1: Gross 35, Discounts 9, Net 26, Tax 2, Items 5
      // Log 2: Gross 20, Discounts 0, Net 20, Tax 1, Items 1
      // Total: Gross 55, Discounts 9, Net 46, Tax 3, Items 6
      expect(result.grossSales).toBe(55)
      expect(result.totalDiscounts).toBe(9)
      expect(result.netSales).toBe(46)
      expect(result.totalTax).toBe(3)
      expect(result.transactionCount).toBe(2)
      expect(result.itemCount).toBe(6)
    })

    it('should handle logs without cart', () => {
      const logWithoutCart = {
        ...sampleLog,
        cart: null
      }
      const result = calculateSummary([logWithoutCart])
      
      expect(result.grossSales).toBe(0)
      expect(result.totalDiscounts).toBe(5) // Only global discount
      expect(result.netSales).toBe(-5) // 0 - 5
    })

    it('should handle logs with empty cart', () => {
      const logWithEmptyCart = {
        ...sampleLog,
        cart: []
      }
      const result = calculateSummary([logWithEmptyCart])
      
      expect(result.grossSales).toBe(0)
      expect(result.totalDiscounts).toBe(5) // Only global discount
      expect(result.netSales).toBe(-5) // 0 - 5
    })

    it('should handle complex discount scenarios', () => {
      const complexLog = {
        ...sampleLog,
        cart: [
          {
            id: 'item1',
            price: 100,
            qty: 2,
            discount: { enabled: true, type: 'fixed', value: 10 }
          },
          {
            id: 'item2',
            price: 50,
            qty: 1,
            discount: { enabled: true, type: 'percentage', value: 20 }
          }
        ],
        discountAmount: 15
      }
      const result = calculateSummary([complexLog])
      
      // Gross: (100 * 2) + (50 * 1) = 250
      // Item discounts: (10 * 2) + (50 * 0.20) = 20 + 10 = 30
      // Total discounts: 30 + 15 = 45
      // Net sales: 250 - 45 = 205
      expect(result.grossSales).toBe(250)
      expect(result.totalDiscounts).toBe(45)
      expect(result.netSales).toBe(205)
    })
  })

  describe('getCashierBreakdown', () => {
    it('should return empty array for empty logs', () => {
      const result = getCashierBreakdown([])
      expect(result).toEqual([])
    })

    it('should break down by cashier correctly', () => {
      const logs = [sampleLog, sampleLog2]
      const result = getCashierBreakdown(logs)
      
      expect(result).toHaveLength(2)
      
      const johnBreakdown = result.find(c => c.cashierName === 'John Doe')
      const janeBreakdown = result.find(c => c.cashierName === 'Jane Smith')
      
      expect(johnBreakdown).toBeDefined()
      expect(janeBreakdown).toBeDefined()
      
      // John's breakdown
      expect(johnBreakdown.transactionCount).toBe(1)
      expect(johnBreakdown.grossSales).toBe(35)
      expect(johnBreakdown.totalDiscounts).toBe(9)
      expect(johnBreakdown.netSales).toBe(26)
      
      // Jane's breakdown
      expect(janeBreakdown.transactionCount).toBe(1)
      expect(janeBreakdown.grossSales).toBe(20)
      expect(janeBreakdown.totalDiscounts).toBe(0)
      expect(janeBreakdown.netSales).toBe(20)
    })

    it('should group multiple transactions by cashier', () => {
      const johnLog2 = {
        ...sampleLog,
        id: 'log3',
        createdAt: '2024-03-15T16:30:00.000Z',
        cart: [{ id: 'item4', price: 15, qty: 2 }]
      }
      const logs = [sampleLog, johnLog2, sampleLog2]
      const result = getCashierBreakdown(logs)
      
      expect(result).toHaveLength(2)
      
      const johnBreakdown = result.find(c => c.cashierName === 'John Doe')
      expect(johnBreakdown.transactionCount).toBe(2)
      expect(johnBreakdown.grossSales).toBe(35 + 30) // 35 from first + 30 from second
    })

    it('should handle unknown cashier names', () => {
      const unknownLog = {
        ...sampleLog,
        cashierName: null
      }
      const result = getCashierBreakdown([unknownLog])
      
      expect(result).toHaveLength(1)
      expect(result[0].cashierName).toBe('Unknown')
    })

    it('should sort by net sales descending', () => {
      const logs = [sampleLog2, sampleLog] // Jane first, John second
      const result = getCashierBreakdown(logs)
      
      // John has higher net sales (26 vs 20), so should be first
      expect(result[0].cashierName).toBe('John Doe')
      expect(result[1].cashierName).toBe('Jane Smith')
    })
  })

  describe('getDailyBreakdown', () => {
    it('should return empty array for empty logs', () => {
      const result = getDailyBreakdown([])
      expect(result).toEqual([])
    })

    it('should break down by date correctly', () => {
      const logs = [sampleLog, sampleLog2]
      const result = getDailyBreakdown(logs)
      
      expect(result).toHaveLength(1) // Both logs are on the same date
      expect(result[0].date).toBe('2024-03-15')
      expect(result[0].transactionCount).toBe(2)
      expect(result[0].grossSales).toBe(55) // 35 + 20
      expect(result[0].totalDiscounts).toBe(9) // 9 + 0
      expect(result[0].netSales).toBe(46) // 26 + 20
    })

    it('should handle multiple dates', () => {
      const nextDayLog = {
        ...sampleLog,
        id: 'log3',
        createdAt: '2024-03-16T10:30:00.000Z'
      }
      const logs = [sampleLog, sampleLog2, nextDayLog]
      const result = getDailyBreakdown(logs)
      
      expect(result).toHaveLength(2)
      
      const todayBreakdown = result.find(d => d.date === '2024-03-15')
      const tomorrowBreakdown = result.find(d => d.date === '2024-03-16')
      
      expect(todayBreakdown.transactionCount).toBe(2)
      expect(tomorrowBreakdown.transactionCount).toBe(1)
    })

    it('should sort by date descending', () => {
      const yesterdayLog = {
        ...sampleLog,
        createdAt: '2024-03-14T10:30:00.000Z'
      }
      const tomorrowLog = {
        ...sampleLog,
        createdAt: '2024-03-16T10:30:00.000Z'
      }
      const logs = [yesterdayLog, sampleLog, tomorrowLog]
      const result = getDailyBreakdown(logs)
      
      expect(result[0].date).toBe('2024-03-16') // Most recent
      expect(result[1].date).toBe('2024-03-15')
      expect(result[2].date).toBe('2024-03-14') // Oldest
    })

    it('should handle invalid dates gracefully', () => {
      const invalidLog = {
        ...sampleLog,
        createdAt: 'invalid-date'
      }
      const result = getDailyBreakdown([invalidLog])
      
      expect(result).toHaveLength(1)
      // Should create a date entry with fallback value
      expect(result[0].date).toBe('invalid-date')
    })
  })

  describe('getItemDiscount', () => {
    it('should calculate percentage discount correctly', () => {
      const item = {
        price: 100,
        qty: 2,
        discount: { enabled: true, type: 'percentage', value: 10 }
      }
      const result = getItemDiscount(item)
      expect(result).toBe(20) // 200 * 0.10
    })

    it('should calculate fixed discount correctly', () => {
      const item = {
        price: 100,
        qty: 2,
        discount: { enabled: true, type: 'fixed', value: 10 }
      }
      const result = getItemDiscount(item)
      expect(result).toBe(20) // 10 * 2
    })

    it('should handle cart discount override', () => {
      const item = {
        price: 100,
        qty: 2,
        discount: { enabled: true, type: 'percentage', value: 10 },
        cartDiscount: '15'
      }
      const result = getItemDiscount(item)
      expect(result).toBe(15) // Cart override takes precedence
    })

    it('should cap discount to line total', () => {
      const item = {
        price: 10,
        qty: 1,
        discount: { enabled: true, type: 'fixed', value: 15 }
      }
      const result = getItemDiscount(item)
      expect(result).toBe(10) // Capped to line total
    })

    it('should return zero for disabled discount', () => {
      const item = {
        price: 100,
        qty: 2,
        discount: { enabled: false, type: 'percentage', value: 10 }
      }
      const result = getItemDiscount(item)
      expect(result).toBe(0)
    })

    it('should return zero for no discount', () => {
      const item = {
        price: 100,
        qty: 2
      }
      const result = getItemDiscount(item)
      expect(result).toBe(0)
    })

    it('should handle invalid cart discount values', () => {
      const item = {
        price: 100,
        qty: 2,
        cartDiscount: 'invalid'
      }
      const result = getItemDiscount(item)
      expect(result).toBe(0)
    })

    it('should handle negative cart discount values', () => {
      const item = {
        price: 100,
        qty: 2,
        cartDiscount: '-5'
      }
      const result = getItemDiscount(item)
      expect(result).toBe(0) // Negative values are clamped to 0
    })
  })

  describe('Complex aggregation scenarios', () => {
    it('should handle large dataset efficiently', () => {
      const largeLogs = Array.from({ length: 1000 }, (_, i) => ({
        id: `log${i}`,
        createdAt: '2024-03-15T10:30:00.000Z',
        cashierName: `Cashier${i % 10}`,
        cart: [{ id: 'item1', price: 10, qty: 1 }],
        discountAmount: 0,
        taxAmount: 0,
        itemCount: 1
      }))
      
      const summary = calculateSummary(largeLogs)
      const cashierBreakdown = getCashierBreakdown(largeLogs)
      const dailyBreakdown = getDailyBreakdown(largeLogs)
      
      expect(summary.transactionCount).toBe(1000)
      expect(summary.grossSales).toBe(10000)
      expect(cashierBreakdown).toHaveLength(10)
      expect(dailyBreakdown).toHaveLength(1)
    })

    it('should handle edge case values correctly', () => {
      const edgeLog = {
        id: 'edge1',
        createdAt: '2024-03-15T10:30:00.000Z',
        cashierName: 'Edge Cashier',
        cart: [
          { id: 'item1', price: 0, qty: 1 },
          { id: 'item2', price: 1000000, qty: 1 },
          { id: 'item3', price: 0.01, qty: 100 }
        ],
        discountAmount: 0,
        taxAmount: 0,
        itemCount: 102
      }
      
      const summary = calculateSummary([edgeLog])
      expect(summary.grossSales).toBe(1000001) // 0 + 1000000 + 1
      expect(summary.itemCount).toBe(102)
    })

    it('should maintain consistency across all aggregation functions', () => {
      const logs = [sampleLog, sampleLog2]
      
      const summary = calculateSummary(logs)
      const cashierBreakdown = getCashierBreakdown(logs)
      const dailyBreakdown = getDailyBreakdown(logs)
      
      // Check that totals match across functions
      const totalFromCashier = cashierBreakdown.reduce((sum, c) => sum + c.grossSales, 0)
      const totalFromDaily = dailyBreakdown.reduce((sum, d) => sum + d.grossSales, 0)
      
      expect(summary.grossSales).toBe(totalFromCashier)
      expect(summary.grossSales).toBe(totalFromDaily)
    })
  })
})
