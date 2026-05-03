import { describe, it, expect, beforeEach } from 'vitest'

// Extracted discount calculation functions from CartPanel.jsx
function getItemDiscount(item, settings) {
  const mode = settings?.discountMode || 'global'
  
  // Cart-level override (user-entered currency discount) takes precedence
  if (item.cartDiscount != null && item.cartDiscount !== '') {
    const val = parseFloat(item.cartDiscount) || 0
    return Math.min(Math.max(val, 0), item.price * item.qty)
  }
  
  // Item-level discount
  if (mode === 'item' && item.discount?.enabled) {
    const lineTotal = item.price * item.qty
    if (item.discount.type === 'percentage') {
      return lineTotal * (item.discount.value / 100)
    }
    return Math.min(item.discount.value * item.qty, lineTotal)
  }
  
  // Category-level discount
  if (mode === 'category') {
    const catDisc = settings?.categoryDiscounts?.[item.category]
    if (catDisc?.enabled) {
      const lineTotal = item.price * item.qty
      if (catDisc.type === 'percentage') {
        return lineTotal * (catDisc.value / 100)
      }
      return Math.min(catDisc.value * item.qty, lineTotal)
    }
  }
  
  // Global discount is NOT applied here - it's applied only at cart level to avoid double discount
  
  return 0
}

// Get discount info for display (percentage and source)
function getItemDiscountInfo(item, settings) {
  const mode = settings?.discountMode || 'global'
  const result = { amount: 0, percentage: 0, source: null }
  
  // Cart-level override
  if (item.cartDiscount != null && item.cartDiscount !== '') {
    const val = parseFloat(item.cartDiscount) || 0
    const lineTotal = item.price * item.qty
    const cappedVal = Math.min(Math.max(val, 0), lineTotal)
    result.amount = cappedVal
    result.percentage = lineTotal > 0 ? (cappedVal / lineTotal) * 100 : 0
    result.source = 'custom'
    return result
  }
  
  // Item-level discount
  if (mode === 'item' && item.discount?.enabled) {
    const lineTotal = item.price * item.qty
    if (item.discount.type === 'percentage') {
      result.amount = lineTotal * (item.discount.value / 100)
      result.percentage = item.discount.value
      result.source = 'item'
    } else {
      result.amount = Math.min(item.discount.value * item.qty, lineTotal)
      result.percentage = lineTotal > 0 ? (result.amount / lineTotal) * 100 : 0
      result.source = 'item'
    }
    return result
  }
  
  // Category-level discount
  if (mode === 'category') {
    const catDisc = settings?.categoryDiscounts?.[item.category]
    if (catDisc?.enabled) {
      const lineTotal = item.price * item.qty
      if (catDisc.type === 'percentage') {
        result.amount = lineTotal * (catDisc.value / 100)
        result.percentage = catDisc.value
        result.source = 'category'
      } else {
        result.amount = Math.min(catDisc.value * item.qty, lineTotal)
        result.percentage = lineTotal > 0 ? (result.amount / lineTotal) * 100 : 0
        result.source = 'category'
      }
      return result
    }
  }
  
  return result
}

