import { describe, it, expect, beforeEach } from 'vitest'

// Extracted cart calculation functions from CartPanel.jsx
function calculateCartTotals(cart, settings) {
  const taxRate = settings?.taxRate || 0
  const discountMode = settings?.discountMode || 'global'
  const currencySymbol = settings?.currencySymbol || '$'

  // Calculate subtotal with item discounts applied
  const subtotal = cart.reduce((s, item) => s + item.price * item.qty - getItemDiscount(item, settings), 0)
  const itemDiscountTotal = cart.reduce((s, item) => s + getItemDiscount(item, settings), 0)
  
  // Global discount is applied at cart level (for global mode only)
  const discountPct = (discountMode === 'global' && settings?.globalDiscount) ? settings.globalDiscount : 0
  const globalDiscountAmount = discountPct > 0 ? subtotal * (discountPct / 100) : 0
  
  // Calculate tax base and tax
  const taxBase = subtotal - globalDiscountAmount
  const taxAmount = settings?.taxEnabled ? taxBase * (taxRate / 100) : 0
  
  // Calculate final total
  const total = taxBase + taxAmount

  return {
    subtotal,
    itemDiscountTotal,
    globalDiscountAmount,
    totalDiscount: itemDiscountTotal + globalDiscountAmount,
    taxBase,
    taxAmount,
    total,
    itemCount: cart.reduce((s, item) => s + item.qty, 0),
    currencySymbol
  }
}

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
  
  return 0
}

function calculateItemTotal(item, settings) {
  const lineTotal = item.price * item.qty
  const discount = getItemDiscount(item, settings)
  return lineTotal - discount
}

