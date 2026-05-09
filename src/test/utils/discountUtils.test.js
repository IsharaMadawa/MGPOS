import { describe, it, expect, test } from 'vitest'
import { getItemDiscountDetails, getCartDiscountBreakdown, formatDiscountForReport, getDiscountSummary } from '../../utils/discountUtils.js'
import { DiscountType, DiscountMode, DiscountSource } from '../../constants/enums.js'

describe('Discount Utils', () => {
  const baseSettings = {
    discountMode: DiscountMode.GLOBAL,
    globalDiscount: 10,
    taxEnabled: true,
    taxRate: 8,
    categoryDiscounts: {
      'electronics': {
        enabled: true,
        type: DiscountType.PERCENTAGE,
        value: 15
      },
      'clothing': {
        enabled: true,
        type: DiscountType.FIXED,
        value: 5
      }
    }
  }

  const testItem = {
    id: 'item1',
    name: 'Test Item',
    price: 100,
    qty: 2,
    category: 'electronics'
  }

  describe('getItemDiscountDetails', () => {
    it('should return no discount for item without discounts', () => {
      const result = getItemDiscountDetails(testItem, baseSettings)
      expect(result.amount).toBe(0)
      expect(result.type).toBe(null)
      expect(result.percentage).toBe(0)
      expect(result.source).toBe(null)
      expect(result.description).toBe('')
    })

    it('should handle custom cart discount', () => {
      const itemWithCartDiscount = { ...testItem, cartDiscount: '15' }
      const result = getItemDiscountDetails(itemWithCartDiscount, baseSettings)
      
      expect(result.amount).toBe(15)
      expect(result.type).toBe(DiscountType.CURRENCY)
      expect(result.percentage).toBe(7.5) // 15/200 * 100
      expect(result.source).toBe(DiscountSource.CUSTOM)
      expect(result.description).toBe('Custom: 15.00 (7.5%)')
    })

    it('should handle item-level percentage discount', () => {
      const itemSettings = { ...baseSettings, discountMode: DiscountMode.ITEM }
      const itemWithDiscount = {
        ...testItem,
        discount: { enabled: true, type: DiscountType.PERCENTAGE, value: 20 }
      }
      
      const result = getItemDiscountDetails(itemWithDiscount, itemSettings)
      
      expect(result.amount).toBe(40) // 200 * 20%
      expect(result.type).toBe(DiscountType.PERCENTAGE)
      expect(result.percentage).toBe(20)
      expect(result.source).toBe(DiscountSource.ITEM)
      expect(result.description).toBe('Item: 20%')
    })

    it('should handle item-level fixed discount', () => {
      const itemSettings = { ...baseSettings, discountMode: DiscountMode.ITEM }
      const itemWithDiscount = {
        ...testItem,
        discount: { enabled: true, type: DiscountType.FIXED, value: 10 }
      }
      
      const result = getItemDiscountDetails(itemWithDiscount, itemSettings)
      
      expect(result.amount).toBe(20) // 10 * 2 qty
      expect(result.type).toBe(DiscountType.FIXED)
      expect(result.percentage).toBe(10) // 20/200 * 100
      expect(result.source).toBe(DiscountSource.ITEM)
      expect(result.description).toBe('Item: 10.00 each (10.0%)')
    })

    it('should handle category percentage discount', () => {
      const categorySettings = { ...baseSettings, discountMode: DiscountMode.CATEGORY }
      const result = getItemDiscountDetails(testItem, categorySettings)
      
      expect(result.amount).toBe(30) // 200 * 15%
      expect(result.type).toBe(DiscountType.PERCENTAGE)
      expect(result.percentage).toBe(15)
      expect(result.source).toBe(DiscountSource.CATEGORY)
      expect(result.description).toBe('Category (electronics): 15%')
    })

    it('should handle category fixed discount', () => {
      const categorySettings = { ...baseSettings, discountMode: DiscountMode.CATEGORY }
      const clothingItem = { ...testItem, category: 'clothing' }
      
      const result = getItemDiscountDetails(clothingItem, categorySettings)
      
      expect(result.amount).toBe(10) // 5 * 2 qty
      expect(result.type).toBe(DiscountType.FIXED)
      expect(result.percentage).toBe(5) // 10/200 * 100
      expect(result.source).toBe(DiscountSource.CATEGORY)
      expect(result.description).toBe('Category (clothing): 5.00 each (5.0%)')
    })

    it('should handle invalid cart discount values', () => {
      const itemWithInvalidDiscount = { ...testItem, cartDiscount: 'invalid' }
      const result = getItemDiscountDetails(itemWithInvalidDiscount, baseSettings)
      
      expect(result.amount).toBe(0)
      expect(result.type).toBe(null)
      expect(result.source).toBe(null)
    })

    it('should cap discount to line total', () => {
      const itemWithLargeDiscount = { ...testItem, cartDiscount: '500' }
      const result = getItemDiscountDetails(itemWithLargeDiscount, baseSettings)
      
      expect(result.amount).toBe(200) // Capped to line total
    })
  })

  describe('getCartDiscountBreakdown', () => {
    const testCart = [
      {
        id: 'item1',
        name: 'Laptop',
        price: 1000,
        qty: 1,
        category: 'electronics',
        discount: { enabled: true, type: DiscountType.PERCENTAGE, value: 10 }
      },
      {
        id: 'item2',
        name: 'Mouse',
        price: 50,
        qty: 2,
        category: 'electronics'
      },
      {
        id: 'item3',
        name: 'Keyboard',
        price: 100,
        qty: 1,
        cartDiscount: '15'
      }
    ]

    it('should calculate correct breakdown for item mode', () => {
      const itemSettings = { ...baseSettings, discountMode: DiscountMode.ITEM }
      const result = getCartDiscountBreakdown(testCart, itemSettings)
      
      expect(result.totalDiscount).toBe(115) // 100 (laptop) + 15 (keyboard)
      expect(result.globalDiscount).toBe(0)
      expect(result.discountMode).toBe(DiscountMode.ITEM)
      expect(result.itemDiscounts).toHaveLength(3)
      
      const laptopDiscount = result.itemDiscounts.find(item => item.itemName === 'Laptop')
      expect(laptopDiscount.discount.amount).toBe(100)
      expect(laptopDiscount.discount.description).toBe('Item: 10%')
    })

    it('should calculate correct breakdown for global mode', () => {
      const result = getCartDiscountBreakdown(testCart, baseSettings)
      
      // Custom discount: 15 (keyboard) = 15
      // Subtotal after custom discount: 1200 - 15 = 1185
      // Global discount: 1185 * 10% = 118.5
      expect(result.totalDiscount).toBe(133.5) // 15 + 118.5
      expect(result.globalDiscount).toBe(118.5)
      expect(result.discountMode).toBe(DiscountMode.GLOBAL)
    })

    it('should calculate correct breakdown for category mode', () => {
      const categorySettings = { ...baseSettings, discountMode: DiscountMode.CATEGORY }
      const result = getCartDiscountBreakdown(testCart, categorySettings)
      
      // Laptop: 1000 * 15% = 150
      // Mouse: 100 * 15% = 15
      // Keyboard: 15 (custom)
      expect(result.totalDiscount).toBe(180)
      expect(result.globalDiscount).toBe(0)
      expect(result.discountMode).toBe(DiscountMode.CATEGORY)
    })

    it('should handle empty cart', () => {
      const result = getCartDiscountBreakdown([], baseSettings)
      
      expect(result.totalDiscount).toBe(0)
      expect(result.itemDiscounts).toHaveLength(0)
      expect(result.globalDiscount).toBe(0)
    })

    it('should handle null cart', () => {
      const result = getCartDiscountBreakdown(null, baseSettings)
      
      expect(result.totalDiscount).toBe(0)
      expect(result.itemDiscounts).toHaveLength(0)
      expect(result.globalDiscount).toBe(0)
    })
  })

  describe('formatDiscountForReport', () => {
    it('should format discount details correctly', () => {
      const discountDetails = {
        amount: 50,
        type: DiscountType.PERCENTAGE,
        percentage: 10,
        source: DiscountSource.ITEM,
        description: 'Item: 10%'
      }
      
      const result = formatDiscountForReport(discountDetails)
      expect(result).toBe('Item: 10%')
    })

    it('should return "No discount" for zero amount', () => {
      const discountDetails = {
        amount: 0,
        type: null,
        percentage: 0,
        source: null,
        description: ''
      }
      
      const result = formatDiscountForReport(discountDetails)
      expect(result).toBe('No discount')
    })

    it('should return "No discount" for null input', () => {
      const result = formatDiscountForReport(null)
      expect(result).toBe('No discount')
    })
  })

  describe('getDiscountSummary', () => {
    const testCart = [
      {
        id: 'item1',
        name: 'Laptop',
        price: 1000,
        qty: 1,
        category: 'electronics',
        discount: { enabled: true, type: DiscountType.PERCENTAGE, value: 10 }
      },
      {
        id: 'item2',
        name: 'Mouse',
        price: 50,
        qty: 1,
        category: 'electronics'
      }
    ]

    it('should provide comprehensive discount summary', () => {
      const itemSettings = { ...baseSettings, discountMode: DiscountMode.ITEM }
      const result = getDiscountSummary(testCart, itemSettings)
      
      expect(result.totalItems).toBe(2)
      expect(result.itemsWithDiscount).toBe(1)
      expect(result.totalItemDiscount).toBe(100)
      expect(result.globalDiscount).toBe(0)
      expect(result.totalDiscount).toBe(100)
      expect(result.discountMode).toBe(DiscountMode.ITEM)
      expect(result.discountBreakdown).toHaveLength(2)
    })

    it('should handle empty cart in summary', () => {
      const result = getDiscountSummary([], baseSettings)
      
      expect(result.totalItems).toBe(0)
      expect(result.itemsWithDiscount).toBe(0)
      expect(result.totalDiscount).toBe(0)
      expect(result.discountBreakdown).toHaveLength(0)
    })
  })

  describe('Edge Cases', () => {
    it('should handle missing settings gracefully', () => {
      const result = getItemDiscountDetails(testItem, null)
      expect(result.amount).toBe(0)
      expect(result.source).toBe(null)
    })

    it('should handle missing category discounts', () => {
      const settingsWithoutCategories = { ...baseSettings, categoryDiscounts: {} }
      const categorySettings = { ...settingsWithoutCategories, discountMode: DiscountMode.CATEGORY }
      
      const result = getItemDiscountDetails(testItem, categorySettings)
      expect(result.amount).toBe(0)
      expect(result.source).toBe(null)
    })

    it('should handle disabled category discounts', () => {
      const categorySettings = {
        ...baseSettings,
        discountMode: DiscountMode.CATEGORY,
        categoryDiscounts: {
          ...baseSettings.categoryDiscounts,
          electronics: {
            ...baseSettings.categoryDiscounts.electronics,
            enabled: false
          }
        }
      }
      
      const result = getItemDiscountDetails(testItem, categorySettings)
      expect(result.amount).toBe(0)
      expect(result.source).toBe(null)
    })
  })
})