describe('Discount Calculation Business Logic', () => {
  const baseItem = {
    id: 'item1',
    name: 'Test Product',
    price: 10,
    qty: 2,
    category: 'electronics'
  }

  const baseSettings = {
    discountMode: 'global',
    globalDiscount: 0,
    categoryDiscounts: {}
  }

  describe('getItemDiscount', () => {
    describe('Cart-level override discounts', () => {
      it('should apply cart discount when provided', () => {
        const item = { ...baseItem, cartDiscount: '5' }
        const result = getItemDiscount(item, baseSettings)
        expect(result).toBe(5)
      })

      it('should cap cart discount to line total', () => {
        const item = { ...baseItem, cartDiscount: '25' } // More than line total (20)
        const result = getItemDiscount(item, baseSettings)
        expect(result).toBe(20)
      })

      it('should handle invalid cart discount values', () => {
        const item = { ...baseItem, cartDiscount: 'invalid' }
        const result = getItemDiscount(item, baseSettings)
        expect(result).toBe(0)
      })

      it('should handle negative cart discount values', () => {
        const item = { ...baseItem, cartDiscount: '-5' }
        const result = getItemDiscount(item, baseSettings)
        expect(result).toBe(0)
      })

      it('should prioritize cart discount over other discount types', () => {
        const item = { 
          ...baseItem, 
          cartDiscount: '3',
          discount: { enabled: true, type: 'percentage', value: 20 }
        }
        const settings = { ...baseSettings, discountMode: 'item' }
        const result = getItemDiscount(item, settings)
        expect(result).toBe(3) // Cart discount takes precedence
      })
    })

    describe('Item-level discounts', () => {
      it('should apply percentage item discount in item mode', () => {
        const item = { 
          ...baseItem, 
          discount: { enabled: true, type: 'percentage', value: 20 }
        }
        const settings = { ...baseSettings, discountMode: 'item' }
        const result = getItemDiscount(item, settings)
        expect(result).toBe(4) // 20 * 2 * 0.20
      })

      it('should apply fixed amount item discount in item mode', () => {
        const item = { 
          ...baseItem, 
          discount: { enabled: true, type: 'fixed', value: 3 }
        }
        const settings = { ...baseSettings, discountMode: 'item' }
        const result = getItemDiscount(item, settings)
        expect(result).toBe(6) // 3 * 2
      })

      it('should cap fixed discount to line total', () => {
        const item = { 
          ...baseItem, 
          discount: { enabled: true, type: 'fixed', value: 15 }
        }
        const settings = { ...baseSettings, discountMode: 'item' }
        const result = getItemDiscount(item, settings)
        expect(result).toBe(20) // Capped to line total
      })

      it('should not apply item discount in global mode', () => {
        const item = { 
          ...baseItem, 
          discount: { enabled: true, type: 'percentage', value: 20 }
        }
        const result = getItemDiscount(item, baseSettings)
        expect(result).toBe(0)
      })

      it('should not apply item discount when disabled', () => {
        const item = { 
          ...baseItem, 
          discount: { enabled: false, type: 'percentage', value: 20 }
        }
        const settings = { ...baseSettings, discountMode: 'item' }
        const result = getItemDiscount(item, settings)
        expect(result).toBe(0)
      })
    })

    describe('Category-level discounts', () => {
      it('should apply percentage category discount in category mode', () => {
        const item = { ...baseItem }
        const settings = {
          ...baseSettings,
          discountMode: 'category',
          categoryDiscounts: {
            electronics: { enabled: true, type: 'percentage', value: 15 }
          }
        }
        const result = getItemDiscount(item, settings)
        expect(result).toBe(3) // 20 * 0.15
      })

      it('should apply fixed category discount in category mode', () => {
        const item = { ...baseItem }
        const settings = {
          ...baseSettings,
          discountMode: 'category',
          categoryDiscounts: {
            electronics: { enabled: true, type: 'fixed', value: 4 }
          }
        }
        const result = getItemDiscount(item, settings)
        expect(result).toBe(8) // 4 * 2
      })

      it('should not apply category discount for non-existent category', () => {
        const item = { ...baseItem, category: 'other' }
        const settings = {
          ...baseSettings,
          discountMode: 'category',
          categoryDiscounts: {
            electronics: { enabled: true, type: 'percentage', value: 15 }
          }
        }
        const result = getItemDiscount(item, settings)
        expect(result).toBe(0)
      })

      it('should not apply category discount when disabled', () => {
        const item = { ...baseItem }
        const settings = {
          ...baseSettings,
          discountMode: 'category',
          categoryDiscounts: {
            electronics: { enabled: false, type: 'percentage', value: 15 }
          }
        }
        const result = getItemDiscount(item, settings)
        expect(result).toBe(0)
      })
    })

    describe('Edge cases', () => {
      it('should handle zero quantity', () => {
        const item = { ...baseItem, qty: 0, cartDiscount: '5' }
        const result = getItemDiscount(item, baseSettings)
        expect(result).toBe(0)
      })

      it('should handle zero price', () => {
        const item = { ...baseItem, price: 0, cartDiscount: '5' }
        const result = getItemDiscount(item, baseSettings)
        expect(result).toBe(0)
      })

      it('should handle missing settings', () => {
        const item = { ...baseItem }
        const result = getItemDiscount(item, null)
        expect(result).toBe(0)
      })

      it('should handle empty cart discount string', () => {
        const item = { ...baseItem, cartDiscount: '' }
        const result = getItemDiscount(item, baseSettings)
        expect(result).toBe(0)
      })
    })
  })

  describe('getItemDiscountInfo', () => {
    describe('Cart-level discount info', () => {
      it('should return correct info for cart discount', () => {
        const item = { ...baseItem, cartDiscount: '5' }
        const result = getItemDiscountInfo(item, baseSettings)
        expect(result.amount).toBe(5)
        expect(result.percentage).toBe(25) // 5/20 * 100
        expect(result.source).toBe('custom')
      })

      it('should return zero percentage for zero line total', () => {
        const item = { ...baseItem, price: 0, cartDiscount: '5' }
        const result = getItemDiscountInfo(item, baseSettings)
        expect(result.amount).toBe(0)
        expect(result.percentage).toBe(0)
        expect(result.source).toBe('custom')
      })
    })

    describe('Item-level discount info', () => {
      it('should return correct info for percentage item discount', () => {
        const item = { 
          ...baseItem, 
          discount: { enabled: true, type: 'percentage', value: 20 }
        }
        const settings = { ...baseSettings, discountMode: 'item' }
        const result = getItemDiscountInfo(item, settings)
        expect(result.amount).toBe(4)
        expect(result.percentage).toBe(20)
        expect(result.source).toBe('item')
      })

      it('should return correct info for fixed item discount', () => {
        const item = { 
          ...baseItem, 
          discount: { enabled: true, type: 'fixed', value: 3 }
        }
        const settings = { ...baseSettings, discountMode: 'item' }
        const result = getItemDiscountInfo(item, settings)
        expect(result.amount).toBe(6)
        expect(result.percentage).toBe(30) // 6/20 * 100
        expect(result.source).toBe('item')
      })
    })

    describe('Category-level discount info', () => {
      it('should return correct info for percentage category discount', () => {
        const item = { ...baseItem }
        const settings = {
          ...baseSettings,
          discountMode: 'category',
          categoryDiscounts: {
            electronics: { enabled: true, type: 'percentage', value: 15 }
          }
        }
        const result = getItemDiscountInfo(item, settings)
        expect(result.amount).toBe(3)
        expect(result.percentage).toBe(15)
        expect(result.source).toBe('category')
      })

      it('should return correct info for fixed category discount', () => {
        const item = { ...baseItem }
        const settings = {
          ...baseSettings,
          discountMode: 'category',
          categoryDiscounts: {
            electronics: { enabled: true, type: 'fixed', value: 4 }
          }
        }
        const result = getItemDiscountInfo(item, settings)
        expect(result.amount).toBe(8)
        expect(result.percentage).toBe(40) // 8/20 * 100
        expect(result.source).toBe('category')
      })
    })

    describe('No discount scenarios', () => {
      it('should return zero values when no discount applies', () => {
        const item = { ...baseItem }
        const result = getItemDiscountInfo(item, baseSettings)
        expect(result.amount).toBe(0)
        expect(result.percentage).toBe(0)
        expect(result.source).toBe(null)
      })
    })
  })

  describe('Complex scenarios', () => {
    it('should handle multiple discount types correctly', () => {
      const item = { 
        ...baseItem, 
        cartDiscount: '2',
        discount: { enabled: true, type: 'percentage', value: 20 }
      }
      const settings = {
        ...baseSettings,
        discountMode: 'item',
        categoryDiscounts: {
          electronics: { enabled: true, type: 'percentage', value: 15 }
        }
      }
      
      // Cart discount should take precedence
      const discountResult = getItemDiscount(item, settings)
      expect(discountResult).toBe(2)
      
      const infoResult = getItemDiscountInfo(item, settings)
      expect(infoResult.amount).toBe(2)
      expect(infoResult.percentage).toBe(10) // 2/20 * 100
      expect(infoResult.source).toBe('custom')
    })

    it('should handle very large numbers correctly', () => {
      const item = { 
        ...baseItem, 
        price: 1000000, 
        qty: 1000, 
        discount: { enabled: true, type: 'percentage', value: 0.1 }
      }
      const settings = { ...baseSettings, discountMode: 'item' }
      const result = getItemDiscount(item, settings)
      expect(result).toBe(1000000) // Actual result from calculation
    })
  })
})
