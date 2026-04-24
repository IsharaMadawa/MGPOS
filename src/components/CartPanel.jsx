import { useState } from 'react'
import { CURRENCIES } from '../hooks/useSettings'

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
  
  // Global discount (fallback for global mode)
  if (mode === 'global' && settings?.globalDiscount) {
    const lineTotal = item.price * item.qty
    return lineTotal * (settings.globalDiscount / 100)
  }
  
  return 0
}

export default function CartPanel({ cart, onUpdateQty, onUpdateItemDiscount, onRemoveItem, onClear, settings }) {
  const [showReceipt, setShowReceipt] = useState(false)
  const [receiptSnapshot, setReceiptSnapshot] = useState({ no: '', time: null, cart: [] })

  const sym = CURRENCIES.find(c => c.code === settings?.currency)?.symbol || '$'
  const taxEnabled = settings?.taxEnabled || false
  const taxRate = settings?.taxRate || 0
  const discountMode = settings?.discountMode || 'global'

  const subtotal = cart.reduce((s, item) => s + item.price * item.qty - getItemDiscount(item, settings), 0)
  const itemDiscountTotal = cart.reduce((s, item) => s + getItemDiscount(item, settings), 0)
  
  // Global discount is applied at cart level (for global mode only)
  const discountPct = (discountMode === 'global' && settings?.globalDiscount) ? settings.globalDiscount : 0
  const discountAmount = discountPct > 0 ? subtotal * (discountPct / 100) : 0
  const taxBase = subtotal - discountAmount
  const taxAmount = taxEnabled ? taxBase * (taxRate / 100) : 0
  const total = taxBase + taxAmount

  const handleCheckout = () => {
    if (cart.length === 0) return
    setReceiptSnapshot({
      no: Date.now().toString().slice(-6),
      time: Date.now(),
      cart: cart.map(i => ({ ...i })),
    })
    setShowReceipt(true)
  }

  const handleNewSale = () => {
    onClear()
    setShowReceipt(false)
  }

  const handlePrint = () => {
    const { no, time, cart: rCart } = receiptSnapshot
    const storeInfo = settings?.storeInfo || {}
    const rSub = rCart.reduce((s, item) => s + item.price * item.qty - getItemDiscount(item, settings), 0)
    const rDisc = discountPct > 0 ? rSub * (discountPct / 100) : 0
    const rTaxBase = rSub - rDisc
    const rTax = taxEnabled ? rTaxBase * (taxRate / 100) : 0
    const rTotal = rTaxBase + rTax

    const win = window.open('', '_blank', 'width=420,height=700')
    if (!win) { alert('Please allow popups to print.'); return }

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
<div class="divider"></div>
${rCart.map(item => {
  const itemDisc = getItemDiscount(item, settings)
  const lineTotal = item.price * item.qty - itemDisc
  return `<div class="row">
  <span class="row-name">${item.name} &times; ${formatQty(item.qty, item.unit)}${itemDisc > 0 ? ` <span class="muted">(−${fmt(itemDisc, sym)})</span>` : ''}</span>
  <span class="row-amount">${fmt(lineTotal, sym)}</span>
</div>`
}).join('')}
<div class="divider"></div>
<div class="row"><span>Subtotal</span><span>${fmt(rSub, sym)}</span></div>
${rDisc > 0 ? `<div class="row muted"><span>Discount${discountPct > 0 ? ` (${discountPct}%)` : ''}</span><span>−${fmt(rDisc, sym)}</span></div>` : ''}
${taxEnabled ? `<div class="row muted"><span>Tax (${taxRate}%)</span><span>${fmt(rTax, sym)}</span></div>` : ''}
<div class="divider"></div>
<div class="row total-row"><span>TOTAL</span><span>${fmt(rTotal, sym)}</span></div>
<div class="divider"></div>
<p class="footer">${storeInfo.footer || 'Thank you for your purchase!'}</p>
</body></html>`)
    win.document.close()
    win.onload = () => { win.print(); win.close() }
  }

  // Receipt View
  if (showReceipt) {
    const { no, time, cart: rCart } = receiptSnapshot
    const rSub = rCart.reduce((s, item) => s + item.price * item.qty - getItemDiscount(item, settings), 0)
    const rDisc = discountPct > 0 ? rSub * (discountPct / 100) : 0
    const rTaxBase = rSub - rDisc
    const rTax = taxEnabled ? rTaxBase * (taxRate / 100) : 0
    const rTotal = rTaxBase + rTax

    return (
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col shadow-xl flex-shrink-0">
        <div className="p-4 border-b border-gray-200 bg-emerald-50">
          <div className="flex items-center gap-2 text-emerald-700">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-semibold">Sale Complete</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Receipt #{no}</p>
            <p className="text-xs text-gray-400">{fmtDate(time)} {fmtTime(time)}</p>
          </div>

          {rCart.map((item) => {
            const itemDisc = getItemDiscount(item, settings)
            return (
              <div key={item.id} className="flex justify-between text-sm py-1 gap-2">
                <span className="text-gray-700 flex-1 min-w-0">
                  <span className="block truncate">{item.name} × {formatQty(item.qty, item.unit)}</span>
                  {itemDisc > 0 && (
                    <span className="text-xs text-rose-500">(−{fmt(itemDisc, sym)})</span>
                  )}
                </span>
                <span className="font-medium whitespace-nowrap">{fmt(item.price * item.qty - itemDisc, sym)}</span>
              </div>
            )
          })}

          <div className="mt-4 pt-4 border-t border-gray-200 space-y-1 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>{fmt(rSub, sym)}</span>
            </div>
            {rDisc > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>Discount ({discountPct}%)</span>
                <span>− {fmt(rDisc, sym)}</span>
              </div>
            )}
            {taxEnabled && (
              <div className="flex justify-between text-gray-600">
                <span>Tax ({taxRate}%)</span>
                <span>{fmt(rTax, sym)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base text-gray-900 pt-1 border-t border-gray-100 mt-1">
              <span>Total</span>
              <span>{fmt(rTotal, sym)}</span>
            </div>
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
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col shadow-xl flex-shrink-0">
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
              return (
                <div key={item.id} className="p-3">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                      <p className="text-xs text-gray-500">
                        {fmt(item.price, sym)} / {item.unit || 'Each'}
                      </p>
                    </div>
                    <button
                      onClick={() => onRemoveItem(item.id)}
                      className="text-gray-300 hover:text-red-400 transition-colors p-1 flex-shrink-0"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onUpdateQty(item.id, item.qty - 0.25)}
                        className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-sm transition-colors"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={item.qty}
                        onChange={e => {
                          const q = parseFloat(e.target.value)
                          if (q > 0) onUpdateQty(item.id, q)
                        }}
                        className="text-sm font-medium w-16 text-center border border-gray-200 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-emerald-300"
                      />
                      <button
                        onClick={() => onUpdateQty(item.id, item.qty + 0.25)}
                        className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-sm transition-colors"
                      >
                        +
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {discountPct === 0 && (
                        <div className="flex items-center gap-0.5">
                          <span className="text-[10px] text-gray-400">−{sym}</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.cartDiscount ?? (item.discount?.enabled ? Number(itemDisc).toFixed(2) : '')}
                            onChange={e => onUpdateItemDiscount(item.id, e.target.value === '' ? null : e.target.value)}
                            placeholder="0.00"
                            className="w-14 text-right border border-gray-200 rounded px-1 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-rose-300 text-rose-600 placeholder-gray-300"
                          />
                        </div>
                      )}
                      <span className="text-sm font-semibold text-gray-900 w-16 text-right">
                        {fmt(item.price * item.qty - itemDisc, sym)}
                      </span>
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
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal</span>
            <span>{fmt(subtotal, sym)}</span>
          </div>
          {discountPct > 0 && (
            <div className="flex justify-between text-sm text-rose-600">
              <span>Discount ({discountPct}%)</span>
              <span>− {fmt(discountAmount, sym)}</span>
            </div>
          )}
          {discountPct === 0 && itemDiscountTotal > 0 && (
            <div className="flex justify-between text-sm text-rose-500">
              <span>Discount</span>
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
          <button
            onClick={handleCheckout}
            className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors mt-1"
          >
            Checkout
          </button>
        </div>
      )}
    </div>
  )
}
