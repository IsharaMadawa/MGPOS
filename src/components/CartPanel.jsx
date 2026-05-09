import { useState } from 'react'
import { CURRENCIES } from '../hooks/useSettings'
import { useAuth } from '../contexts/AuthContext'
import { useBillingLogs } from '../hooks/useBillingLogs'
import { useCustomers } from '../hooks/useCustomers'
import { CreditTransactionType } from '../hooks/useCreditHistory'
import { useToast } from '../components/ToastContainer'
import { getItemDiscountDetails, getCartDiscountBreakdown } from '../utils/discountUtils'
import { DiscountType, DiscountMode, PaymentMethod, DiscountSource, DEFAULT_DISCOUNT_MODE } from '../constants/enums'
import ProductModal from './ProductModal'
import CustomerSearchModal from './CustomerSearchModal'

function fmt(amount, sym) {
  return `${sym}${Number(amount).toFixed(2)}`
}

function formatQty(qty, unit) {
  if (!unit || unit === 'Each') return `${qty}`
  return `${qty} ${unit}`
}

function fmtDate(ts) {
  return new Date(ts).toLocaleDateString()
}

function fmtTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function getItemDiscount(item, settings) {
  const mode = settings?.discountMode || DEFAULT_DISCOUNT_MODE
  
  // Cart-level override (user-entered currency discount) takes precedence
  if (item.cartDiscount != null && item.cartDiscount !== '') {
    const val = parseFloat(item.cartDiscount) || 0
    return Math.min(Math.max(val, 0), item.price * item.qty)
  }
  
  // Item-level discount
  if (mode === DiscountMode.ITEM && item.discount?.enabled) {
    const lineTotal = item.price * item.qty
    if (item.discount.type === DiscountType.PERCENTAGE) {
      return lineTotal * (item.discount.value / 100)
    }
    return Math.min(item.discount.value * item.qty, lineTotal)
  }
  
  // Category-level discount
  if (mode === DiscountMode.CATEGORY) {
    const catDisc = settings?.categoryDiscounts?.[item.category]
    if (catDisc?.enabled) {
      const lineTotal = item.price * item.qty
      if (catDisc.type === DiscountType.PERCENTAGE) {
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
  const mode = settings?.discountMode || DiscountMode.GLOBAL
  const result = { amount: 0, percentage: 0, source: null }
  
  // Cart-level override
  if (item.cartDiscount != null && item.cartDiscount !== '') {
    const val = parseFloat(item.cartDiscount) || 0
    const lineTotal = item.price * item.qty
    const cappedVal = Math.min(Math.max(val, 0), lineTotal)
    result.amount = cappedVal
    result.percentage = lineTotal > 0 ? (cappedVal / lineTotal) * 100 : 0
    result.source = DiscountSource.CUSTOM
    return result
  }
  
  // Item-level discount
  if (mode === DiscountMode.ITEM && item.discount?.enabled) {
    const lineTotal = item.price * item.qty
    if (item.discount.type === DiscountType.PERCENTAGE) {
      result.amount = lineTotal * (item.discount.value / 100)
      result.percentage = item.discount.value
      result.source = DiscountSource.ITEM
    } else {
      result.amount = Math.min(item.discount.value * item.qty, lineTotal)
      result.percentage = lineTotal > 0 ? (result.amount / lineTotal) * 100 : 0
      result.source = DiscountSource.ITEM
    }
    return result
  }
  
  // Category-level discount
  if (mode === DiscountMode.CATEGORY) {
    const catDisc = settings?.categoryDiscounts?.[item.category]
    if (catDisc?.enabled) {
      const lineTotal = item.price * item.qty
      if (catDisc.type === DiscountType.PERCENTAGE) {
        result.amount = lineTotal * (catDisc.value / 100)
        result.percentage = catDisc.value
        result.source = DiscountSource.CATEGORY
      } else {
        result.amount = Math.min(catDisc.value * item.qty, lineTotal)
        result.percentage = lineTotal > 0 ? (result.amount / lineTotal) * 100 : 0
        result.source = DiscountSource.CATEGORY
      }
      return result
    }
  }
  
  return result
}

export default function CartPanel({ cart, onUpdateQty, onUpdateItem, onUpdateItemDiscount, onRemoveItem, onClear, settings, onClose }) {
  const [showReceipt, setShowReceipt] = useState(false)
  const [receiptSnapshot, setReceiptSnapshot] = useState({ no: '', time: null, cart: [], cashierName: '' })
  const [editingItem, setEditingItem] = useState(null)
  const [itemToRemove, setItemToRemove] = useState(null)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState(PaymentMethod.CASH) // cash, card, credit
  const [cashAmount, setCashAmount] = useState('')
  const [cardAmount, setCardAmount] = useState('')
  const [amountGiven, setAmountGiven] = useState('')

  const { userProfile } = useAuth()
  const { createBillingLog } = useBillingLogs()
  const { updateCreditBalance } = useCustomers()
  const { addToast } = useToast()

  const sym = CURRENCIES.find(c => c.code === settings?.currency)?.symbol || '$'
  const taxEnabled = settings?.taxEnabled || false
  const taxRate = settings?.taxRate || 0
  const discountMode = settings?.discountMode || DiscountMode.GLOBAL

  const subtotal = cart.reduce((s, item) => s + item.price * item.qty - getItemDiscount(item, settings), 0)
  const itemDiscountTotal = cart.reduce((s, item) => s + getItemDiscount(item, settings), 0)
  
  // Global discount is applied at cart level (for global mode only)
  const discountPct = (discountMode === DiscountMode.GLOBAL && settings?.globalDiscount) ? settings.globalDiscount : 0
  const discountAmount = discountPct > 0 ? subtotal * (discountPct / 100) : 0
  const taxBase = subtotal - discountAmount
  const taxAmount = taxEnabled ? taxBase * (taxRate / 100) : 0
  const total = taxBase + taxAmount

  // Payment method calculations
  const cashPayment = parseFloat(cashAmount) || 0
  const cardPayment = parseFloat(cardAmount) || 0
  const totalPaid = cashPayment + cardPayment
  const remainingAmount = total - totalPaid
  
  // Amount given and balance calculations for cash payments
  const amountGivenValue = parseFloat(amountGiven) || 0
  const balanceReturned = paymentMethod === PaymentMethod.CASH && amountGivenValue > total ? amountGivenValue - total : 0

  // Check if credit purchases are enabled
  const creditEnabled = settings?.creditPurchaseEnabled || false

  // Validate checkout requirements
  const canCheckout = () => {
    if (cart.length === 0) return false
    
    if (paymentMethod === PaymentMethod.CREDIT) {
      if (!creditEnabled) return false
      if (!selectedCustomer) return false
    }
    
    if (paymentMethod === PaymentMethod.SPLIT) {
      if (totalPaid < total) return false
    }
    
    if (paymentMethod === PaymentMethod.CASH) {
      // For cash payments, amount given should be at least the total
      if (amountGivenValue > 0 && amountGivenValue < total) return false
    }
    
    return true
  }

  const handleCheckout = async () => {
    if (!canCheckout()) return
    
    const receiptNo = Date.now().toString().slice(-6)
    const now = Date.now()
    
    // Capture billing settings snapshot at checkout time
    const billingSettingsSnapshot = { ...settings }
    
    // Recalculate totals using checkout-time settings
    const checkoutSubtotal = cart.reduce((s, item) => s + item.price * item.qty - getItemDiscount(item, billingSettingsSnapshot), 0)
    const checkoutItemDiscountTotal = cart.reduce((s, item) => s + getItemDiscount(item, billingSettingsSnapshot), 0)
    const checkoutDiscountPct = (billingSettingsSnapshot?.discountMode === DiscountMode.GLOBAL && billingSettingsSnapshot?.globalDiscount) ? billingSettingsSnapshot.globalDiscount : 0
    const checkoutDiscountAmount = checkoutDiscountPct > 0 ? checkoutSubtotal * (checkoutDiscountPct / 100) : 0
    const checkoutTaxBase = checkoutSubtotal - checkoutDiscountAmount
    const checkoutTaxAmount = billingSettingsSnapshot?.taxEnabled ? checkoutTaxBase * (billingSettingsSnapshot?.taxRate / 100) : 0
    const checkoutTotal = checkoutTaxBase + checkoutTaxAmount
    
    // Determine payment details
    let paymentDetails = {
      method: paymentMethod,
      cashAmount: 0,
      cardAmount: 0,
      creditAmount: 0,
      digitalAmount: 0,
      amountGiven: 0,
      balanceReturned: 0
    }
    
    if (paymentMethod === PaymentMethod.CASH) {
      paymentDetails.cashAmount = checkoutTotal
      paymentDetails.amountGiven = amountGivenValue || checkoutTotal
      paymentDetails.balanceReturned = paymentDetails.amountGiven > checkoutTotal ? paymentDetails.amountGiven - checkoutTotal : 0
    } else if (paymentMethod === PaymentMethod.CARD) {
      paymentDetails.cardAmount = checkoutTotal
    } else if (paymentMethod === PaymentMethod.DIGITAL) {
      paymentDetails.digitalAmount = checkoutTotal
    } else if (paymentMethod === PaymentMethod.CREDIT) {
      paymentDetails.creditAmount = checkoutTotal
    } else if (paymentMethod === PaymentMethod.SPLIT) {
      paymentDetails.cashAmount = cashPayment
      paymentDetails.cardAmount = cardPayment
      paymentDetails.amountGiven = cashPayment + cardPayment
      paymentDetails.balanceReturned = paymentDetails.amountGiven > checkoutTotal ? paymentDetails.amountGiven - checkoutTotal : 0
    }
    
    // Create billing log with checkout-time settings and calculations
    const saleData = {
      receiptNo,
      cart: cart.map(i => ({ ...i })),
      subtotal: checkoutSubtotal,
      discountAmount: checkoutDiscountAmount,
      taxAmount: checkoutTaxAmount,
      total: checkoutTotal,
      itemCount: cart.length,
      paymentMethod: paymentDetails.method,
      paymentDetails,
      customer: selectedCustomer ? {
        id: selectedCustomer.id,
        name: selectedCustomer.name,
        phone: selectedCustomer.phone
      } : null,
      customerId: selectedCustomer?.id || null,
      billingSettings: billingSettingsSnapshot // Store settings snapshot for reference
    }
    
    // Update customer credit balance for credit purchases
    if (paymentMethod === PaymentMethod.CREDIT && selectedCustomer) {
      try {
        await updateCreditBalance(selectedCustomer.id, -checkoutTotal, `Credit purchase - Receipt #${receiptNo}`, CreditTransactionType.PURCHASE)
      } catch (error) {
        console.error('Failed to update customer credit balance:', error)
        addToast('Warning: Credit balance update failed', 'warning')
      }
    }
    
    // Save to billing logs (async, don't wait)
    createBillingLog(saleData).catch(console.error)
    
    setReceiptSnapshot({
      no: receiptNo,
      time: now,
      cart: cart.map(i => ({ ...i })),
      cashierName: userProfile?.displayName || 'Unknown',
      paymentMethod: paymentDetails.method,
      paymentDetails,
      customer: selectedCustomer,
      billingSettings: billingSettingsSnapshot // Include settings snapshot in receipt
    })
    setShowReceipt(true)
  }

  const handleNewSale = () => {
    onClear()
    setShowReceipt(false)
    setSelectedCustomer(null)
    setPaymentMethod(PaymentMethod.CASH)
    setCashAmount('')
    setCardAmount('')
    setAmountGiven('')
  }

  const handleRemoveItem = (itemKey) => {
    const item = cart.find(i => (i.cartItemId || i.id) === itemKey)
    if (item) {
      setItemToRemove({ key: itemKey, name: item.name, qty: item.qty })
    }
  }

  const confirmRemoveItem = () => {
    if (itemToRemove) {
      onRemoveItem(itemToRemove.key)
      setItemToRemove(null)
      addToast(`${itemToRemove.name} removed from cart`, 'success')
    }
  }

  const cancelRemoveItem = () => {
    setItemToRemove(null)
  }

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer)
  }

  const handleCustomerRemove = () => {
    setSelectedCustomer(null)
  }

  const handlePrint = () => {
    const { no, time, cart: rCart, billingSettings } = receiptSnapshot
    const storeInfo = billingSettings?.storeInfo || settings?.storeInfo || {}
    const rSub = rCart.reduce((s, item) => s + item.price * item.qty - getItemDiscount(item, billingSettings), 0)
    const rDiscountPct = (billingSettings?.discountMode === DiscountMode.GLOBAL && billingSettings?.globalDiscount) ? billingSettings.globalDiscount : 0
    const rDisc = rDiscountPct > 0 ? rSub * (rDiscountPct / 100) : 0
    const rTaxBase = rSub - rDisc
    const rTax = billingSettings?.taxEnabled ? rTaxBase * (billingSettings?.taxRate / 100) : 0
    const rTotal = rTaxBase + rTax

    const win = window.open('', '_blank', 'width=420,height=700')
    if (!win) { addToast('Please allow popups to print.', 'warning'); return }

    win.document.write(`<!DOCTYPE html>
<html><head>
<meta charset="utf-8"/>
<title>Receipt #${no}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Courier New', monospace; font-size: 12px; max-width: 300px; margin: 0 auto; padding: 16px; }
  h1 { font-size: 15px; text-align: center; font-weight: bold; margin-bottom: 2px; }
  .center { text-align: center; }
  .muted { color: #555; font-size: 11px; }
  .divider { border-top: 1px dashed #000; margin: 8px 0; }
  .row { display: flex; justify-content: space-between; margin: 3px 0; }
  .row-name { flex: 1; word-break: break-word; }
  .row-amount { text-align: right; white-space: nowrap; margin-left: 8px; }
  .bold { font-weight: bold; }
  .total-row { font-weight: bold; font-size: 14px; }
  .footer { text-align: center; color: #555; font-size: 11px; margin-top: 12px; }
  @media print { body { padding: 0; } }
</style>
</head><body>
<h1>${storeInfo.name || 'POS App'}</h1>
${storeInfo.address ? `<p class="center muted">${storeInfo.address}</p>` : ''}
${storeInfo.phone ? `<p class="center muted">Tel: ${storeInfo.phone}</p>` : ''}
<div class="divider"></div>
<div class="row"><span>Receipt #${no}</span><span class="muted">${fmtDate(time)} ${fmtTime(time)}</span></div>
<div class="row muted"><span>Cashier:</span><span>${receiptSnapshot.cashierName || 'Unknown'}</span></div>
${receiptSnapshot.customer ? `<div class="row muted"><span>Customer:</span><span>${receiptSnapshot.customer.name}${receiptSnapshot.customer.phone ? ` (${receiptSnapshot.customer.phone})` : ''}</span></div>` : ''}
${receiptSnapshot.paymentMethod ? `<div class="row muted"><span>Payment:</span><span>${receiptSnapshot.paymentMethod === PaymentMethod.CASH ? 'Cash' : receiptSnapshot.paymentMethod === PaymentMethod.CARD ? 'Card' : receiptSnapshot.paymentMethod === PaymentMethod.DIGITAL ? 'Digital' : receiptSnapshot.paymentMethod === PaymentMethod.CREDIT ? 'Credit' : 'Split'}</span></div>` : ''}
${receiptSnapshot.paymentMethod === PaymentMethod.SPLIT && receiptSnapshot.paymentDetails ? `
${receiptSnapshot.paymentDetails.cashAmount > 0 ? `<div class="row muted"><span style="margin-left: 20px;">Cash:</span><span>${fmt(receiptSnapshot.paymentDetails.cashAmount, sym)}</span></div>` : ''}
${receiptSnapshot.paymentDetails.cardAmount > 0 ? `<div class="row muted"><span style="margin-left: 20px;">Card:</span><span>${fmt(receiptSnapshot.paymentDetails.cardAmount, sym)}</span></div>` : ''}
` : ''}
<div class="divider"></div>
${rCart.map(item => {
  const itemDisc = getItemDiscount(item, billingSettings)
  const discInfo = getItemDiscountInfo(item, billingSettings)
  const lineTotal = item.price * item.qty
  const discountedTotal = lineTotal - itemDisc
  const hasDiscount = itemDisc > 0
  return `<div class="row">
  <span class="row-name">${item.name} &times; ${formatQty(item.qty, item.selectedUnit || item.unit)}${hasDiscount ? ` <span class="muted">(${fmt(lineTotal, sym)} → ${fmt(discountedTotal, sym)}${(item.discount?.type === DiscountType.PERCENTAGE || (billingSettings?.discountMode === DiscountMode.CATEGORY && billingSettings?.categoryDiscounts?.[item.category]?.type === DiscountType.PERCENTAGE) || (billingSettings?.discountMode === DiscountMode.GLOBAL && billingSettings?.globalDiscount > 0)) && discInfo.percentage > 0 ? ` −${discInfo.percentage.toFixed(0)}%` : ''})</span>` : ''}</span>
  <span class="row-amount">${fmt(discountedTotal, sym)}</span>
</div>`
}).join('')}
<div class="divider"></div>
<div class="row"><span>Gross Amount</span><span>${fmt(rCart.reduce((s, item) => s + item.price * item.qty, 0), sym)}</span></div>
${(() => {
  const discountBreakdown = getCartDiscountBreakdown(rCart, billingSettings)
  const hasDiscounts = discountBreakdown.totalDiscount > 0
  return hasDiscounts ? `
    ${discountBreakdown.itemDiscounts.filter(item => item.discount.amount > 0).map(item => 
      `<div class="row muted"><span>${item.itemName} (${item.quantity}x)</span><span>−${fmt(item.discount.amount, sym)} - ${item.discount.description}</span></div>`
    ).join('')}
    ${discountBreakdown.globalDiscount > 0 ? `<div class="row muted"><span>Global Discount</span><span>−${fmt(discountBreakdown.globalDiscount, sym)} (${discountBreakdown.globalDiscountPercentage}%)</span></div>` : ''}
    <div class="row muted"><strong>Total Discount</strong></div>
    <div class="row muted"><span></span><span>−${fmt(discountBreakdown.totalDiscount, sym)}</span></div>
  ` : ''
})()}
<div class="row"><span>Net Amount</span><span>${fmt(rSub, sym)}</span></div>
${billingSettings?.taxEnabled ? `<div class="row muted"><span>Tax (${billingSettings?.taxRate}%)</span><span>${fmt(rTax, sym)}</span></div>` : ''}
<div class="divider"></div>
<div class="row total-row"><span>TOTAL</span><span>${fmt(rTotal, sym)}</span></div>
<div class="divider"></div>
${receiptSnapshot.paymentDetails && (receiptSnapshot.paymentDetails.amountGiven > 0 || receiptSnapshot.paymentDetails.balanceReturned > 0) ? `
${receiptSnapshot.paymentDetails.amountGiven > 0 ? `<div class="row"><span>Amount Given</span><span>${fmt(receiptSnapshot.paymentDetails.amountGiven, sym)}</span></div>` : ''}
${receiptSnapshot.paymentDetails.balanceReturned > 0 ? `<div class="row"><span>Balance Returned</span><span class="text-emerald-600">${fmt(receiptSnapshot.paymentDetails.balanceReturned, sym)}</span></div>` : ''}
<div class="divider"></div>
` : ''}
<p class="footer">${storeInfo.footer || 'Thank you for your purchase!'}</p>
</body></html>`)
    win.document.close()
    win.onload = () => { win.print(); win.close() }
  }

  // Receipt View
  if (showReceipt) {
    const { no, time, cart: rCart, billingSettings } = receiptSnapshot
    const rSub = rCart.reduce((s, item) => s + item.price * item.qty - getItemDiscount(item, billingSettings), 0)
    const rDiscountPct = (billingSettings?.discountMode === DiscountMode.GLOBAL && billingSettings?.globalDiscount) ? billingSettings.globalDiscount : 0
    const rDisc = rDiscountPct > 0 ? rSub * (rDiscountPct / 100) : 0
    const rTaxBase = rSub - rDisc
    const rTax = billingSettings?.taxEnabled ? rTaxBase * (billingSettings?.taxRate / 100) : 0
    const rTotal = rTaxBase + rTax

    return (
      <div className="w-full h-full bg-white lg:border-l border-gray-200 flex flex-col shadow-xl flex-shrink-0">
        <div className="p-4 border-b border-gray-200 bg-emerald-50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-700">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-semibold">Sale Complete</span>
          </div>
          {onClose && (
            <button onClick={onClose} className="lg:hidden p-1 -mr-1 text-emerald-700 hover:text-emerald-800">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Receipt #{no}</p>
            <p className="text-xs text-gray-400">{fmtDate(time)} {fmtTime(time)}</p>
          </div>
          
          {/* Cashier Info */}
          {receiptSnapshot.cashierName && (
            <div className="mb-3 text-xs text-gray-500">
              <span className="font-medium">Cashier:</span> {receiptSnapshot.cashierName}
            </div>
          )}

          {/* Payment Details */}
          {receiptSnapshot.paymentMethod && (
            <div className="mb-3 text-xs text-gray-500 space-y-1">
              <div>
                <span className="font-medium">Payment:</span>{' '}
                {receiptSnapshot.paymentMethod === PaymentMethod.CASH ? 'Cash' : 
                 receiptSnapshot.paymentMethod === PaymentMethod.CARD ? 'Card' : 
                 receiptSnapshot.paymentMethod === PaymentMethod.DIGITAL ? 'Digital' :
                 receiptSnapshot.paymentMethod === PaymentMethod.CREDIT ? 'Credit' : 'Split'}
              </div>
              {receiptSnapshot.paymentMethod === PaymentMethod.SPLIT && receiptSnapshot.paymentDetails && (
                <div className="ml-4 space-y-0.5">
                  {receiptSnapshot.paymentDetails.cashAmount > 0 && (
                    <div>
                      <span className="font-medium">Cash:</span> {fmt(receiptSnapshot.paymentDetails.cashAmount, sym)}
                    </div>
                  )}
                  {receiptSnapshot.paymentDetails.cardAmount > 0 && (
                    <div>
                      <span className="font-medium">Card:</span> {fmt(receiptSnapshot.paymentDetails.cardAmount, sym)}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {rCart.map((item) => {
            const itemDisc = getItemDiscount(item, billingSettings)
            const discInfo = getItemDiscountInfo(item, billingSettings)
            const lineTotal = item.price * item.qty
            const discountedTotal = lineTotal - itemDisc
            const hasDiscount = itemDisc > 0
            const itemKey = item.cartItemId || item.id
            
            return (
              <div key={itemKey} className="flex justify-between text-sm py-1 gap-2">
                <span className="text-gray-700 flex-1 min-w-0">
                  <span className="block truncate">{item.name} × {formatQty(item.qty, item.selectedUnit || item.unit)}</span>
                  {hasDiscount && (
                    <span className="text-xs text-rose-500">
                      ({fmt(lineTotal, sym)} → {fmt(discountedTotal, sym)}
                      {(item.discount?.type === DiscountType.PERCENTAGE || (billingSettings?.discountMode === DiscountMode.CATEGORY && billingSettings?.categoryDiscounts?.[item.category]?.type === DiscountType.PERCENTAGE) || (billingSettings?.discountMode === DiscountMode.GLOBAL && billingSettings?.globalDiscount > 0)) && discInfo.percentage > 0 ? ` −${discInfo.percentage.toFixed(0)}%` : ''})
                    </span>
                  )}
                </span>
                <span className="font-medium whitespace-nowrap">{fmt(discountedTotal, sym)}</span>
              </div>
            )
          })}

          <div className="mt-4 pt-4 border-t border-gray-200 space-y-1 text-sm">
            {/* Show original subtotal before any discounts */}
            <div className="flex justify-between text-gray-500">
              <span>Gross Amount</span>
              <span>{fmt(rCart.reduce((s, item) => s + item.price * item.qty, 0), sym)}</span>
            </div>
            {(() => {
              const discountBreakdown = getCartDiscountBreakdown(rCart, billingSettings)
              const hasDiscounts = discountBreakdown.totalDiscount > 0
              return hasDiscounts ? (
                <>
                  {discountBreakdown.itemDiscounts.filter(item => item.discount.amount > 0).map(item => (
                    <div key={item.itemId} className="flex justify-between text-rose-600 text-xs">
                      <span>{item.itemName} ({item.quantity}x)</span>
                      <span>− {fmt(item.discount.amount, sym)} - {item.discount.description}</span>
                    </div>
                  ))}
                  {discountBreakdown.globalDiscount > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span>Global Discount</span>
                      <span>− {fmt(discountBreakdown.globalDiscount, sym)} ({discountBreakdown.globalDiscountPercentage}%)</span>
                    </div>
                  )}
                  <div className="flex justify-between text-rose-600 font-semibold">
                    <span>Total Discount</span>
                    <span>− {fmt(discountBreakdown.totalDiscount, sym)}</span>
                  </div>
                </>
              ) : null
            })()}
            <div className="flex justify-between text-gray-600">
              <span>Net Amount</span>
              <span>{fmt(rSub, sym)}</span>
            </div>
            {billingSettings?.taxEnabled && (
              <div className="flex justify-between text-gray-600">
                <span>Tax ({billingSettings?.taxRate}%)</span>
                <span>{fmt(rTax, sym)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-gray-900 pt-1 border-t border-gray-100">
              <span>Total</span>
              <span>{fmt(rTotal, sym)}</span>
            </div>
            
            {/* Amount Given and Balance Returned */}
            {receiptSnapshot.paymentDetails && (receiptSnapshot.paymentDetails.amountGiven > 0 || receiptSnapshot.paymentDetails.balanceReturned > 0) && (
              <>
                <div className="flex justify-between text-gray-600 pt-1">
                  <span>Amount Given</span>
                  <span>{fmt(receiptSnapshot.paymentDetails.amountGiven, sym)}</span>
                </div>
                {receiptSnapshot.paymentDetails.balanceReturned > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Balance Returned</span>
                    <span>{fmt(receiptSnapshot.paymentDetails.balanceReturned, sym)}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 flex flex-col gap-2">
          <button
            onClick={handlePrint}
            className="w-full py-2.5 bg-slate-700 text-white font-semibold rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print Receipt
          </button>
          <button
            onClick={handleNewSale}
            className="w-full py-2.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
          >
            New Sale
          </button>
        </div>
      </div>
    )
  }

  // Cart View
  return (
    <div className="w-full h-full bg-white lg:border-l border-gray-200 flex flex-col shadow-xl flex-shrink-0">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">
          Cart{' '}
          {cart.length > 0 && (
            <span className="ml-1 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
              {cart.length}
            </span>
          )}
        </h2>
        {cart.length > 0 && (
          <button
            onClick={onClear}
            className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8 gap-2">
            <svg className="w-14 h-14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-sm font-medium">Cart is empty</p>
            <p className="text-xs text-center">Tap a product to add it</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {cart.map((item) => {
              const itemDisc = getItemDiscount(item, settings)
              const discInfo = getItemDiscountInfo(item, settings)
              const lineTotal = item.price * item.qty
              const discountedTotal = lineTotal - itemDisc
              const hasDiscount = itemDisc > 0
              const itemKey = item.cartItemId || item.id // Use cartItemId for unique identification
              
              return (
                <div 
                  key={itemKey} 
                  className="p-3 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setEditingItem(item)}
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.name} <span className="text-emerald-600 font-bold ml-1">× {item.qty}</span>
                      </p>
                      <p className="text-xs text-gray-500">
                        {fmt(item.price, sym)} / {item.selectedUnit || item.unit || 'Each'}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveItem(itemKey)
                      }}
                      className="text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all p-1.5 flex-shrink-0 group"
                      title="Remove item"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m0 0h14m-7 0v6m-7 0h14m-9-4h4m4 0h4" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex items-center justify-end">
                    <div className="flex items-center gap-1.5">
                      {discountPct === 0 && (
                        <div className="flex items-center gap-0.5" onClick={e => e.stopPropagation()}>
                          <span className="text-[10px] text-gray-400">−{sym}</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            disabled={!settings?.cartDiscountEnabled}
                            value={item.cartDiscount ?? (item.discount?.enabled ? Number(itemDisc).toFixed(2) : '')}
                            onChange={e => onUpdateItemDiscount(itemKey, e.target.value === '' ? null : e.target.value)}
                            placeholder="0.00"
                            className="w-14 text-right border border-gray-200 rounded px-1 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-rose-300 text-rose-600 placeholder-gray-300 disabled:opacity-50 disabled:bg-gray-50 disabled:cursor-not-allowed"
                          />
                        </div>
                      )}
                      <div className="text-right">
                        {hasDiscount ? (
                          <>
                            <div className="text-xs text-gray-400 line-through">{fmt(lineTotal, sym)}</div>
                            <div className="text-sm font-semibold text-gray-900">{fmt(discountedTotal, sym)}</div>
                            {item.discount?.type === DiscountType.PERCENTAGE || (discountMode === DiscountMode.CATEGORY && settings?.categoryDiscounts?.[item.category]?.type === DiscountType.PERCENTAGE) || (discountMode === DiscountMode.GLOBAL && settings?.globalDiscount > 0) ? (
                              discInfo.percentage > 0 && (
                                <div className="text-[10px] text-rose-500">
                                  (−{discInfo.percentage.toFixed(0)}% {discInfo.source === DiscountMode.CATEGORY ? DiscountMode.CATEGORY : discInfo.source === DiscountMode.ITEM ? DiscountMode.ITEM : ''})
                                </div>
                              )
                            ) : null}
                          </>
                        ) : (
                          <span className="text-sm font-semibold text-gray-900">
                            {fmt(lineTotal, sym)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Summary & Checkout */}
      {cart.length > 0 && (
        <div className="p-4 border-t border-gray-200 space-y-1.5">
          {/* Show original subtotal before any discounts */}
          <div className="flex justify-between text-sm text-gray-500">
            <span>Gross Amount</span>
            <span>{fmt(cart.reduce((s, item) => s + item.price * item.qty, 0), sym)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Net Amount</span>
            <span>{fmt(subtotal, sym)}</span>
          </div>
          {discountPct > 0 && (
            <div className="flex justify-between text-sm text-rose-600">
              <span>Global Discount ({discountPct}%)</span>
              <span>− {fmt(discountAmount, sym)}</span>
            </div>
          )}
          {discountPct === 0 && itemDiscountTotal > 0 && (
            <div className="flex justify-between text-sm text-rose-500">
              <span>Item/Category Discount</span>
              <span>− {fmt(itemDiscountTotal, sym)}</span>
            </div>
          )}
          {taxEnabled && (
            <div className="flex justify-between text-sm text-gray-600">
              <span>Tax ({taxRate}%)</span>
              <span>{fmt(taxAmount, sym)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-gray-900 pt-1 border-t border-gray-100">
            <span>Total</span>
            <span className="text-lg">{fmt(total, sym)}</span>
          </div>

          {/* Customer Selection */}
          <div className="space-y-2">
            {selectedCustomer ? (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-blue-900 truncate">{selectedCustomer.name}</p>
                  {selectedCustomer.phone && (
                    <p className="text-xs text-blue-600">{selectedCustomer.phone}</p>
                  )}
                </div>
                <button
                  onClick={handleCustomerRemove}
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowCustomerModal(true)}
                className="w-full py-2 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Add Customer (Optional)
              </button>
            )}
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Payment Method</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setPaymentMethod(PaymentMethod.CASH)}
                className={`py-2 px-3 rounded-xl font-medium transition-colors ${
                  paymentMethod === PaymentMethod.CASH
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Cash
              </button>
              <button
                onClick={() => setPaymentMethod(PaymentMethod.CARD)}
                className={`py-2 px-3 rounded-xl font-medium transition-colors ${
                  paymentMethod === PaymentMethod.CARD
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Card
              </button>
              <button
                onClick={() => setPaymentMethod(PaymentMethod.DIGITAL)}
                className={`py-2 px-3 rounded-xl font-medium transition-colors ${
                  paymentMethod === PaymentMethod.DIGITAL
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Digital
              </button>
              {creditEnabled && (
                <button
                  onClick={() => setPaymentMethod(PaymentMethod.CREDIT)}
                  className={`py-2 px-3 rounded-xl font-medium transition-colors ${
                    paymentMethod === PaymentMethod.CREDIT
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Credit
                </button>
              )}
              <button
                onClick={() => setPaymentMethod(PaymentMethod.SPLIT)}
                className={`py-2 px-3 rounded-xl font-medium transition-colors ${
                  paymentMethod === PaymentMethod.SPLIT
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Split
              </button>
            </div>
          </div>

          {/* Cash Payment Amount */}
          {paymentMethod === PaymentMethod.CASH && (
            <div className="space-y-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount Given</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amountGiven}
                  onChange={(e) => setAmountGiven(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  placeholder={fmt(total, sym)}
                />
              </div>
              {amountGivenValue > 0 && (
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Total Due: {fmt(total, sym)}</div>
                  {amountGivenValue < total && (
                    <div className="text-amber-600">Remaining: {fmt(total - amountGivenValue, sym)}</div>
                  )}
                  {amountGivenValue >= total && balanceReturned > 0 && (
                    <div className="text-emerald-600">Balance Returned: {fmt(balanceReturned, sym)}</div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Split Payment Amounts */}
          {paymentMethod === PaymentMethod.SPLIT && (
            <div className="space-y-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cash Amount</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Card Amount</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={cardAmount}
                  onChange={(e) => setCardAmount(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  placeholder="0.00"
                />
              </div>
              {totalPaid > 0 && (
                <div className="text-sm text-gray-600">
                  Total Paid: {fmt(totalPaid, sym)}
                  {remainingAmount > 0 && <span className="text-amber-600"> (Remaining: {fmt(remainingAmount, sym)})</span>}
                  {remainingAmount < 0 && <span className="text-green-600"> (Change: {fmt(Math.abs(remainingAmount), sym)})</span>}
                </div>
              )}
            </div>
          )}

          {/* Validation Messages */}
          {paymentMethod === PaymentMethod.CREDIT && !creditEnabled && (
            <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-xl p-2">
              Credit purchases are not enabled. Please contact your administrator.
            </div>
          )}
          {paymentMethod === PaymentMethod.CREDIT && creditEnabled && !selectedCustomer && (
            <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-xl p-2">
              Customer selection is required for credit purchases.
            </div>
          )}

          {/* Checkout Button */}
          <button
            onClick={handleCheckout}
            disabled={!canCheckout()}
            className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {paymentMethod === PaymentMethod.CREDIT ? 'Complete Credit Sale' : 'Checkout'}
          </button>
        </div>
      )}

      {editingItem && (
        <ProductModal
          product={editingItem}
          initialQty={editingItem.qty}
          onSave={(updatedProduct, qty) => {
            onUpdateItem(editingItem.cartItemId || editingItem.id, updatedProduct, qty)
            setEditingItem(null)
          }}
          onClose={() => setEditingItem(null)}
          currencySymbol={sym}
          settings={settings}
          isEdit={true}
        />
      )}

      {/* Remove Item Confirmation Dialog */}
      {itemToRemove && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Remove Item</h3>
                <p className="text-sm text-gray-500">Are you sure you want to remove this item?</p>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="font-medium text-gray-900">{itemToRemove.name}</p>
              <p className="text-sm text-gray-500">Quantity: {itemToRemove.qty}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={cancelRemoveItem}
                className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmRemoveItem}
                className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Search Modal */}
      {showCustomerModal && (
        <CustomerSearchModal
          isOpen={showCustomerModal}
          onClose={() => setShowCustomerModal(false)}
          onSelectCustomer={handleCustomerSelect}
          requireSelection={paymentMethod === PaymentMethod.CREDIT}
        />
      )}
    </div>
  )
}
