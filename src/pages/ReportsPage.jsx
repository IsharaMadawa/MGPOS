import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useOrg } from '../contexts/OrgContext'
import { useOrganizations } from '../hooks/useOrganizations'
import { useReports, getDateRange } from '../hooks/useReports'
import { CURRENCIES } from '../hooks/useSettings'
import { logUserAction } from '../utils/logger'

export default function ReportsPage() {
  const { userProfile, isAdmin, isSuperAdmin, loading: authLoading } = useAuth()
  const { selectedOrgId } = useOrg()
  const { organizations } = useOrganizations()
  const { 
    reports, 
    loading: reportsLoading, 
    error, 
    generateReport, 
    calculateSummary,
    getCashierBreakdown,
    getDailyBreakdown 
  } = useReports()

  const [period, setPeriod] = useState('today')
  const [reportType, setReportType] = useState('summary') // 'summary' or 'detailed'
  const [selectedOrgs, setSelectedOrgs] = useState([])
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [generated, setGenerated] = useState(false)

  // For super admin, determine current org
  const currentOrgId = isSuperAdmin ? selectedOrgId : userProfile?.orgId
  const currentOrg = organizations.find(o => o.id === currentOrgId)
  const currencySymbol = CURRENCIES.find(c => c.code === 'USD')?.symbol || '$'

  if (authLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  if (!isAdmin && !isSuperAdmin) {
    return <Navigate to="/" replace />
  }

  // Show message if no org selected for super admin
  if (isSuperAdmin && !selectedOrgId && selectedOrgs.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Reports</h1>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
            <svg className="w-12 h-12 text-amber-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Select an Organization</h3>
            <p className="text-gray-600">Please select an organization from the navigation bar to generate reports.</p>
          </div>
        </div>
      </div>
    )
  }

  const handleGenerate = async () => {
    const customStartDate = customStart ? new Date(customStart) : null
    const customEndDate = customEnd ? new Date(customEnd) : null
    
    const orgs = isSuperAdmin ? (selectedOrgs.length > 0 ? selectedOrgs : [selectedOrgId]) : [currentOrgId]
    await generateReport(period, customStartDate, customEndDate, orgs)
    setGenerated(true)
    
    // Log report generation
    try {
      await logUserAction(
        'REPORT_GENERATE',
        `Generated ${reportType} report for ${period}${period === 'custom' && customStart && customEnd ? ` (${customStart} to ${customEnd})` : ''}`,
        userProfile,
        currentOrgId,
        {
          period,
          reportType,
          orgIds: orgs,
          transactionCount: reports.length,
          summary: calculateSummary(reports)
        }
      )
    } catch (logError) {
      console.error('Failed to log report generation:', logError)
    }
  }

  const summary = generated ? calculateSummary(reports) : null
  const cashierBreakdown = generated ? getCashierBreakdown(reports) : null
  const dailyBreakdown = generated ? getDailyBreakdown(reports) : null

  const formatCurrency = (amount) => `${currencySymbol}${Number(amount || 0).toFixed(2)}`

  const handleOrgToggle = (orgId) => {
    setSelectedOrgs(prev => 
      prev.includes(orgId) 
        ? prev.filter(id => id !== orgId)
        : [...prev, orgId]
    )
  }

  const handlePrint = async () => {
    if (!generated || !summary) return
    
    const reportOrgs = isSuperAdmin && selectedOrgs.length > 0 
      ? selectedOrgs.map(id => organizations.find(o => o.id === id))
      : [currentOrg]
    
    const orgNames = reportOrgs.map(org => org?.name || 'Unknown Organization').join(', ')
    const now = new Date()
    const reportDate = now.toLocaleDateString()
    const reportTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    
    const printWindow = window.open('', '_blank', 'width=800,height=600')
    if (!printWindow) {
      alert('Please allow popups to print reports.')
      return
    }
    
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Sales Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .header h1 { margin: 0; font-size: 24px; }
          .header .org-info { margin: 10px 0; font-size: 16px; }
          .header .report-info { margin: 5px 0; font-size: 14px; color: #666; }
          .summary { display: flex; justify-content: space-around; margin: 20px 0; }
          .summary-item { text-align: center; padding: 15px; border: 1px solid #ddd; border-radius: 5px; min-width: 120px; }
          .summary-item .label { font-size: 12px; color: #666; text-transform: uppercase; }
          .summary-item .value { font-size: 20px; font-weight: bold; margin: 5px 0; }
          .discount { color: #dc2626; }
          .net { color: #059669; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f5f5f5; font-weight: bold; }
          .text-right { text-align: right; }
          .section-title { font-size: 18px; font-weight: bold; margin: 30px 0 10px 0; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
          @media print { body { margin: 10px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Sales Report</h1>
          <div class="org-info"><strong>Organization(s):</strong> ${orgNames}</div>
          <div class="report-info"><strong>Period:</strong> ${period.charAt(0).toUpperCase() + period.slice(1)}${period === 'custom' && customStart && customEnd ? ` (${customStart} to ${customEnd})` : ''}</div>
          <div class="report-info"><strong>Report Generated:</strong> ${reportDate} at ${reportTime}</div>
          <div class="report-info"><strong>Generated By:</strong> ${userProfile?.displayName || 'Unknown User'}</div>
        </div>
        
        <div class="section-title">Summary</div>
        <div class="summary">
          <div class="summary-item">
            <div class="label">Gross Sales</div>
            <div class="value">${formatCurrency(summary.grossSales)}</div>
          </div>
          <div class="summary-item">
            <div class="label">Total Discounts</div>
            <div class="value discount">${formatCurrency(summary.totalDiscounts)}</div>
          </div>
          <div class="summary-item">
            <div class="label">Net Sales</div>
            <div class="value net">${formatCurrency(summary.netSales)}</div>
          </div>
          <div class="summary-item">
            <div class="label">Transactions</div>
            <div class="value">${summary.transactionCount}</div>
          </div>
        </div>
        
        ${reportType === 'detailed' && cashierBreakdown && cashierBreakdown.length > 0 ? `
        <div class="section-title">Cashier Breakdown</div>
        <table>
          <thead>
            <tr>
              <th>Cashier</th>
              <th class="text-right">Transactions</th>
              <th class="text-right">Gross Sales</th>
              <th class="text-right">Discounts</th>
              <th class="text-right">Net Sales</th>
            </tr>
          </thead>
          <tbody>
            ${cashierBreakdown.map(cashier => `
              <tr>
                <td>${cashier.cashierName}</td>
                <td class="text-right">${cashier.transactionCount}</td>
                <td class="text-right">${formatCurrency(cashier.grossSales)}</td>
                <td class="text-right discount">${formatCurrency(cashier.totalDiscounts)}</td>
                <td class="text-right net">${formatCurrency(cashier.netSales)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ` : ''}
        
        ${reportType === 'detailed' ? `
        <div class="section-title">Bill Details</div>
        <table>
          <thead>
            <tr>
              <th>Receipt #</th>
              <th>Date/Time</th>
              <th>Cashier</th>
              <th class="text-right">Items</th>
              <th class="text-right">Gross</th>
              <th class="text-right">Discount</th>
              <th class="text-right">Net</th>
            </tr>
          </thead>
          <tbody>
            ${reports.map(bill => {
              const trueGross = bill.cart ? bill.cart.reduce((sum, item) => sum + (item.price * item.qty), 0) : 0
              let itemDiscounts = 0
              if (bill.cart) {
                itemDiscounts = bill.cart.reduce((sum, item) => {
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
              const globalDiscount = bill.discountAmount || 0
              const totalDiscounts = itemDiscounts + globalDiscount
              const netSales = trueGross - totalDiscounts
              
              return `
                <tr>
                  <td>${bill.receiptNo}</td>
                  <td>${new Date(bill.createdAt).toLocaleDateString()} ${new Date(bill.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                  <td>${bill.cashierName}</td>
                  <td class="text-right">${bill.itemCount}</td>
                  <td class="text-right">${formatCurrency(trueGross)}</td>
                  <td class="text-right discount">${formatCurrency(totalDiscounts)}</td>
                  <td class="text-right net">${formatCurrency(netSales)}</td>
                </tr>
              `
            }).join('')}
          </tbody>
        </table>
        ` : ''}
        
        ${reportType === 'summary' && dailyBreakdown && dailyBreakdown.length > 0 ? `
        <div class="section-title">Daily Breakdown</div>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th class="text-right">Transactions</th>
              <th class="text-right">Gross Sales</th>
              <th class="text-right">Discounts</th>
              <th class="text-right">Net Sales</th>
            </tr>
          </thead>
          <tbody>
            ${dailyBreakdown.map(day => `
              <tr>
                <td>${new Date(day.date).toLocaleDateString()}</td>
                <td class="text-right">${day.transactionCount}</td>
                <td class="text-right">${formatCurrency(day.grossSales)}</td>
                <td class="text-right discount">${formatCurrency(day.totalDiscounts)}</td>
                <td class="text-right net">${formatCurrency(day.netSales)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ` : ''}
        
        <div style="margin-top: 40px; text-align: center; font-size: 12px; color: #666;">
          <p>End of Report</p>
        </div>
      </body>
      </html>
    `
    
    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.onload = () => {
      printWindow.print()
      printWindow.close()
    }
    
    // Log report printing
    try {
      await logUserAction(
        'REPORT_PRINT',
        `Printed ${reportType} report for ${period}${period === 'custom' && customStart && customEnd ? ` (${customStart} to ${customEnd})` : ''}`,
        userProfile,
        currentOrgId,
        {
          period,
          reportType,
          orgIds: isSuperAdmin && selectedOrgs.length > 0 ? selectedOrgs : [currentOrgId],
          transactionCount: reports.length,
          summary
        }
      )
    } catch (logError) {
      console.error('Failed to log report printing:', logError)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Reports</h1>

        {/* Report Options */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Period Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Period</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'today', label: 'Today' },
                  { value: 'week', label: 'This Week' },
                  { value: 'month', label: 'This Month' },
                  { value: 'year', label: 'This Year' },
                  { value: 'custom', label: 'Custom' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setPeriod(opt.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      period === opt.value
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Report Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setReportType('summary')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    reportType === 'summary'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Summary
                </button>
                <button
                  onClick={() => setReportType('detailed')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    reportType === 'detailed'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Detailed
                </button>
              </div>
            </div>
          </div>

          {/* Custom Date Range */}
          {period === 'custom' && (
            <div className="mt-4 flex gap-4">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                <input
                  type="date"
                  value={customStart}
                  onChange={e => setCustomStart(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">End Date</label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={e => setCustomEnd(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
          )}

          {/* Super Admin: Multi-org Selection */}
          {isSuperAdmin && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Organizations (leave empty for current org)
              </label>
              <div className="flex flex-wrap gap-2">
                {organizations.map(org => (
                  <button
                    key={org.id}
                    onClick={() => handleOrgToggle(org.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      selectedOrgs.includes(org.id)
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {org.name}
                  </button>
                ))}
              </div>
              {selectedOrgs.length > 0 && (
                <p className="text-xs text-gray-500 mt-2">
                  Selected: {selectedOrgs.map(id => organizations.find(o => o.id === id)?.name).join(', ')}
                </p>
              )}
            </div>
          )}

          {/* Generate Button */}
          <div className="mt-5 flex justify-end">
            <button
              onClick={handleGenerate}
              disabled={reportsLoading}
              className="px-6 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {reportsLoading ? 'Generating...' : 'Generate Report'}
            </button>
          </div>

          {error && (
            <div className="mt-3 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Report Results */}
        {generated && summary && (
          <>
            {/* Print Button */}
            <div className="flex justify-end mb-4">
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-slate-700 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print Report
              </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <p className="text-xs text-gray-500 uppercase">Gross Sales</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.grossSales)}</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <p className="text-xs text-gray-500 uppercase">Total Discounts</p>
                <p className="text-2xl font-bold text-rose-600">{formatCurrency(summary.totalDiscounts)}</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <p className="text-xs text-gray-500 uppercase">Net Sales</p>
                <p className="text-2xl font-bold text-emerald-600">{formatCurrency(summary.netSales)}</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <p className="text-xs text-gray-500 uppercase">Transactions</p>
                <p className="text-2xl font-bold text-gray-900">{summary.transactionCount}</p>
              </div>
            </div>

            {/* Detailed Report */}
            {reportType === 'detailed' && (
              <div className="space-y-6">
                {/* Cashier Breakdown */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900">Cashier Breakdown</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
                        <tr>
                          <th className="px-4 py-3">Cashier</th>
                          <th className="px-4 py-3 text-right">Transactions</th>
                          <th className="px-4 py-3 text-right">Gross Sales</th>
                          <th className="px-4 py-3 text-right">Discounts</th>
                          <th className="px-4 py-3 text-right">Net Sales</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {cashierBreakdown.map((cashier, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium">{cashier.cashierName}</td>
                            <td className="px-4 py-3 text-right">{cashier.transactionCount}</td>
                            <td className="px-4 py-3 text-right">{formatCurrency(cashier.grossSales)}</td>
                            <td className="px-4 py-3 text-right text-rose-600">{formatCurrency(cashier.totalDiscounts)}</td>
                            <td className="px-4 py-3 text-right font-medium">{formatCurrency(cashier.netSales)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Bill Details */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900">Bill Details</h3>
                  </div>
                  <div className="overflow-x-auto max-h-96 overflow-y-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase sticky top-0">
                        <tr>
                          <th className="px-4 py-3">Receipt #</th>
                          <th className="px-4 py-3">Date/Time</th>
                          <th className="px-4 py-3">Cashier</th>
                          <th className="px-4 py-3 text-right">Items</th>
                          <th className="px-4 py-3 text-right">Gross</th>
                          <th className="px-4 py-3 text-right">Discount</th>
                          <th className="px-4 py-3 text-right">Net</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {reports.map((bill, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-mono text-sm">{bill.receiptNo}</td>
                            <td className="px-4 py-3 text-sm">
                              {new Date(bill.createdAt).toLocaleDateString()}{' '}
                              {new Date(bill.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="px-4 py-3 text-sm">{bill.cashierName}</td>
                            <td className="px-4 py-3 text-right">{bill.itemCount}</td>
                            <td className="px-4 py-3 text-right">{formatCurrency(bill.cart ? bill.cart.reduce((sum, item) => sum + (item.price * item.qty), 0) : 0)}</td>
                            <td className="px-4 py-3 text-right text-rose-600">
                              {(() => {
                                let itemDiscounts = 0
                                if (bill.cart) {
                                  itemDiscounts = bill.cart.reduce((sum, item) => {
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
                                const globalDiscount = bill.discountAmount || 0
                                return formatCurrency(itemDiscounts + globalDiscount)
                              })()}
                            </td>
                            <td className="px-4 py-3 text-right font-medium">
                              {(() => {
                                const trueGross = bill.cart ? bill.cart.reduce((sum, item) => sum + (item.price * item.qty), 0) : 0
                                let itemDiscounts = 0
                                if (bill.cart) {
                                  itemDiscounts = bill.cart.reduce((sum, item) => {
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
                                const globalDiscount = bill.discountAmount || 0
                                const netSales = trueGross - itemDiscounts - globalDiscount
                                return formatCurrency(netSales)
                              })()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Daily Breakdown for Summary */}
            {reportType === 'summary' && dailyBreakdown.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">Daily Breakdown</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
                      <tr>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3 text-right">Transactions</th>
                        <th className="px-4 py-3 text-right">Gross Sales</th>
                        <th className="px-4 py-3 text-right">Discounts</th>
                        <th className="px-4 py-3 text-right">Net Sales</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {dailyBreakdown.map((day, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3">{new Date(day.date).toLocaleDateString()}</td>
                          <td className="px-4 py-3 text-right">{day.transactionCount}</td>
                          <td className="px-4 py-3 text-right">{formatCurrency(day.grossSales)}</td>
                          <td className="px-4 py-3 text-right text-rose-600">{formatCurrency(day.totalDiscounts)}</td>
                          <td className="px-4 py-3 text-right font-medium">{formatCurrency(day.netSales)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {generated && reports.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500">No transactions found for the selected period.</p>
          </div>
        )}
      </div>
    </div>
  )
}