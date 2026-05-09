// Utility functions for discount calculations and reporting
import { DiscountType, DiscountMode, DiscountSource, DEFAULT_DISCOUNT_MODE } from '../constants/enums'

// Get discount information for an item with detailed breakdown
export function getItemDiscountDetails(item, settings) {
  const mode = settings?.discountMode || DEFAULT_DISCOUNT_MODE
  const result = {
    amount: 0,
    type: null,
    percentage: 0,
    source: null,
    description: ''
  }
  
  const lineTotal = item.price * item.qty
  
  // Cart-level override (user-entered currency discount) takes precedence
  if (item.cartDiscount != null && item.cartDiscount !== '') {
    const val = parseFloat(item.cartDiscount) || 0
    result.amount = Math.min(Math.max(val, 0), lineTotal)
    result.type = DiscountType.CURRENCY
    result.percentage = lineTotal > 0 ? (result.amount / lineTotal) * 100 : 0
    result.source = DiscountSource.CUSTOM
    result.description = `Custom: ${val.toFixed(2)} (${result.percentage.toFixed(1)}%)`
    return result
  }
  
  // Item-level discount
  if (mode === DiscountMode.ITEM && item.discount?.enabled) {
    if (item.discount.type === DiscountType.PERCENTAGE) {
      result.amount = lineTotal * (item.discount.value / 100)
      result.type = DiscountType.PERCENTAGE
      result.percentage = item.discount.value
      result.source = DiscountSource.ITEM
      result.description = `Item: ${item.discount.value}%`
    } else {
      result.amount = Math.min(item.discount.value * item.qty, lineTotal)
      result.type = DiscountType.FIXED
      result.percentage = lineTotal > 0 ? (result.amount / lineTotal) * 100 : 0
      result.source = DiscountSource.ITEM
      result.description = `Item: ${item.discount.value.toFixed(2)} each (${result.percentage.toFixed(1)}%)`
    }
    return result
  }
  
  // Category-level discount
  if (mode === DiscountMode.CATEGORY) {
    const catDisc = settings?.categoryDiscounts?.[item.category]
    if (catDisc?.enabled) {
      if (catDisc.type === DiscountType.PERCENTAGE) {
        result.amount = lineTotal * (catDisc.value / 100)
        result.type = DiscountType.PERCENTAGE
        result.percentage = catDisc.value
        result.source = DiscountSource.CATEGORY
        result.description = `Category (${item.category}): ${catDisc.value}%`
      } else {
        result.amount = Math.min(catDisc.value * item.qty, lineTotal)
        result.type = DiscountType.FIXED
        result.percentage = lineTotal > 0 ? (result.amount / lineTotal) * 100 : 0
        result.source = DiscountSource.CATEGORY
        result.description = `Category (${item.category}): ${catDisc.value.toFixed(2)} each (${result.percentage.toFixed(1)}%)`
      }
      return result
    }
  }
  
  return result
}

// Get comprehensive discount breakdown for a cart
export function getCartDiscountBreakdown(cart, settings) {
  if (!cart || !Array.isArray(cart)) {
    return {
      totalDiscount: 0,
      itemDiscounts: [],
      globalDiscount: 0,
      discountMode: settings?.discountMode || DEFAULT_DISCOUNT_MODE
    }
  }
  
  const itemDiscounts = cart.map(item => {
    const discountDetails = getItemDiscountDetails(item, settings)
    return {
      itemName: item.name,
      itemId: item.id || item.cartItemId,
      quantity: item.qty,
      price: item.price,
      lineTotal: item.price * item.qty,
      discount: discountDetails
    }
  })
  
  const totalItemDiscounts = itemDiscounts.reduce((sum, item) => sum + item.discount.amount, 0)
  
  // Calculate global discount (only applies in global mode)
  const subtotalAfterItemDiscounts = cart.reduce((sum, item) => {
    const lineTotal = item.price * item.qty
    const discountDetails = getItemDiscountDetails(item, settings)
    return sum + (lineTotal - discountDetails.amount)
  }, 0)
  
  const globalDiscountAmount = (settings?.discountMode === DiscountMode.GLOBAL && settings?.globalDiscount) 
    ? subtotalAfterItemDiscounts * (settings.globalDiscount / 100) 
    : 0
  
  return {
    totalDiscount: totalItemDiscounts + globalDiscountAmount,
    itemDiscounts,
    globalDiscount: globalDiscountAmount,
    discountMode: settings?.discountMode || DEFAULT_DISCOUNT_MODE,
    globalDiscountPercentage: settings?.globalDiscount || 0
  }
}

// Format discount description for reports
export function formatDiscountForReport(discountDetails) {
  if (!discountDetails || discountDetails.amount === 0) {
    return 'No discount'
  }
  
  return discountDetails.description
}

// Get discount summary for reporting
export function getDiscountSummary(cart, settings) {
  const breakdown = getCartDiscountBreakdown(cart, settings)
  
  const summary = {
    totalItems: cart?.length || 0,
    itemsWithDiscount: breakdown.itemDiscounts.filter(item => item.discount.amount > 0).length,
    totalItemDiscount: breakdown.itemDiscounts.reduce((sum, item) => sum + item.discount.amount, 0),
    globalDiscount: breakdown.globalDiscount,
    totalDiscount: breakdown.totalDiscount,
    discountMode: breakdown.discountMode,
    discountBreakdown: breakdown.itemDiscounts.map(item => ({
      name: item.itemName,
      discount: formatDiscountForReport(item.discount),
      amount: item.discount.amount,
      percentage: item.discount.percentage
    }))
  }
  
  return summary
}
