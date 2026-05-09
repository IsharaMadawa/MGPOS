import { useState, useEffect } from 'react'
import { useBillingLogs } from '../hooks/useBillingLogs'
import { useSettings } from '../hooks/useSettings'
import { useAuth } from '../contexts/AuthContext'
import { useOrg } from '../contexts/OrgContext'
import { useToast } from '../components/ToastContainer'
import { logUserAction } from '../utils/logger'
import { getItemDiscountDetails, getCartDiscountBreakdown } from '../utils/discountUtils'
import { DiscountType, DiscountMode, DiscountSource, DEFAULT_DISCOUNT_MODE } from '../constants/enums'

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
  
  return 0
}

// Get discount info for display (percentage and source)
function getItemDiscountInfo(item, settings) {
  const mode = settings?.discountMode || DEFAULT_DISCOUNT_MODE
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

export default function BillingLogsPage() {
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    receiptNo: ''
  })
  const [showFilters, setShowFilters] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedLog, setSelectedLog] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const logsPerPage = 50

  const { logs, loading, hasMultiOrgAccess } = useBillingLogs()
  const { settings } = useSettings()
  const { userProfile } = useAuth()
  const { selectedOrgId, getCurrentOrganization } = useOrg()
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

  const handleViewDetails = async (log) => {
    setSelectedLog(log)
    setShowDetailsModal(true)
    
    // Log bill details view
    try {
      await logUserAction(
        'BILL_DETAILS_VIEW',
        `Viewed bill details for receipt #${log.receiptNo}`,
        userProfile,
        log.orgId || currentOrgId,
        {
          receiptNo: log.receiptNo,
          totalAmount: log.total,
          itemCount: log.cart?.length || 0,
          hasDiscounts: log.cart?.some(item => {
            const discountBreakdown = getCartDiscountBreakdown(log.cart, log.billingSettings || settings)
            return discountBreakdown.totalDiscount > 0
          })
        }
      )
    } catch (logError) {
      console.error('Failed to log bill details view:', logError)
    }
  }

  const handleCloseDetails = () => {
    setShowDetailsModal(false)
    setSelectedLog(null)
  }

  const handleReprint = async (log) => {
    if (!canReprint(log)) {
      if (!settings?.reprintEnabled) {
        addToast('Reprint functionality is disabled. Please enable it in settings to reprint bills.', 'warning')
      } else if (!isSameDay(log.createdAt)) {
        addToast('Reprint is only available for bills created today. This bill was created on a different date.', 'warning')
      }
      return
    }

    try {
      // Log the reprint action
      await logUserAction('bill_reprinted', `Reprinted bill #${log.receiptNo}`, userProfile, selectedOrgId)

      // Calculate bill details
      const rSub = log.cart.reduce((s, item) => s + item.price * item.qty - getItemDiscount(item, settings), 0)
      const discountPct = (settings?.discountMode === DEFAULT_DISCOUNT_MODE && settings?.globalDiscount) ? settings.globalDiscount : 0
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
${log.customer ? `<div class="row muted"><span>Customer:</span><span>${log.customer.name}${log.customer.phone ? ` (${log.customer.phone})` : ''}</span></div>` : ''}
${log.paymentMethod ? `<div class="row muted"><span>Payment:</span><span>${log.paymentMethod === 'cash' ? 'Cash' : log.paymentMethod === 'card' ? 'Card' : log.paymentMethod === 'credit' ? 'Credit' : 'Split'}</span></div>` : ''}
${log.paymentMethod === 'split' && log.paymentDetails ? `
${log.paymentDetails.cashAmount > 0 ? `<div class="row muted"><span style="margin-left: 20px;">Cash:</span><span>${fmt(log.paymentDetails.cashAmount, sym)}</span></div>` : ''}
${log.paymentDetails.cardAmount > 0 ? `<div class="row muted"><span style="margin-left: 20px;">Card:</span><span>${fmt(log.paymentDetails.cardAmount, sym)}</span></div>` : ''}
` : ''}
<div class="reprint-note">*** REPRINT ***</div>
<div class="row center muted"><span>Reprinted: ${reprintDateTime}</span></div>
<div class="divider"></div>
${log.cart.map(item => {
  const discountDetails = getItemDiscountDetails(item, log.billingSettings || settings)
  const lineTotal = item.price * item.qty
  const discountedTotal = lineTotal - discountDetails.amount
  const hasDiscount = discountDetails.amount > 0
  return `<div class="row">
  <span class="row-name">${item.name} &times; ${formatQty(item.qty, item.selectedUnit || item.unit)}${hasDiscount ? ` <span class="muted">(${fmt(lineTotal, sym)} → ${fmt(discountedTotal, sym)}${discountDetails.description ? ` - ${discountDetails.description}` : ''})</span>` : ''}</span>
  <span class="row-amount">${fmt(discountedTotal, sym)}</span>
</div>`
}).join('')}
<div class="divider"></div>
<div class="row"><span>Gross Amount</span><span>${fmt(log.cart.reduce((s, item) => s + item.price * item.qty, 0), sym)}</span></div>
${(() => {
  const discountBreakdown = getCartDiscountBreakdown(log.cart, log.billingSettings || settings)
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
${taxEnabled ? `<div class="row muted"><span>Tax (${taxRate}%)</span><span>${fmt(rTax, sym)}</span></div>` : ''}
<div class="divider"></div>
<div class="row total-row"><span>TOTAL</span><span>${fmt(rTotal, sym)}</span></div>
<div class="divider"></div>
${log.paymentDetails && (log.paymentDetails.amountGiven > 0 || log.paymentDetails.balanceReturned > 0) ? `
${log.paymentDetails.amountGiven > 0 ? `<div class="row"><span>Amount Given</span><span>${fmt(log.paymentDetails.amountGiven, sym)}</span></div>` : ''}
${log.paymentDetails.balanceReturned > 0 ? `<div class="row"><span>Balance Returned</span><span class="text-emerald-600">${fmt(log.paymentDetails.balanceReturned, sym)}</span></div>` : ''}
<div class="divider"></div>
` : ''}
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
          {hasMultiOrgAccess && getCurrentOrganization() && (
            <p className="mt-1 text-sm text-blue-600 font-medium">
              Showing bills for: {getCurrentOrganization().name}
            </p>
          )}
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
                  {hasMultiOrgAccess && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Organization
                    </th>
                  )}
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
                    <td colSpan={hasMultiOrgAccess ? "7" : "6"} className="px-6 py-12 text-center text-gray-500">
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
                      {hasMultiOrgAccess && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                            {log.orgName || 'Unknown Organization'}
                          </span>
                        </td>
                      )}
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
                          <button
                            onClick={() => handleViewDetails(log)}
                            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                            title="View Bill Details"
                          >
                            View
                          </button>
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

      {/* Bill Details Modal */}
      {showDetailsModal && selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Bill Details</h2>
                <button
                  onClick={handleCloseDetails}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Receipt Header */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold">Receipt #{selectedLog.receiptNo}</p>
                  <p className="text-sm text-gray-400">{fmtDate(selectedLog.createdAt)} {fmtTime(selectedLog.createdAt)}</p>
                </div>
                
                {/* Organization Info */}
                {hasMultiOrgAccess && selectedLog.orgName && (
                  <div className="mb-3 text-xs text-gray-500">
                    <span className="font-medium">Organization:</span> {selectedLog.orgName}
                  </div>
                )}
                
                {/* Cashier Info */}
                {selectedLog.cashierName && (
                  <div className="mb-3 text-xs text-gray-500">
                    <span className="font-medium">Cashier:</span> {selectedLog.cashierName}
                  </div>
                )}

                {/* Customer Info */}
                {selectedLog.customer && (
                  <div className="mb-3 text-xs text-gray-500">
                    <span className="font-medium">Customer:</span> {selectedLog.customer.name}
                    {selectedLog.customer.phone && ` (${selectedLog.customer.phone})`}
                  </div>
                )}

                {/* Payment Details */}
                {selectedLog.paymentMethod && (
                  <div className="mb-3 text-xs text-gray-500 space-y-1">
                    <div>
                      <span className="font-medium">Payment:</span>{' '}
                      {selectedLog.paymentMethod === 'cash' ? 'Cash' : 
                       selectedLog.paymentMethod === 'card' ? 'Card' : 
                       selectedLog.paymentMethod === 'digital' ? 'Digital' :
                       selectedLog.paymentMethod === 'credit' ? 'Credit' : 'Split'}
                    </div>
                    {selectedLog.paymentMethod === 'split' && selectedLog.paymentDetails && (
                      <div className="ml-4 space-y-0.5">
                        {selectedLog.paymentDetails.cashAmount > 0 && (
                          <div>
                            <span className="font-medium">Cash:</span> {fmt(selectedLog.paymentDetails.cashAmount, sym)}
                          </div>
                        )}
                        {selectedLog.paymentDetails.cardAmount > 0 && (
                          <div>
                            <span className="font-medium">Card:</span> {fmt(selectedLog.paymentDetails.cardAmount, sym)}
                          </div>
                        )}
                      </div>
                    )}
                    {/* Amount Given and Balance Returned */}
                    {selectedLog.paymentDetails && (selectedLog.paymentDetails.amountGiven > 0 || selectedLog.paymentDetails.balanceReturned > 0) && (
                      <div className="ml-4 space-y-0.5">
                        {selectedLog.paymentDetails.amountGiven > 0 && (
                          <div>
                            <span className="font-medium">Amount Given:</span> {fmt(selectedLog.paymentDetails.amountGiven, sym)}
                          </div>
                        )}
                        {selectedLog.paymentDetails.balanceReturned > 0 && (
                          <div className="text-emerald-600">
                            <span className="font-medium">Balance Returned:</span> {fmt(selectedLog.paymentDetails.balanceReturned, sym)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Cart Items */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Items</h3>
                <div className="space-y-2">
                  {selectedLog.cart.map((item, index) => {
                    const discountDetails = getItemDiscountDetails(item, selectedLog.billingSettings || settings)
                    const lineTotal = item.price * item.qty
                    const discountedTotal = lineTotal - discountDetails.amount
                    const hasDiscount = discountDetails.amount > 0
                    
                    return (
                      <div key={index} className="flex justify-between text-sm py-1 gap-2">
                        <span className="text-gray-700 flex-1 min-w-0">
                          <span className="block truncate">{item.name} × {formatQty(item.qty, item.selectedUnit || item.unit)}</span>
                          {hasDiscount && (
                            <span className="text-xs text-rose-500">
                              ({fmt(lineTotal, sym)} → {fmt(discountedTotal, sym)}{discountDetails.description ? ` - ${discountDetails.description}` : ''})
                            </span>
                          )}
                        </span>
                        <span className="font-medium whitespace-nowrap">{fmt(discountedTotal, sym)}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Summary */}
              <div className="border-t border-gray-200 pt-4 space-y-1 text-sm">
                {/* Calculate totals */}
                {(() => {
                  const rSub = selectedLog.cart.reduce((s, item) => s + item.price * item.qty - getItemDiscount(item, settings), 0)
                  const discountPct = (settings?.discountMode === DEFAULT_DISCOUNT_MODE && settings?.globalDiscount) ? settings.globalDiscount : 0
                  const rDisc = discountPct > 0 ? rSub * (discountPct / 100) : 0
                  const taxEnabled = settings?.taxEnabled || false
                  const taxRate = settings?.taxRate || 0
                  const rTaxBase = rSub - rDisc
                  const rTax = taxEnabled ? rTaxBase * (taxRate / 100) : 0
                  const rTotal = rTaxBase + rTax

                  return (
                    <>
                      <div className="flex justify-between text-gray-500">
                        <span>Gross Amount</span>
                        <span>{fmt(selectedLog.cart.reduce((s, item) => s + item.price * item.qty, 0), sym)}</span>
                      </div>
                      {(() => {
                      const discountBreakdown = getCartDiscountBreakdown(selectedLog.cart, selectedLog.billingSettings || settings)
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
                      
                      {/* Amount Given and Balance Returned */}
                      {selectedLog.paymentDetails && (selectedLog.paymentDetails.amountGiven > 0 || selectedLog.paymentDetails.balanceReturned > 0) && (
                        <>
                          <div className="flex justify-between text-gray-600 pt-1">
                            <span>Amount Given</span>
                            <span>{fmt(selectedLog.paymentDetails.amountGiven, sym)}</span>
                          </div>
                          {selectedLog.paymentDetails.balanceReturned > 0 && (
                            <div className="flex justify-between text-emerald-600">
                              <span>Balance Returned</span>
                              <span>{fmt(selectedLog.paymentDetails.balanceReturned, sym)}</span>
                            </div>
                          )}
                        </>
                      )}
                    </>
                  )
                })()}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              {canReprint(selectedLog) && (
                <button
                  onClick={() => {
                    handleReprint(selectedLog)
                    handleCloseDetails()
                  }}
                  className="px-4 py-2 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-colors"
                >
                  Reprint
                </button>
              )}
              <button
                onClick={handleCloseDetails}
                className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