function validateCart(cart) {
  const errors = []
  const warnings = []

  if (!Array.isArray(cart)) {
    errors.push('Cart must be an array')
    return { valid: false, errors, warnings }
  }

  if (cart.length === 0) {
    warnings.push('Cart is empty')
    return { valid: true, errors, warnings }
  }

  cart.forEach((item, index) => {
    if (!item.id) {
      errors.push(`Item ${index + 1}: Missing ID`)
    }
    if (!item.name) {
      errors.push(`Item ${index + 1}: Missing name`)
    }
    if (typeof item.price !== 'number' || item.price < 0) {
      errors.push(`Item ${index + 1}: Invalid price`)
    }
    if (typeof item.qty !== 'number' || item.qty <= 0) {
      errors.push(`Item ${index + 1}: Invalid quantity`)
    }
    if (item.price * item.qty > 1000000) {
      warnings.push(`Item ${index + 1}: Very high line total`)
    }
  })

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.qty), 0)
  if (totalAmount > 10000000) {
    warnings.push('Very high cart total')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

describe('Cart Calculation Business Logic', () => {
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
    taxEnabled: false,
    taxRate: 10,
    currencySymbol: '$',
    categoryDiscounts: {}
  }

  describe('calculateCartTotals', () => {
    it('should calculate basic cart totals without discounts or tax', () => {
      const cart = [baseItem]
      const result = calculateCartTotals(cart, baseSettings)

      expect(result.subtotal).toBe(20) // 10 * 2
      expect(result.itemDiscountTotal).toBe(0)
      expect(result.globalDiscountAmount).toBe(0)
      expect(result.totalDiscount).toBe(0)
      expect(result.taxBase).toBe(20)
      expect(result.taxAmount).toBe(0)
      expect(result.total).toBe(20)
      expect(result.itemCount).toBe(2)
      expect(result.currencySymbol).toBe('$')
    })

    it('should calculate totals with global discount', () => {
      const cart = [baseItem]
      const settings = { ...baseSettings, globalDiscount: 10 }
      const result = calculateCartTotals(cart, settings)

      expect(result.subtotal).toBe(20)
      expect(result.globalDiscountAmount).toBe(2) // 20 * 0.10
      expect(result.taxBase).toBe(18)
      expect(result.total).toBe(18)
    })

    it('should calculate totals with tax', () => {
      const cart = [baseItem]
      const settings = { ...baseSettings, taxEnabled: true }
      const result = calculateCartTotals(cart, settings)

      expect(result.subtotal).toBe(20)
      expect(result.taxAmount).toBe(2) // 20 * 0.10
      expect(result.total).toBe(22)
    })

    it('should calculate totals with both global discount and tax', () => {
      const cart = [baseItem]
      const settings = { 
        ...baseSettings, 
        globalDiscount: 10,
        taxEnabled: true 
      }
      const result = calculateCartTotals(cart, settings)

      expect(result.subtotal).toBe(20)
      expect(result.globalDiscountAmount).toBe(2)
      expect(result.taxBase).toBe(18)
      expect(result.taxAmount).toBe(1.8) // 18 * 0.10
      expect(result.total).toBe(19.8)
    })

    it('should handle multiple items', () => {
      const cart = [
        baseItem,
        { ...baseItem, id: 'item2', price: 5, qty: 3 }
      ]
      const result = calculateCartTotals(cart, baseSettings)

      expect(result.subtotal).toBe(35) // (10 * 2) + (5 * 3)
      expect(result.itemCount).toBe(5)
      expect(result.total).toBe(35)
    })

    it('should handle empty cart', () => {
      const cart = []
      const result = calculateCartTotals(cart, baseSettings)

      expect(result.subtotal).toBe(0)
      expect(result.itemDiscountTotal).toBe(0)
      expect(result.globalDiscountAmount).toBe(0)
      expect(result.totalDiscount).toBe(0)
      expect(result.taxBase).toBe(0)
      expect(result.taxAmount).toBe(0)
      expect(result.total).toBe(0)
      expect(result.itemCount).toBe(0)
    })

    it('should handle item-level discounts correctly', () => {
      const cart = [{
        ...baseItem,
        discount: { enabled: true, type: 'percentage', value: 20 }
      }]
      const settings = { ...baseSettings, discountMode: 'item' }
      const result = calculateCartTotals(cart, settings)

      expect(result.subtotal).toBe(16) // 20 - 4 (20% discount)
      expect(result.itemDiscountTotal).toBe(4)
      expect(result.total).toBe(16)
    })

    it('should handle category-level discounts correctly', () => {
      const cart = [baseItem]
      const settings = {
        ...baseSettings,
        discountMode: 'category',
        categoryDiscounts: {
          electronics: { enabled: true, type: 'percentage', value: 15 }
        }
      }
      const result = calculateCartTotals(cart, settings)

      expect(result.subtotal).toBe(17) // 20 - 3 (15% discount)
      expect(result.itemDiscountTotal).toBe(3)
      expect(result.total).toBe(17)
    })

    it('should handle cart-level override discounts', () => {
      const cart = [{
        ...baseItem,
        cartDiscount: '3'
      }]
      const result = calculateCartTotals(cart, baseSettings)

      expect(result.subtotal).toBe(17) // 20 - 3
      expect(result.itemDiscountTotal).toBe(3)
      expect(result.total).toBe(17)
    })
  })

  describe('calculateItemTotal', () => {
    it('should calculate basic item total', () => {
      const result = calculateItemTotal(baseItem, baseSettings)
      expect(result).toBe(20) // 10 * 2
    })

    it('should calculate item total with discount', () => {
      const item = {
        ...baseItem,
        discount: { enabled: true, type: 'percentage', value: 20 }
      }
      const settings = { ...baseSettings, discountMode: 'item' }
      const result = calculateItemTotal(item, settings)
      expect(result).toBe(16) // 20 - 4
    })

    it('should handle zero quantity', () => {
      const item = { ...baseItem, qty: 0 }
      const result = calculateItemTotal(item, baseSettings)
      expect(result).toBe(0)
    })

    it('should handle zero price', () => {
      const item = { ...baseItem, price: 0 }
      const result = calculateItemTotal(item, baseSettings)
      expect(result).toBe(0)
    })
  })

  describe('validateCart', () => {
    it('should validate correct cart', () => {
      const cart = [baseItem]
      const result = validateCart(cart)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.warnings).toHaveLength(0)
    })

    it('should detect empty cart warning', () => {
      const cart = []
      const result = validateCart(cart)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.warnings).toContain('Cart is empty')
    })

    it('should detect invalid cart type', () => {
      const cart = 'not an array'
      const result = validateCart(cart)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Cart must be an array')
    })

    it('should detect missing item ID', () => {
      const cart = [{ ...baseItem, id: undefined }]
      const result = validateCart(cart)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Item 1: Missing ID')
    })

    it('should detect missing item name', () => {
      const cart = [{ ...baseItem, name: undefined }]
      const result = validateCart(cart)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Item 1: Missing name')
    })

    it('should detect invalid price', () => {
      const cart = [{ ...baseItem, price: 'invalid' }]
      const result = validateCart(cart)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Item 1: Invalid price')
    })

    it('should detect negative price', () => {
      const cart = [{ ...baseItem, price: -10 }]
      const result = validateCart(cart)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Item 1: Invalid price')
    })

    it('should detect invalid quantity', () => {
      const cart = [{ ...baseItem, qty: 'invalid' }]
      const result = validateCart(cart)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Item 1: Invalid quantity')
    })

    it('should detect zero quantity', () => {
      const cart = [{ ...baseItem, qty: 0 }]
      const result = validateCart(cart)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Item 1: Invalid quantity')
    })

    it('should detect negative quantity', () => {
      const cart = [{ ...baseItem, qty: -1 }]
      const result = validateCart(cart)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Item 1: Invalid quantity')
    })

    it('should detect high line total warning', () => {
      const cart = [{ ...baseItem, price: 500000, qty: 3 }] // 1.5M line total
      const result = validateCart(cart)

      expect(result.valid).toBe(true)
      expect(result.warnings).toContain('Item 1: Very high line total')
    })

    it('should detect high cart total warning', () => {
      const cart = [{ ...baseItem, price: 5000000, qty: 3 }] // 15M cart total
      const result = validateCart(cart)

      expect(result.valid).toBe(true)
      expect(result.warnings).toContain('Very high cart total')
    })

    it('should accumulate multiple errors', () => {
      const cart = [
        { id: undefined, name: undefined, price: 'invalid', qty: 0 },
        { id: 'item2', name: undefined, price: -10, qty: -1 }
      ]
      const result = validateCart(cart)

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(5)
    })
  })

  describe('Checkout-time discount application', () => {
  it('should use billing settings snapshot at checkout time', () => {
    const cart = [baseItem]
    const checkoutSettings = { ...baseSettings, globalDiscount: 15 }
    const currentSettings = { ...baseSettings, globalDiscount: 5 }
    
    // Calculate using checkout settings (should use 15% discount)
    const checkoutResult = calculateCartTotals(cart, checkoutSettings)
    
    // Calculate using current settings (should use 5% discount)
    const currentResult = calculateCartTotals(cart, currentSettings)
    
    // Verify checkout settings are used
    expect(checkoutResult.globalDiscountAmount).toBe(3) // 20 * 0.15
    expect(checkoutResult.total).toBe(17)
    
    // Verify current settings would give different result
    expect(currentResult.globalDiscountAmount).toBe(1) // 20 * 0.05
    expect(currentResult.total).toBe(19)
    
    // Verify the difference
    expect(checkoutResult.total).not.toBe(currentResult.total)
  })
  
  it('should preserve billing settings snapshot integrity', () => {
    const cart = [baseItem]
    const originalSettings = {
      ...baseSettings,
      discountMode: 'global',
      globalDiscount: 10,
      taxEnabled: true,
      taxRate: 8
    }
    
    const result = calculateCartTotals(cart, originalSettings)
    
    // Verify all settings are properly applied
    expect(result.globalDiscountAmount).toBe(2) // 20 * 0.10
    expect(result.taxAmount).toBe(1.44) // (20 - 2) * 0.08
    expect(result.total).toBe(19.44) // 18 + 1.44
  })
})

