import { useState, useEffect } from 'react'
import { useBillingLogs } from '../hooks/useBillingLogs'
import { useSettings } from '../hooks/useSettings'
import { useAuth } from '../contexts/AuthContext'
import { useOrg } from '../contexts/OrgContext'
import { useToast } from '../components/ToastContainer'
import { logUserAction } from '../utils/logger'

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

export default function BillingLogsPage() {
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    receiptNo: ''
  })
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const logsPerPage = 50

  const { logs, loading } = useBillingLogs()
  const { settings } = useSettings()
  const { userProfile } = useAuth()
  const { selectedOrgId } = useOrg()
  const { addToast } = useToast()

  const sym = settings?.currency ? 
    (settings.currency === 'USD' ? '$' : 
     settings.currency === 'EUR' ? '€' : 
     settings.currency === 'GBP' ? '£' : 
     settings.currency === 'JPY' ? '¥' : 
     settings.currency === 'INR' ? '₹' : 
     settings.currency === 'LKR' ? 'Rs' : 
     settings.currency === 'CAD' ? 'CA$' : 
     settings.currency === 'AUD' ? 'A$' : 
     settings.currency === 'SGD' ? 'S$' : 
     settings.currency === 'MYR' ? 'RM' : '$') : '$'

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      receiptNo: ''
    })
    setCurrentPage(1)
  }

  const isSameDay = (timestamp) => {
    const billDate = new Date(timestamp)
    const today = new Date()
    return billDate.toDateString() === today.toDateString()
  }

  const canReprint = (log) => {
    // Check if reprint is enabled in settings
    if (!settings?.reprintEnabled) return false
    
    // Check if it's same day
    if (!isSameDay(log.createdAt)) return false
    
    return true
  }

  const handleReprint = async (log) => {
    if (!canReprint(log)) return

    try {
      // Log the reprint action
      await logUserAction('bill_reprinted', `Reprinted bill #${log.receiptNo}`, userProfile, selectedOrgId)

      // Calculate bill details
      const rSub = log.cart.reduce((s, item) => s + item.price * item.qty - getItemDiscount(item, settings), 0)
      const discountPct = (settings?.discountMode === 'global' && settings?.globalDiscount) ? settings.globalDiscount : 0
      const rDisc = discountPct > 0 ? rSub * (discountPct / 100) : 0
      const taxEnabled = settings?.taxEnabled || false
      const taxRate = settings?.taxRate || 0
      const rTaxBase = rSub - rDisc
      const rTax = taxEnabled ? rTaxBase * (taxRate / 100) : 0
      const rTotal = rTaxBase + rTax

      const storeInfo = settings?.storeInfo || {}

      const win = window.open('', '_blank', 'width=420,height=700')
      if (!win) { addToast('Please allow popups to print.', 'warning'); return }

      const reprintDateTime = new Date().toLocaleString()

      win.document.write(`<!DOCTYPE html>
<html><head>
<meta charset="utf-8"/>
<title>REPRINT - Receipt #${log.receiptNo}</title>
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
  .reprint-note { text-align: center; color: #ff0000; font-weight: bold; margin: 8px 0; font-size: 11px; }
  @media print { body { padding: 0; } }
</style>
</head><body>
<h1>${storeInfo.name || 'POS App'}</h1>
${storeInfo.address ? `<p class="center muted">${storeInfo.address}</p>` : ''}
${storeInfo.phone ? `<p class="center muted">Tel: ${storeInfo.phone}</p>` : ''}
<div class="divider"></div>
<div class="row"><span>Receipt #${log.receiptNo}</span><span class="muted">${fmtDate(log.createdAt)} ${fmtTime(log.createdAt)}</span></div>
<div class="row muted"><span>Cashier:</span><span>${log.cashierName || 'Unknown'}</span></div>
<div class="reprint-note">*** REPRINT ***</div>
<div class="row center muted"><span>Reprinted: ${reprintDateTime}</span></div>
<div class="divider"></div>
${log.cart.map(item => {
  const itemDisc = getItemDiscount(item, settings)
  const discInfo = getItemDiscountInfo(item, settings)
  const lineTotal = item.price * item.qty
  const discountedTotal = lineTotal - itemDisc
  const hasDiscount = itemDisc > 0
  return `<div class="row">
  <span class="row-name">${item.name} &times; ${formatQty(item.qty, item.selectedUnit || item.unit)}${hasDiscount ? ` <span class="muted">(${fmt(lineTotal, sym)} → ${fmt(discountedTotal, sym)}${(item.discount?.type === 'percentage' || (settings?.discountMode === 'category' && settings?.categoryDiscounts?.[item.category]?.type === 'percentage') || (settings?.discountMode === 'global' && settings?.globalDiscount > 0)) && discInfo.percentage > 0 ? ` −${discInfo.percentage.toFixed(0)}%` : ''})</span>` : ''}</span>
  <span class="row-amount">${fmt(discountedTotal, sym)}</span>
</div>`
}).join('')}
<div class="divider"></div>
<div class="row"><span>Gross Amount</span><span>${fmt(log.cart.reduce((s, item) => s + item.price * item.qty, 0), sym)}</span></div>
${(rDisc > 0 || log.cart.reduce((s, item) => s + getItemDiscount(item, settings), 0) > 0) ? `<div class="row muted"><span>Discount ${discountPct > 0 ? `(${discountPct}%)` : ''}</span><span>−${fmt(rDisc + log.cart.reduce((s, item) => s + getItemDiscount(item, settings), 0), sym)}</span></div>` : ''}
<div class="row"><span>Net Amount</span><span>${fmt(rSub, sym)}</span></div>
${taxEnabled ? `<div class="row muted"><span>Tax (${taxRate}%)</span><span>${fmt(rTax, sym)}</span></div>` : ''}
<div class="divider"></div>
<div class="row total-row"><span>TOTAL</span><span>${fmt(rTotal, sym)}</span></div>
<div class="divider"></div>
<p class="footer">${storeInfo.footer || 'Thank you for your purchase!'}</p>
</body></html>`)
      win.document.close()
      win.onload = () => { win.print(); win.close() }
    } catch (error) {
      console.error('Error reprinting bill:', error)
    }
  }

  const filteredLogs = logs.filter(log => {
    let matches = true
    
    if (filters.startDate) {
      const logDate = new Date(log.createdAt).toDateString()
      const filterDate = new Date(filters.startDate).toDateString()
      matches = matches && logDate >= filterDate
    }
    
    if (filters.endDate) {
      const logDate = new Date(log.createdAt).toDateString()
      const filterDate = new Date(filters.endDate).toDateString()
      matches = matches && logDate <= filterDate
    }
    
    if (filters.receiptNo) {
      matches = matches && log.receiptNo.toLowerCase().includes(filters.receiptNo.toLowerCase())
    }
    
    return matches
  })

  const paginatedLogs = filteredLogs.slice(0, logsPerPage * currentPage)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Billing Logs</h1>
          <p className="mt-2 text-gray-600">
            View and reprint bills from your organization
          </p>
          {settings?.reprintEnabled && (
            <p className="mt-1 text-sm text-emerald-600">
              Reprint is enabled for today's bills only
            </p>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="text-emerald-600 hover:text-emerald-800 text-sm font-medium"
            >
              {showFilters ? 'Hide' : 'Show'} Filters
            </button>
          </div>

          {showFilters && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Number</label>
                  <input
                    type="text"
                    value={filters.receiptNo}
                    onChange={(e) => handleFilterChange('receiptNo', e.target.value)}
                    placeholder="Enter receipt number"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  Clear Filters
                </button>
              </div>
            </>
          )}
        </div>

        {/* Billing Logs Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Bills ({paginatedLogs.length} of {filteredLogs.length})
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Receipt #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cashier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedLogs.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      No bills found matching your criteria
                    </td>
                  </tr>
                ) : (
                  paginatedLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{log.receiptNo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div className="font-medium">{fmtDate(log.createdAt)}</div>
                          <div className="text-gray-500 text-xs">{fmtTime(log.createdAt)}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.cashierName || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.itemCount || log.cart?.length || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {fmt(log.total, sym)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex gap-2">
                          {canReprint(log) && (
                            <button
                              onClick={() => handleReprint(log)}
                              className="text-emerald-600 hover:text-emerald-800 font-medium text-sm"
                              title="Reprint Bill"
                            >
                              Reprint
                            </button>
                          )}
                          {!canReprint(log) && (
                            <span className="text-gray-400 text-sm" title="Reprint not available">
                              {settings?.reprintEnabled ? 'Not today' : 'Disabled'}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Load More */}
          {paginatedLogs.length < filteredLogs.length && (
            <div className="px-4 py-3 border-t border-gray-200 text-center">
              <button
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="px-4 py-2 text-sm font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-md"
              >
                Load More
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