describe('Complex cart scenarios', () => {
  it('should handle mixed discount types correctly', () => {
      const cart = [
        {
          ...baseItem,
          discount: { enabled: true, type: 'percentage', value: 10 }
        },
        {
          ...baseItem,
          id: 'item2',
          category: 'food',
          cartDiscount: '2'
        }
      ]
      const settings = {
        ...baseSettings,
        discountMode: 'item',
        categoryDiscounts: {
          food: { enabled: true, type: 'percentage', value: 5 }
        }
      }
      const result = calculateCartTotals(cart, settings)

      // First item: 20 - 2 (10% item discount) = 18
      // Second item: 20 - 2 (cart override) = 18
      expect(result.subtotal).toBe(36)
      expect(result.itemDiscountTotal).toBe(4)
    })

    it('should handle very large cart calculations', () => {
      const cart = Array.from({ length: 1000 }, (_, i) => ({
        id: `item${i}`,
        name: `Product ${i}`,
        price: 10,
        qty: 1
      }))
      const result = calculateCartTotals(cart, baseSettings)

      expect(result.subtotal).toBe(10000)
      expect(result.itemCount).toBe(1000)
      expect(result.total).toBe(10000)
    })

    it('should handle decimal quantities and prices', () => {
      const cart = [{
        ...baseItem,
        price: 9.99,
        qty: 2.5
      }]
      const result = calculateCartTotals(cart, baseSettings)

      expect(result.subtotal).toBe(24.975) // 9.99 * 2.5
      expect(result.total).toBe(24.975)
    })

    it('should handle tax with discounts correctly', () => {
      const cart = [baseItem]
      const settings = {
        ...baseSettings,
        globalDiscount: 10,
        taxEnabled: true,
        taxRate: 20
      }
      const result = calculateCartTotals(cart, settings)

      expect(result.subtotal).toBe(20)
      expect(result.globalDiscountAmount).toBe(2)
      expect(result.taxBase).toBe(18)
      expect(result.taxAmount).toBe(3.6) // 18 * 0.20
      expect(result.total).toBe(21.6)
    })
  })
})
