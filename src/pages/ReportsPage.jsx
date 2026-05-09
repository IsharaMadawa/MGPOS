import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useOrg } from '../contexts/OrgContext'
import { useOrganizations } from '../hooks/useOrganizations'
import { useReports, getDateRange } from '../hooks/useReports'
import { useSettings } from '../hooks/useSettings'
import { logUserAction } from '../utils/logger'
import { useToast } from '../components/ToastContainer'
import { getItemDiscountDetails, getCartDiscountBreakdown } from '../utils/discountUtils'
import { DiscountType, DiscountMode, PaymentMethod, ReportType, ReportPeriod, DEFAULT_REPORT_TYPE, DEFAULT_REPORT_PERIOD } from '../constants/enums'

export default function ReportsPage() {
  const { userProfile, isAdmin, isSuperAdmin, loading: authLoading } = useAuth()
  const { selectedOrgId, getAdminOrganizations } = useOrg()
  const { organizations } = useOrganizations()
  const { 
    reports, 
    loading: reportsLoading, 
    error, 
    generateReport, 
    calculateSummary,
    getCashierBreakdown,
    getDailyBreakdown,
    getDailyBreakdownByOrg
  } = useReports()
  const { addToast } = useToast()
  const { currencySymbol } = useSettings()

  const [period, setPeriod] = useState(DEFAULT_REPORT_PERIOD)
  const [reportType, setReportType] = useState(DEFAULT_REPORT_TYPE) // ReportType.SUMMARY, ReportType.DETAILED, ReportType.CASH, ReportType.CARD
  const [selectedOrgs, setSelectedOrgs] = useState([])
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [generated, setGenerated] = useState(false)

  // For super admin, determine current org
  const currentOrgId = isSuperAdmin ? selectedOrgId : userProfile?.orgId
  const currentOrg = organizations.find(o => o.id === currentOrgId)

  // Check if user has multi-organization admin access
  const adminOrganizations = getAdminOrganizations()
  const hasMultiOrgAccess = isSuperAdmin || (adminOrganizations.length > 1)

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

  // Show message if no org selected for users with multi-org access
  if (hasMultiOrgAccess && !selectedOrgId && selectedOrgs.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Reports</h1>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
            <svg className="w-12 h-12 text-amber-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Select an Organization</h3>
            <p className="text-gray-600">Please select an organization from the navigation bar or use the multi-organization selector below to generate reports.</p>
          </div>
        </div>
      </div>
    )
  }

  const handleGenerate = async () => {
    try {
      const customStartDate = customStart ? new Date(customStart) : null
      const customEndDate = customEnd ? new Date(customEnd) : null
      
      let orgs = []
      
      if (hasMultiOrgAccess) {
        // For users with multi-org access (super admin or multi-org admin): use selected orgs if any, otherwise use current selected org
        orgs = selectedOrgs.length > 0 ? selectedOrgs : (selectedOrgId ? [selectedOrgId] : [])
      } else {
        // For single-org admins: always use their assigned org
        orgs = [currentOrgId]
      }
      
      // Don't generate report if no organizations are selected
      if (orgs.length === 0) {
        addToast('Please select at least one organization', 'error')
        return
      }
      
      const result = await generateReport(period, customStartDate, customEndDate, orgs)
      
      if (result === null && error) {
        // Error already set by generateReport
        return
      }
      
      setGenerated(true)
      
      // Log report generation
      try {
        await logUserAction(
          'REPORT_GENERATE',
          `Generated ${reportType} report for ${period}${period === ReportPeriod.CUSTOM && customStart && customEnd ? ` (${customStart} to ${customEnd})` : ''}`,
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
    } catch (err) {
      console.error('Error in handleGenerate:', err)
      addToast('Failed to generate report. Please try again.', 'error')
      setError(err.message)
    }
  }

  const summary = generated ? (() => {
    try {
      return calculateSummary(reports)
    } catch (error) {
      console.error('Error calculating summary:', error)
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
  })() : null
  const cashierBreakdown = generated ? (() => {
    try {
      return getCashierBreakdown(reports)
    } catch (error) {
      console.error('Error calculating cashier breakdown:', error)
      return []
    }
  })() : null
  const dailyBreakdown = generated ? (() => {
    try {
      return hasMultiOrgAccess && selectedOrgs.length > 0 ? getDailyBreakdownByOrg(reports) : getDailyBreakdown(reports)
    } catch (error) {
      console.error('Error calculating daily breakdown:', error)
      return []
    }
  })() : null

  const formatCurrency = (amount) => `${currencySymbol}${Number(amount || 0).toFixed(2)}`

  // Helper functions to filter reports by payment method
  const filterReportsByPaymentMethod = (reports, method) => {
    if (!reports || !Array.isArray(reports)) return []
    
    try {
      return reports.filter(bill => {
        if (!bill) return false
        
        if (method === PaymentMethod.CASH) {
          return bill.paymentMethod === PaymentMethod.CASH || (bill.paymentMethod === PaymentMethod.SPLIT && bill.paymentDetails?.cashAmount > 0)
        } else if (method === PaymentMethod.CARD) {
          return bill.paymentMethod === PaymentMethod.CARD || (bill.paymentMethod === PaymentMethod.SPLIT && bill.paymentDetails?.cardAmount > 0)
        } else if (method === PaymentMethod.DIGITAL) {
          return bill.paymentMethod === PaymentMethod.DIGITAL
        } else if (method === PaymentMethod.CREDIT) {
          return bill.paymentMethod === PaymentMethod.CREDIT
        }
        return true
      })
    } catch (error) {
      console.error('Error filtering reports by payment method:', error)
      return []
    }
  }

  const calculatePaymentMethodSummary = (reports, method) => {
    try {
      const filteredReports = filterReportsByPaymentMethod(reports, method)
      let totalAmount = 0
      let grossSales = 0
      let totalDiscounts = 0
      
      filteredReports.forEach(bill => {
        if (!bill) return
        
        try {
          grossSales += bill.cart ? bill.cart.reduce((sum, item) => {
            if (!item || !item.price || !item.qty) return sum
            return sum + (item.price * item.qty)
          }, 0) : 0
          
          let itemDiscounts = 0
          if (bill.cart && Array.isArray(bill.cart)) {
            itemDiscounts = bill.cart.reduce((sum, item) => {
              if (!item || !item.price || !item.qty) return sum
              const lineTotal = item.price * item.qty
              let itemDiscount = 0
              try {
                if (item.cartDiscount != null && item.cartDiscount !== '') {
                  const val = parseFloat(item.cartDiscount) || 0
                  itemDiscount = Math.min(Math.max(val, 0), lineTotal)
                } else if (item.discount?.enabled) {
                  if (item.discount.type === DiscountType.PERCENTAGE) {
                    itemDiscount = lineTotal * (item.discount.value / 100)
                  } else {
                    itemDiscount = Math.min(item.discount.value * item.qty, lineTotal)
                  }
                }
              } catch (discountError) {
                console.warn('Error calculating item discount:', discountError)
              }
              return sum + itemDiscount
            }, 0)
          }
          const globalDiscount = bill.discountAmount || 0
          totalDiscounts += itemDiscounts + globalDiscount
          
          if (method === PaymentMethod.CASH && bill.paymentMethod === PaymentMethod.SPLIT) {
            totalAmount += bill.paymentDetails?.cashAmount || 0
          } else if (method === PaymentMethod.CARD && bill.paymentMethod === PaymentMethod.SPLIT) {
            totalAmount += bill.paymentDetails?.cardAmount || 0
          } else if (method === PaymentMethod.DIGITAL) {
            totalAmount += bill.total || 0
          } else if (method === PaymentMethod.CREDIT) {
            totalAmount += bill.total || 0
          } else {
            totalAmount += bill.total || 0
          }
        } catch (billError) {
          console.warn('Error processing bill in payment method summary:', billError)
        }
      })
      
      return {
        transactionCount: filteredReports.length,
        grossSales,
        totalDiscounts,
        netSales: grossSales - totalDiscounts,
        totalAmount
      }
    } catch (error) {
      console.error('Error in calculatePaymentMethodSummary:', error)
      return {
        transactionCount: 0,
        grossSales: 0,
        totalDiscounts: 0,
        netSales: 0,
        totalAmount: 0
      }
    }
  }

  const handleOrgToggle = (orgId) => {
    setSelectedOrgs(prev => 
      prev.includes(orgId) 
        ? prev.filter(id => id !== orgId)
        : [...prev, orgId]
    )
  }

  const handlePrint = async () => {
    if (!generated) return
    
    const reportOrgs = hasMultiOrgAccess && selectedOrgs.length > 0 
      ? selectedOrgs.map(id => organizations.find(o => o.id === id))
      : [currentOrg]
    
    const orgNames = reportOrgs.map(org => org?.name || 'Unknown Organization').join(', ')
    const now = new Date()
    const reportDate = now.toLocaleDateString()
    const reportTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    
    // Get appropriate summary based on report type
    let currentSummary = summary
    if (reportType === ReportType.CASH || reportType === ReportType.CARD || reportType === ReportType.DIGITAL || reportType === ReportType.CREDIT) {
      currentSummary = calculatePaymentMethodSummary(reports, reportType)
    }
    
    const printWindow = window.open('', '_blank', 'width=800,height=600')
    if (!printWindow) {
      addToast('Please allow popups to print reports.', 'warning')
      return
    }
    
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${reportType === ReportType.CASH ? 'Cash Sales Report' : reportType === ReportType.CARD ? 'Card Sales Report' : reportType === ReportType.DIGITAL ? 'Digital Sales Report' : reportType === ReportType.CREDIT ? 'Credit Sales Report' : 'Sales Report'}</title>
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
          <h1>${reportType === ReportType.CASH ? 'Cash Sales Report' : reportType === ReportType.CARD ? 'Card Sales Report' : reportType === ReportType.DIGITAL ? 'Digital Sales Report' : reportType === ReportType.CREDIT ? 'Credit Sales Report' : 'Sales Report'}</h1>
          <div class="org-info"><strong>Organization(s):</strong> ${orgNames}</div>
          <div class="report-info"><strong>Period:</strong> ${period.charAt(0).toUpperCase() + period.slice(1)}${period === ReportPeriod.CUSTOM && customStart && customEnd ? ` (${customStart} to ${customEnd})` : ''}</div>
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
        
        ${reportType === ReportType.DETAILED && cashierBreakdown && cashierBreakdown.length > 0 ? `
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
        
        ${reportType === ReportType.DETAILED ? `
        <div class="section-title">Bill Details</div>
        <table>
          <thead>
            <tr>
              <th>Receipt #</th>
              <th>Date/Time</th>
              ${(hasMultiOrgAccess && selectedOrgs.length > 0) ? '<th>Organization</th>' : ''}
              <th>Cashier</th>
              <th>Payment Method</th>
              <th class="text-right">Items</th>
              <th class="text-right">Gross</th>
              <th class="text-right">Discount</th>
              <th>Discount Details</th>
              <th class="text-right">Net</th>
            </tr>
          </thead>
          <tbody>
            ${reports.map(bill => {
              let discountBreakdown = { totalDiscount: 0, itemDiscounts: [], globalDiscount: 0 }
              try {
                discountBreakdown = getCartDiscountBreakdown(bill.cart, bill.billingSettings)
              } catch (error) {
                console.warn('Error calculating discount breakdown for bill', bill.receiptNo, error)
              }
              const trueGross = bill.cart ? bill.cart.reduce((sum, item) => sum + (item.price * item.qty), 0) : 0
              const totalDiscounts = discountBreakdown.totalDiscount
              const netSales = trueGross - totalDiscounts
              
              // Generate discount details text
              const discountDetailsText = discountBreakdown.itemDiscounts
                .filter(item => item.discount.amount > 0)
                .map(item => `${item.itemName}(${item.discount.description})`)
                .join(', ')
              
              const globalDiscountText = discountBreakdown.globalDiscount > 0 
                ? `Global: ${discountBreakdown.globalDiscountPercentage}%` 
                : ''
              
              const allDiscountDetails = [discountDetailsText, globalDiscountText].filter(Boolean).join('; ')
              
              return `
                <tr>
                  <td>${bill.receiptNo}</td>
                  <td>${new Date(bill.createdAt).toLocaleDateString()} ${new Date(bill.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                  ${(hasMultiOrgAccess && selectedOrgs.length > 0) ? `<td>${bill.orgName || organizations.find(o => o.id === bill.orgId)?.name || 'Unknown Organization'}</td>` : ''}
                  <td>${bill.cashierName}</td>
                  <td>${bill.paymentMethod === ReportType.CASH ? 'Cash' : bill.paymentMethod === ReportType.CARD ? 'Card' : bill.paymentMethod === ReportType.DIGITAL ? 'Digital' : bill.paymentMethod === ReportType.CREDIT ? 'Credit' : bill.paymentMethod === PaymentMethod.SPLIT ? 'Split' : 'Unknown'}</td>
                  <td class="text-right">${bill.itemCount}</td>
                  <td class="text-right">${formatCurrency(trueGross)}</td>
                  <td class="text-right discount">${formatCurrency(totalDiscounts)}</td>
                  <td class="text-left" style={{fontSize: '11px', maxWidth: '200px', wordWrap: 'break-word'}}>${allDiscountDetails || 'No discounts'}</td>
                  <td class="text-right net">${formatCurrency(netSales)}</td>
                </tr>
              `
            }).join('')}
          </tbody>
          <tfoot>
            <tr style={{backgroundColor: '#f5f5f5', fontWeight: 'bold', borderTop: '2px solid #333'}}>
              <td colspan="${hasMultiOrgAccess && selectedOrgs.length > 0 ? '5' : '4'}" style={{textAlign: 'right', padding: '8px'}}>
                TOTALS
              </td>
              <td style={{textAlign: 'right', padding: '8px'}}>
                ${reports.reduce((sum, bill) => sum + (bill.itemCount || 0), 0)}
              </td>
              <td style={{textAlign: 'right', padding: '8px'}}>
                ${formatCurrency(reports.reduce((sum, bill) => {
                  return sum + (bill.cart ? bill.cart.reduce((itemSum, item) => itemSum + (item.price * item.qty), 0) : 0)
                }, 0))}
              </td>
              <td style={{textAlign: 'right', padding: '8px', color: '#dc2626'}}>
                ${formatCurrency(reports.reduce((sum, bill) => {
                  let itemDiscounts = 0
                  if (bill.cart) {
                    itemDiscounts = bill.cart.reduce((discSum, item) => {
                      const lineTotal = item.price * item.qty
                      let itemDiscount = 0
                      if (item.cartDiscount != null && item.cartDiscount !== '') {
                        const val = parseFloat(item.cartDiscount) || 0
                        itemDiscount = Math.min(Math.max(val, 0), lineTotal)
                      } else if (item.discount?.enabled) {
                        if (item.discount.type === DiscountType.PERCENTAGE) {
                          itemDiscount = lineTotal * (item.discount.value / 100)
                        } else {
                          itemDiscount = Math.min(item.discount.value * item.qty, lineTotal)
                        }
                      }
                      return discSum + itemDiscount
                    }, 0)
                  }
                  const globalDiscount = bill.discountAmount || 0
                  return sum + itemDiscounts + globalDiscount
                }, 0))}
              </td>
              <td style={{textAlign: 'right', padding: '8px', color: '#059669', fontWeight: 'bold'}}>
                ${formatCurrency(reports.reduce((sum, bill) => {
                  const trueGross = bill.cart ? bill.cart.reduce((itemSum, item) => itemSum + (item.price * item.qty), 0) : 0
                  let itemDiscounts = 0
                  if (bill.cart) {
                    itemDiscounts = bill.cart.reduce((discSum, item) => {
                      const lineTotal = item.price * item.qty
                      let itemDiscount = 0
                      if (item.cartDiscount != null && item.cartDiscount !== '') {
                        const val = parseFloat(item.cartDiscount) || 0
                        itemDiscount = Math.min(Math.max(val, 0), lineTotal)
                      } else if (item.discount?.enabled) {
                        if (item.discount.type === DiscountType.PERCENTAGE) {
                          itemDiscount = lineTotal * (item.discount.value / 100)
                        } else {
                          itemDiscount = Math.min(item.discount.value * item.qty, lineTotal)
                        }
                      }
                      return discSum + itemDiscount
                    }, 0)
                  }
                  const globalDiscount = bill.discountAmount || 0
                  const netSales = trueGross - itemDiscounts - globalDiscount
                  return sum + netSales
                }, 0))}
              </td>
            </tr>
          </tfoot>
        </table>
        ` : ''}
        
        ${reportType === ReportType.SUMMARY && dailyBreakdown && dailyBreakdown.length > 0 ? `
        <div class="section-title">Daily Breakdown</div>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              ${(hasMultiOrgAccess && selectedOrgs.length > 0) ? '<th>Organization</th>' : ''}
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
                ${(hasMultiOrgAccess && selectedOrgs.length > 0) ? `<td>${day.orgName || 'Unknown Organization'}</td>` : ''}
                <td class="text-right">${day.transactionCount}</td>
                <td class="text-right">${formatCurrency(day.grossSales)}</td>
                <td class="text-right discount">${formatCurrency(day.totalDiscounts)}</td>
                <td class="text-right net">${formatCurrency(day.netSales)}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr style={{backgroundColor: '#f5f5f5', fontWeight: 'bold', borderTop: '2px solid #333'}}>
              <td colspan="${hasMultiOrgAccess && selectedOrgs.length > 0 ? '2' : '1'}" style={{textAlign: 'right', padding: '8px'}}>
                TOTALS
              </td>
              <td style={{textAlign: 'right', padding: '8px'}}>
                ${dailyBreakdown.reduce((sum, day) => sum + day.transactionCount, 0)}
              </td>
              <td style={{textAlign: 'right', padding: '8px'}}>
                ${formatCurrency(dailyBreakdown.reduce((sum, day) => sum + day.grossSales, 0))}
              </td>
              <td style={{textAlign: 'right', padding: '8px', color: '#dc2626'}}>
                ${formatCurrency(dailyBreakdown.reduce((sum, day) => sum + day.totalDiscounts, 0))}
              </td>
              <td style={{textAlign: 'right', padding: '8px', color: '#059669', fontWeight: 'bold'}}>
                ${formatCurrency(dailyBreakdown.reduce((sum, day) => sum + day.netSales, 0))}
              </td>
            </tr>
          </tfoot>
        </table>
        ` : ''}
        
        ${(reportType === ReportType.CASH || reportType === ReportType.CARD || reportType === ReportType.DIGITAL || reportType === ReportType.CREDIT) ? `
        <div class="section-title">${reportType === ReportType.CASH ? 'Cash Sales' : reportType === ReportType.CARD ? 'Card Sales' : reportType === ReportType.DIGITAL ? 'Digital Sales' : 'Credit Sales'} Details</div>
        <table>
          <thead>
            <tr>
              <th>Receipt #</th>
              <th>Date/Time</th>
              ${(hasMultiOrgAccess && selectedOrgs.length > 0) ? '<th>Organization</th>' : ''}
              <th>Cashier</th>
              <th>Payment Method</th>
              <th class="text-right">Items</th>
              <th class="text-right">Gross</th>
              <th class="text-right">Discount</th>
              <th class="text-right">Net</th>
              <th class="text-right">Amount</th>
              ${reportType === ReportType.CREDIT ? '<th>Customer</th>' : ''}
            </tr>
          </thead>
          <tbody>
            ${filterReportsByPaymentMethod(reports, reportType).map(bill => {
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
                    if (item.discount.type === DiscountType.PERCENTAGE) {
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
              
              let paymentAmount = bill.total || 0
              if (reportType === ReportType.CASH && bill.paymentMethod === PaymentMethod.SPLIT) {
                paymentAmount = bill.paymentDetails?.cashAmount || 0
              } else if (reportType === ReportType.CARD && bill.paymentMethod === PaymentMethod.SPLIT) {
                paymentAmount = bill.paymentDetails?.cardAmount || 0
              }
              
              return `
                <tr>
                  <td>${bill.receiptNo}</td>
                  <td>${new Date(bill.createdAt).toLocaleDateString()} ${new Date(bill.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                  ${(hasMultiOrgAccess && selectedOrgs.length > 0) ? `<td>${bill.orgName || organizations.find(o => o.id === bill.orgId)?.name || 'Unknown Organization'}</td>` : ''}
                  <td>${bill.cashierName}</td>
                  <td>${bill.paymentMethod === ReportType.CASH ? 'Cash' : bill.paymentMethod === ReportType.CARD ? 'Card' : bill.paymentMethod === ReportType.DIGITAL ? 'Digital' : bill.paymentMethod === ReportType.CREDIT ? 'Credit' : bill.paymentMethod === PaymentMethod.SPLIT ? 'Split' : 'Unknown'}</td>
                  <td class="text-right">${bill.itemCount}</td>
                  <td class="text-right">${formatCurrency(trueGross)}</td>
                  <td class="text-right discount">${formatCurrency(totalDiscounts)}</td>
                  <td class="text-right net">${formatCurrency(netSales)}</td>
                  <td class="text-right font-bold">${formatCurrency(paymentAmount)}</td>
                  ${reportType === ReportType.CREDIT ? `<td>${bill.customer ? `${bill.customer.name}${bill.customer.phone ? ` (${bill.customer.phone})` : ''}` : 'No customer'}</td>` : ''}
                </tr>
              `
            }).join('')}
          </tbody>
          <tfoot>
            <tr style={{backgroundColor: '#f5f5f5', fontWeight: 'bold', borderTop: '2px solid #333'}}>
              <td colspan="${hasMultiOrgAccess && selectedOrgs.length > 0 ? '5' : '4'}" style={{textAlign: 'right', padding: '8px'}}>
                TOTALS
              </td>
              <td style={{textAlign: 'right', padding: '8px'}}>
                ${filterReportsByPaymentMethod(reports, reportType).reduce((sum, bill) => sum + (bill.itemCount || 0), 0)}
              </td>
              <td style={{textAlign: 'right', padding: '8px'}}>
                ${formatCurrency(filterReportsByPaymentMethod(reports, reportType).reduce((sum, bill) => {
                  return sum + (bill.cart ? bill.cart.reduce((itemSum, item) => itemSum + (item.price * item.qty), 0) : 0)
                }, 0))}
              </td>
              <td style={{textAlign: 'right', padding: '8px', color: '#dc2626'}}>
                ${formatCurrency(filterReportsByPaymentMethod(reports, reportType).reduce((sum, bill) => {
                  let itemDiscounts = 0
                  if (bill.cart) {
                    itemDiscounts = bill.cart.reduce((discSum, item) => {
                      const lineTotal = item.price * item.qty
                      let itemDiscount = 0
                      if (item.cartDiscount != null && item.cartDiscount !== '') {
                        const val = parseFloat(item.cartDiscount) || 0
                        itemDiscount = Math.min(Math.max(val, 0), lineTotal)
                      } else if (item.discount?.enabled) {
                        if (item.discount.type === DiscountType.PERCENTAGE) {
                          itemDiscount = lineTotal * (item.discount.value / 100)
                        } else {
                          itemDiscount = Math.min(item.discount.value * item.qty, lineTotal)
                        }
                      }
                      return discSum + itemDiscount
                    }, 0)
                  }
                  const globalDiscount = bill.discountAmount || 0
                  return sum + itemDiscounts + globalDiscount
                }, 0))}
              </td>
              <td style={{textAlign: 'right', padding: '8px', color: '#059669'}}>
                ${formatCurrency(filterReportsByPaymentMethod(reports, reportType).reduce((sum, bill) => {
                  const trueGross = bill.cart ? bill.cart.reduce((itemSum, item) => itemSum + (item.price * item.qty), 0) : 0
                  let itemDiscounts = 0
                  if (bill.cart) {
                    itemDiscounts = bill.cart.reduce((discSum, item) => {
                      const lineTotal = item.price * item.qty
                      let itemDiscount = 0
                      if (item.cartDiscount != null && item.cartDiscount !== '') {
                        const val = parseFloat(item.cartDiscount) || 0
                        itemDiscount = Math.min(Math.max(val, 0), lineTotal)
                      } else if (item.discount?.enabled) {
                        if (item.discount.type === DiscountType.PERCENTAGE) {
                          itemDiscount = lineTotal * (item.discount.value / 100)
                        } else {
                          itemDiscount = Math.min(item.discount.value * item.qty, lineTotal)
                        }
                      }
                      return discSum + itemDiscount
                    }, 0)
                  }
                  const globalDiscount = bill.discountAmount || 0
                  const netSales = trueGross - itemDiscounts - globalDiscount
                  return sum + netSales
                }, 0))}
              </td>
              <td style={{textAlign: 'right', padding: '8px', color: '#059669', fontWeight: 'bold'}}>
                ${formatCurrency(filterReportsByPaymentMethod(reports, reportType).reduce((sum, bill) => {
                  if (reportType === ReportType.CASH && bill.paymentMethod === PaymentMethod.SPLIT) {
                    return sum + (bill.paymentDetails?.cashAmount || 0)
                  } else if (reportType === ReportType.CARD && bill.paymentMethod === PaymentMethod.SPLIT) {
                    return sum + (bill.paymentDetails?.cardAmount || 0)
                  }
                  return sum + (bill.total || 0)
                }, 0))}
              </td>
            </tr>
          </tfoot>
        </table>
        
        ${(reportType === ReportType.CASH || reportType === ReportType.CARD) && filterReportsByPaymentMethod(reports, reportType).some(bill => bill.paymentMethod === PaymentMethod.SPLIT) ? `
        <div class="section-title">Split Payment Details</div>
        <table>
          <thead>
            <tr>
              <th>Receipt #</th>
              <th>Date</th>
              <th>Cashier</th>
              <th class="text-right">Cash Amount</th>
              <th class="text-right">Card Amount</th>
              <th class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${filterReportsByPaymentMethod(reports, reportType)
              .filter(bill => bill.paymentMethod === PaymentMethod.SPLIT)
              .map(bill => `
                <tr>
                  <td>${bill.receiptNo}</td>
                  <td>${new Date(bill.createdAt).toLocaleDateString()}</td>
                  <td>${bill.cashierName}</td>
                  <td class="text-right">${formatCurrency(bill.paymentDetails?.cashAmount || 0)}</td>
                  <td class="text-right">${formatCurrency(bill.paymentDetails?.cardAmount || 0)}</td>
                  <td class="text-right font-bold">${formatCurrency(bill.total || 0)}</td>
                </tr>
              `).join('')}
          </tbody>
          <tfoot>
            <tr style={{backgroundColor: '#f5f5f5', fontWeight: 'bold', borderTop: '2px solid #333'}}>
              <td colspan="3" style="text-align: right; padding: 8px;">TOTALS</td>
              <td style={{textAlign: 'right', padding: '8px'}}>
                ${formatCurrency(filterReportsByPaymentMethod(reports, reportType)
                  .filter(bill => bill.paymentMethod === PaymentMethod.SPLIT)
                  .reduce((sum, bill) => sum + (bill.paymentDetails?.cashAmount || 0), 0))}
              </td>
              <td style={{textAlign: 'right', padding: '8px'}}>
                ${formatCurrency(filterReportsByPaymentMethod(reports, reportType)
                  .filter(bill => bill.paymentMethod === PaymentMethod.SPLIT)
                  .reduce((sum, bill) => sum + (bill.paymentDetails?.cardAmount || 0), 0))}
              </td>
              <td style={{textAlign: 'right', padding: '8px'}}>
                ${formatCurrency(filterReportsByPaymentMethod(reports, reportType)
                  .filter(bill => bill.paymentMethod === PaymentMethod.SPLIT)
                  .reduce((sum, bill) => sum + (bill.total || 0), 0))}
              </td>
            </tr>
          </tfoot>
        </table>
        ` : ''}
        ` : ''}
        
        <div style={{marginTop: '40px', textAlign: 'center', fontSize: '12px', color: '#666'}}>
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
        `Printed ${reportType} report for ${period}${period === ReportPeriod.CUSTOM && customStart && customEnd ? ` (${customStart} to ${customEnd})` : ''}`,
        userProfile,
        currentOrgId,
        {
          period,
          reportType,
          orgIds: hasMultiOrgAccess && selectedOrgs.length > 0 ? selectedOrgs : [currentOrgId],
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
                  { value: ReportPeriod.CUSTOM, label: 'Custom' },
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
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setReportType(ReportType.SUMMARY)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    reportType === ReportType.SUMMARY
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Summary
                </button>
                <button
                  onClick={() => setReportType(ReportType.DETAILED)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    reportType === ReportType.DETAILED
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Detailed
                </button>
                <button
                  onClick={() => setReportType(ReportType.CASH)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    reportType === ReportType.CASH
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Cash Sales
                </button>
                <button
                  onClick={() => setReportType(ReportType.CARD)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    reportType === ReportType.CARD
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Card Sales
                </button>
                <button
                  onClick={() => setReportType(ReportType.DIGITAL)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    reportType === ReportType.DIGITAL
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Digital Sales
                </button>
                <button
                  onClick={() => setReportType(ReportType.CREDIT)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    reportType === ReportType.CREDIT
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Credit Sales
                </button>
                              </div>
            </div>
          </div>

          {/* Custom Date Range */}
          {period === ReportPeriod.CUSTOM && (
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

          {/* Multi-org Selection for Super Admins and Organization Admins with multi-org access */}
          {hasMultiOrgAccess && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Organizations (optional - leave empty to use current selected organization)
              </label>
              <div className="flex flex-wrap gap-2">
                {organizations
                  .filter(org => {
                    // For super admins, show all organizations
                    if (isSuperAdmin) return true
                    // For organization admins, only show organizations they have admin access to
                    return adminOrganizations.some(adminOrg => adminOrg.orgId === org.id)
                  })
                  .map(org => (
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
              {(() => {
                if (reportType === ReportType.CASH || reportType === ReportType.CARD || reportType === ReportType.DIGITAL || reportType === ReportType.CREDIT) {
                  const paymentSummary = calculatePaymentMethodSummary(reports, reportType)
                  return (
                    <>
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                        <p className="text-xs text-gray-500 uppercase">Gross Sales</p>
                        <p className="text-2xl font-bold text-gray-900">{formatCurrency(paymentSummary.grossSales)}</p>
                      </div>
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                        <p className="text-xs text-gray-500 uppercase">Total Discounts</p>
                        <p className="text-2xl font-bold text-rose-600">{formatCurrency(paymentSummary.totalDiscounts)}</p>
                      </div>
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                        <p className="text-xs text-gray-500 uppercase">Net Sales</p>
                        <p className="text-2xl font-bold text-emerald-600">{formatCurrency(paymentSummary.netSales)}</p>
                      </div>
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                        <p className="text-xs text-gray-500 uppercase">Transactions</p>
                        <p className="text-2xl font-bold text-gray-900">{paymentSummary.transactionCount}</p>
                      </div>
                    </>
                  )
                } else {
                  return (
                    <>
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
                    </>
                  )
                }
              })()}
            </div>

            {/* Payment Method Specific Reports */}
            {(reportType === ReportType.CASH || reportType === ReportType.CARD || reportType === ReportType.DIGITAL || reportType === ReportType.CREDIT) && (
              <div className="space-y-6">
                {/* Payment Method Summary */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900">
                      {reportType === ReportType.CASH ? 'Cash Sales' : reportType === ReportType.CARD ? 'Card Sales' : reportType === ReportType.DIGITAL ? 'Digital Sales' : 'Credit Sales'} Summary
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
                        <tr>
                          <th className="px-4 py-3">Receipt #</th>
                          <th className="px-4 py-3">Date/Time</th>
                          {hasMultiOrgAccess && selectedOrgs.length > 0 && <th className="px-4 py-3">Organization</th>}
                          <th className="px-4 py-3">Cashier</th>
                          <th className="px-4 py-3">Payment Method</th>
                          <th className="px-4 py-3 text-right">Items</th>
                          <th className="px-4 py-3 text-right">Gross</th>
                          <th className="px-4 py-3 text-right">Discount</th>
                          <th className="px-4 py-3 text-right">Net</th>
                          <th className="px-4 py-3 text-right">Amount</th>
                          {reportType === ReportType.CREDIT && <th className="px-4 py-3">Customer</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {(() => {
                          try {
                            const filteredReports = filterReportsByPaymentMethod(reports, reportType)
                            return filteredReports.map((bill, idx) => {
                              try {
                                const trueGross = bill.cart ? bill.cart.reduce((sum, item) => {
                                  if (!item || !item.price || !item.qty) return sum
                                  return sum + (item.price * item.qty)
                                }, 0) : 0
                                
                                let itemDiscounts = 0
                                if (bill.cart && Array.isArray(bill.cart)) {
                                  itemDiscounts = bill.cart.reduce((sum, item) => {
                                    if (!item || !item.price || !item.qty) return sum
                                    const lineTotal = item.price * item.qty
                                    let itemDiscount = 0
                                    try {
                                      if (item.cartDiscount != null && item.cartDiscount !== '') {
                                        const val = parseFloat(item.cartDiscount) || 0
                                        itemDiscount = Math.min(Math.max(val, 0), lineTotal)
                                      } else if (item.discount?.enabled) {
                                        if (item.discount.type === DiscountType.PERCENTAGE) {
                                          itemDiscount = lineTotal * (item.discount.value / 100)
                                        } else {
                                          itemDiscount = Math.min(item.discount.value * item.qty, lineTotal)
                                        }
                                      }
                                    } catch (discountError) {
                                      console.warn('Error calculating item discount in payment report:', discountError)
                                    }
                                    return sum + itemDiscount
                                  }, 0)
                                }
                                
                                const globalDiscount = bill.discountAmount || 0
                                const totalDiscounts = itemDiscounts + globalDiscount
                                const netSales = trueGross - totalDiscounts
                                
                                let paymentAmount = bill.total || 0
                                if (reportType === ReportType.CASH && bill.paymentMethod === PaymentMethod.SPLIT) {
                                  paymentAmount = bill.paymentDetails?.cashAmount || 0
                                } else if (reportType === ReportType.CARD && bill.paymentMethod === PaymentMethod.SPLIT) {
                                  paymentAmount = bill.paymentDetails?.cardAmount || 0
                                }
                                
                                return (
                                  <tr key={idx} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">{bill.receiptNo}</td>
                                    <td className="px-4 py-3">
                                      {new Date(bill.createdAt).toLocaleDateString()} {new Date(bill.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    {hasMultiOrgAccess && selectedOrgs.length > 0 && (
                                      <td className="px-4 py-3">{bill.orgName || organizations.find(o => o.id === bill.orgId)?.name || 'Unknown Organization'}</td>
                                    )}
                                    <td className="px-4 py-3">{bill.cashierName}</td>
                                    <td className="px-4 py-3">
                                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                        bill.paymentMethod === ReportType.CASH ? 'bg-green-100 text-green-800' :
                                        bill.paymentMethod === ReportType.CARD ? 'bg-blue-100 text-blue-800' :
                                        bill.paymentMethod === ReportType.DIGITAL ? 'bg-indigo-100 text-indigo-800' :
                                        bill.paymentMethod === ReportType.CREDIT ? 'bg-purple-100 text-purple-800' :
                                        'bg-gray-100 text-gray-800'
                                      }`}>
                                        {bill.paymentMethod === ReportType.CASH ? 'Cash' :
                                         bill.paymentMethod === ReportType.CARD ? 'Card' :
                                         bill.paymentMethod === ReportType.DIGITAL ? 'Digital' :
                                         bill.paymentMethod === ReportType.CREDIT ? 'Credit' :
                                         bill.paymentMethod === PaymentMethod.SPLIT ? 'Split' : 'Unknown'}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">{bill.itemCount}</td>
                                    <td className="px-4 py-3 text-right">{formatCurrency(trueGross)}</td>
                                    <td className="px-4 py-3 text-right text-rose-600">{formatCurrency(totalDiscounts)}</td>
                                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(netSales)}</td>
                                    <td className="px-4 py-3 text-right font-bold">{formatCurrency(paymentAmount)}</td>
                                    {reportType === ReportType.CREDIT && (
                                      <td className="px-4 py-3">
                                        {bill.customer ? (
                                          <div>
                                            <div className="font-medium">{bill.customer.name}</div>
                                            <div className="text-xs text-gray-500">{bill.customer.phone || '-'}</div>
                                          </div>
                                        ) : (
                                          <span className="text-gray-400">No customer</span>
                                        )}
                                      </td>
                                    )}
                                  </tr>
                                )
                              } catch (reportError) {
                                console.error('Error rendering payment report:', reportError)
                                return (
                                  <tr key={idx} className="hover:bg-gray-50">
                                    <td colSpan={hasMultiOrgAccess && selectedOrgs.length > 0 ? (reportType === ReportType.CREDIT ? 10 : 9) : (reportType === ReportType.CREDIT ? 9 : 8)} className="px-4 py-3 text-center">
                                      Error rendering report
                                    </td>
                                  </tr>
                                )
                              }
                            })
                          } catch (filterError) {
                            console.error('Error filtering reports:', filterError)
                            return (
                              <tr className="hover:bg-gray-50">
                                <td colSpan={hasMultiOrgAccess && selectedOrgs.length > 0 ? (reportType === ReportType.CREDIT ? 10 : 9) : (reportType === ReportType.CREDIT ? 9 : 8)} className="px-4 py-3 text-center">
                                  Error filtering reports
                                </td>
                              </tr>
                            )
                          }
                        })()}
                      </tbody>
                      <tfoot>
                        <tr style={{backgroundColor: '#f5f5f5', fontWeight: 'bold', borderTop: '2px solid #333'}}>
                          <td colSpan={hasMultiOrgAccess && selectedOrgs.length > 0 ? (reportType === ReportType.CREDIT ? '6' : '5') : (reportType === ReportType.CREDIT ? '5' : '4')} style={{textAlign: 'right', padding: '8px'}}>
                            TOTALS
                          </td>
                          <td style={{textAlign: 'right', padding: '8px'}}>
                            {filterReportsByPaymentMethod(reports, reportType).reduce((sum, bill) => sum + (bill.itemCount || 0), 0)}
                          </td>
                          <td style={{textAlign: 'right', padding: '8px'}}>
                            {formatCurrency(filterReportsByPaymentMethod(reports, reportType).reduce((sum, bill) => {
                              return sum + (bill.cart ? bill.cart.reduce((itemSum, item) => itemSum + (item.price * item.qty), 0) : 0)
                            }, 0))}
                          </td>
                          <td style={{textAlign: 'right', padding: '8px', color: '#dc2626'}}>
                            {formatCurrency(filterReportsByPaymentMethod(reports, reportType).reduce((sum, bill) => {
                              let itemDiscounts = 0
                              if (bill.cart) {
                                itemDiscounts = bill.cart.reduce((discSum, item) => {
                                  const lineTotal = item.price * item.qty
                                  let itemDiscount = 0
                                  if (item.cartDiscount != null && item.cartDiscount !== '') {
                                    const val = parseFloat(item.cartDiscount) || 0
                                    itemDiscount = Math.min(Math.max(val, 0), lineTotal)
                                  } else if (item.discount?.enabled) {
                                    if (item.discount.type === DiscountType.PERCENTAGE) {
                                      itemDiscount = lineTotal * (item.discount.value / 100)
                                    } else {
                                      itemDiscount = Math.min(item.discount.value * item.qty, lineTotal)
                                    }
                                  }
                                  return discSum + itemDiscount
                                }, 0)
                              }
                              const globalDiscount = bill.discountAmount || 0
                              return sum + itemDiscounts + globalDiscount
                            }, 0))}
                          </td>
                          <td style={{textAlign: 'right', padding: '8px', color: '#059669'}}>
                            {formatCurrency(filterReportsByPaymentMethod(reports, reportType).reduce((sum, bill) => {
                              const trueGross = bill.cart ? bill.cart.reduce((itemSum, item) => itemSum + (item.price * item.qty), 0) : 0
                              let itemDiscounts = 0
                              if (bill.cart) {
                                itemDiscounts = bill.cart.reduce((discSum, item) => {
                                  const lineTotal = item.price * item.qty
                                  let itemDiscount = 0
                                  if (item.cartDiscount != null && item.cartDiscount !== '') {
                                    const val = parseFloat(item.cartDiscount) || 0
                                    itemDiscount = Math.min(Math.max(val, 0), lineTotal)
                                  } else if (item.discount?.enabled) {
                                    if (item.discount.type === DiscountType.PERCENTAGE) {
                                      itemDiscount = lineTotal * (item.discount.value / 100)
                                    } else {
                                      itemDiscount = Math.min(item.discount.value * item.qty, lineTotal)
                                    }
                                  }
                                  return discSum + itemDiscount
                                }, 0)
                              }
                              const globalDiscount = bill.discountAmount || 0
                              const netSales = trueGross - itemDiscounts - globalDiscount
                              return sum + netSales
                            }, 0))}
                          </td>
                          <td style={{textAlign: 'right', padding: '8px', color: '#059669', fontWeight: 'bold'}}>
                            {formatCurrency(filterReportsByPaymentMethod(reports, reportType).reduce((sum, bill) => {
                              if (reportType === ReportType.CASH && bill.paymentMethod === PaymentMethod.SPLIT) {
                                return sum + (bill.paymentDetails?.cashAmount || 0)
                              } else if (reportType === ReportType.CARD && bill.paymentMethod === PaymentMethod.SPLIT) {
                                return sum + (bill.paymentDetails?.cardAmount || 0)
                              }
                              return sum + (bill.total || 0)
                            }, 0))}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Split Payment Details (for cash and card reports) */}
                {(reportType === ReportType.CASH || reportType === ReportType.CARD) && filterReportsByPaymentMethod(reports, reportType).some(bill => bill.paymentMethod === PaymentMethod.SPLIT) && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="font-semibold text-gray-900">Split Payment Details</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
                          <tr>
                            <th className="px-4 py-3">Receipt #</th>
                            <th className="px-4 py-3">Date</th>
                            <th className="px-4 py-3">Cashier</th>
                            <th className="px-4 py-3 text-right">Cash Amount</th>
                            <th className="px-4 py-3 text-right">Card Amount</th>
                            <th className="px-4 py-3 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {filterReportsByPaymentMethod(reports, reportType)
                            .filter(bill => bill.paymentMethod === PaymentMethod.SPLIT)
                            .map((bill, idx) => (
                              <tr key={idx} className="hover:bg-gray-50">
                                <td className="px-4 py-3">{bill.receiptNo}</td>
                                <td className="px-4 py-3">{new Date(bill.createdAt).toLocaleDateString()}</td>
                                <td className="px-4 py-3">{bill.cashierName}</td>
                                <td className="px-4 py-3 text-right">{formatCurrency(bill.paymentDetails?.cashAmount || 0)}</td>
                                <td className="px-4 py-3 text-right">{formatCurrency(bill.paymentDetails?.cardAmount || 0)}</td>
                                <td className="px-4 py-3 text-right font-bold">{formatCurrency(bill.total || 0)}</td>
                              </tr>
                            ))}
                        </tbody>
                        <tfoot>
                          <tr style={{backgroundColor: '#f5f5f5', fontWeight: 'bold', borderTop: '2px solid #333'}}>
                            <td colSpan="3" style={{textAlign: 'right', padding: '8px'}}>TOTALS</td>
                            <td style={{textAlign: 'right', padding: '8px'}}>
                              {formatCurrency(filterReportsByPaymentMethod(reports, reportType)
                                .filter(bill => bill.paymentMethod === PaymentMethod.SPLIT)
                                .reduce((sum, bill) => sum + (bill.paymentDetails?.cashAmount || 0), 0))}
                            </td>
                            <td style={{textAlign: 'right', padding: '8px'}}>
                              {formatCurrency(filterReportsByPaymentMethod(reports, reportType)
                                .filter(bill => bill.paymentMethod === PaymentMethod.SPLIT)
                                .reduce((sum, bill) => sum + (bill.paymentDetails?.cardAmount || 0), 0))}
                            </td>
                            <td style={{textAlign: 'right', padding: '8px'}}>
                              {formatCurrency(filterReportsByPaymentMethod(reports, reportType)
                                .filter(bill => bill.paymentMethod === PaymentMethod.SPLIT)
                                .reduce((sum, bill) => sum + (bill.total || 0), 0))}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Detailed Report */}
            {reportType === ReportType.DETAILED && (
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

                {/* Payment Method Breakdown */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900">Payment Method Breakdown</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
                        <tr>
                          <th className="px-4 py-3">Payment Method</th>
                          <th className="px-4 py-3 text-right">Transactions</th>
                          <th className="px-4 py-3 text-right">Amount</th>
                          <th className="px-4 py-3 text-right">Percentage</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {(() => {
                          const paymentBreakdown = reports.reduce((acc, bill) => {
                            const method = bill.paymentMethod || 'unknown'
                            if (!acc[method]) {
                              acc[method] = { count: 0, amount: 0 }
                            }
                            acc[method].count += 1
                            acc[method].amount += bill.total || 0
                            return acc
                          }, {})

                          const totalAmount = Object.values(paymentBreakdown).reduce((sum, p) => sum + p.amount, 0)

                          return Object.entries(paymentBreakdown)
                            .sort(([,a], [,b]) => b.amount - a.amount)
                            .map(([method, data]) => (
                              <tr key={method} className="hover:bg-gray-50">
                                <td className="px-4 py-3">
                                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                    method === ReportType.CASH ? 'bg-green-100 text-green-800' :
                                    method === ReportType.CARD ? 'bg-blue-100 text-blue-800' :
                                    method === ReportType.DIGITAL ? 'bg-indigo-100 text-indigo-800' :
                                    method === ReportType.CREDIT ? 'bg-purple-100 text-purple-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {method === ReportType.CASH ? 'Cash' :
                                     method === ReportType.CARD ? 'Card' :
                                     method === ReportType.DIGITAL ? 'Digital' :
                                     method === ReportType.CREDIT ? 'Credit' :
                                     method === PaymentMethod.SPLIT ? 'Split' : 'Unknown'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-right">{data.count}</td>
                                <td className="px-4 py-3 text-right font-medium">{formatCurrency(data.amount)}</td>
                                <td className="px-4 py-3 text-right">
                                  {totalAmount > 0 ? `${((data.amount / totalAmount) * 100).toFixed(1)}%` : '0%'}
                                </td>
                              </tr>
                            ))
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Credit Sales Summary (if any credit sales exist) */}
                {reports.some(bill => bill.paymentMethod === ReportType.CREDIT) && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="font-semibold text-gray-900">Credit Sales Summary</h3>
                    </div>
                    <div className="p-4 space-y-4">
                      {(() => {
                        const creditSales = reports.filter(bill => bill.paymentMethod === ReportType.CREDIT)
                        const creditCustomers = creditSales.reduce((acc, bill) => {
                          if (bill.customer && bill.customer.id) {
                            if (!acc[bill.customer.id]) {
                              acc[bill.customer.id] = {
                                name: bill.customer.name,
                                phone: bill.customer.phone,
                                count: 0,
                                amount: 0
                              }
                            }
                            acc[bill.customer.id].count += 1
                            acc[bill.customer.id].amount += bill.total || 0
                          }
                          return acc
                        }, {})

                        return (
                          <>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="bg-purple-50 rounded-lg p-3">
                                <p className="text-xs text-purple-600 uppercase">Credit Transactions</p>
                                <p className="text-xl font-bold text-purple-900">{creditSales.length}</p>
                              </div>
                              <div className="bg-purple-50 rounded-lg p-3">
                                <p className="text-xs text-purple-600 uppercase">Credit Amount</p>
                                <p className="text-xl font-bold text-purple-900">
                                  {formatCurrency(creditSales.reduce((sum, bill) => sum + (bill.total || 0), 0))}
                                </p>
                              </div>
                              <div className="bg-purple-50 rounded-lg p-3">
                                <p className="text-xs text-purple-600 uppercase">Unique Customers</p>
                                <p className="text-xl font-bold text-purple-900">{Object.keys(creditCustomers).length}</p>
                              </div>
                            </div>
                            
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
                                  <tr>
                                    <th className="px-4 py-3">Customer</th>
                                    <th className="px-4 py-3">Phone</th>
                                    <th className="px-4 py-3 text-right">Transactions</th>
                                    <th className="px-4 py-3 text-right">Total Credit</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                  {Object.values(creditCustomers)
                                    .sort((a, b) => b.amount - a.amount)
                                    .map((customer, idx) => (
                                      <tr key={idx} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-medium">{customer.name}</td>
                                        <td className="px-4 py-3 text-sm text-gray-500">{customer.phone || '-'}</td>
                                        <td className="px-4 py-3 text-right">{customer.count}</td>
                                        <td className="px-4 py-3 text-right font-medium text-purple-600">
                                          {formatCurrency(customer.amount)}
                                        </td>
                                      </tr>
                                    ))}
                                </tbody>
                              </table>
                            </div>
                          </>
                        )
                      })()}
                    </div>
                  </div>
                )}

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
                          {hasMultiOrgAccess && selectedOrgs.length > 0 && (
                            <th className="px-4 py-3">Organization</th>
                          )}
                          <th className="px-4 py-3">Cashier</th>
                          <th className="px-4 py-3 text-right">Items</th>
                          <th className="px-4 py-3 text-right">Gross</th>
                          <th className="px-4 py-3 text-right">Discount</th>
                          <th className="px-4 py-3">Payment</th>
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
                            {hasMultiOrgAccess && selectedOrgs.length > 0 && (
                              <td className="px-4 py-3 text-sm">
                                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                  {bill.orgName || organizations.find(o => o.id === bill.orgId)?.name || 'Unknown Organization'}
                                </span>
                              </td>
                            )}
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
                                      if (item.discount.type === DiscountType.PERCENTAGE) {
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
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                bill.paymentMethod === ReportType.CASH ? 'bg-green-100 text-green-800' :
                                bill.paymentMethod === ReportType.CARD ? 'bg-blue-100 text-blue-800' :
                                bill.paymentMethod === ReportType.DIGITAL ? 'bg-orange-100 text-orange-800' :
                                bill.paymentMethod === ReportType.CREDIT ? 'bg-purple-100 text-purple-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {bill.paymentMethod === ReportType.CASH ? 'Cash' :
                                 bill.paymentMethod === ReportType.CARD ? 'Card' :
                                 bill.paymentMethod === ReportType.DIGITAL ? 'Digital' :
                                 bill.paymentMethod === ReportType.CREDIT ? 'Credit' :
                                 bill.paymentMethod === PaymentMethod.SPLIT ? 'Split' : 'Unknown'}
                              </span>
                              {bill.customer && (
                                <div className="text-xs text-gray-500 mt-1 truncate">
                                  {bill.customer.name}
                                </div>
                              )}
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
                                      if (item.discount.type === DiscountType.PERCENTAGE) {
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
                      <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                        <tr className="font-bold">
                          <td colSpan={hasMultiOrgAccess && selectedOrgs.length > 0 ? "4" : "3"} className="px-4 py-3 text-right">
                            TOTALS
                          </td>
                          <td className="px-4 py-3 text-right">
                            {reports.reduce((sum, bill) => sum + (bill.itemCount || 0), 0)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {formatCurrency(reports.reduce((sum, bill) => {
                              return sum + (bill.cart ? bill.cart.reduce((itemSum, item) => itemSum + (item.price * item.qty), 0) : 0)
                            }, 0))}
                          </td>
                          <td className="px-4 py-3 text-right text-rose-600">
                            {formatCurrency(reports.reduce((sum, bill) => {
                              let itemDiscounts = 0
                              if (bill.cart) {
                                itemDiscounts = bill.cart.reduce((discSum, item) => {
                                  const lineTotal = item.price * item.qty
                                  let itemDiscount = 0
                                  if (item.cartDiscount != null && item.cartDiscount !== '') {
                                    const val = parseFloat(item.cartDiscount) || 0
                                    itemDiscount = Math.min(Math.max(val, 0), lineTotal)
                                  } else if (item.discount?.enabled) {
                                    if (item.discount.type === DiscountType.PERCENTAGE) {
                                      itemDiscount = lineTotal * (item.discount.value / 100)
                                    } else {
                                      itemDiscount = Math.min(item.discount.value * item.qty, lineTotal)
                                    }
                                  }
                                  return discSum + itemDiscount
                                }, 0)
                              }
                              const globalDiscount = bill.discountAmount || 0
                              return sum + itemDiscounts + globalDiscount
                            }, 0))}
                          </td>
                          <td></td>
                          <td className="px-4 py-3 text-right font-medium text-emerald-600">
                            {formatCurrency(reports.reduce((sum, bill) => {
                              const trueGross = bill.cart ? bill.cart.reduce((itemSum, item) => itemSum + (item.price * item.qty), 0) : 0
                              let itemDiscounts = 0
                              if (bill.cart) {
                                itemDiscounts = bill.cart.reduce((discSum, item) => {
                                  const lineTotal = item.price * item.qty
                                  let itemDiscount = 0
                                  if (item.cartDiscount != null && item.cartDiscount !== '') {
                                    const val = parseFloat(item.cartDiscount) || 0
                                    itemDiscount = Math.min(Math.max(val, 0), lineTotal)
                                  } else if (item.discount?.enabled) {
                                    if (item.discount.type === DiscountType.PERCENTAGE) {
                                      itemDiscount = lineTotal * (item.discount.value / 100)
                                    } else {
                                      itemDiscount = Math.min(item.discount.value * item.qty, lineTotal)
                                    }
                                  }
                                  return discSum + itemDiscount
                                }, 0)
                              }
                              const globalDiscount = bill.discountAmount || 0
                              const netSales = trueGross - itemDiscounts - globalDiscount
                              return sum + netSales
                            }, 0))}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Daily Breakdown for Summary */}
            {reportType === ReportType.SUMMARY && dailyBreakdown.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">Daily Breakdown</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
                      <tr>
                        <th className="px-4 py-3">Date</th>
                        {hasMultiOrgAccess && selectedOrgs.length > 0 && (
                          <th className="px-4 py-3">Organization</th>
                        )}
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
                          {hasMultiOrgAccess && selectedOrgs.length > 0 && (
                            <td className="px-4 py-3">
                              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                {day.orgName || 'Unknown Organization'}
                              </span>
                            </td>
                          )}
                          <td className="px-4 py-3 text-right">{day.transactionCount}</td>
                          <td className="px-4 py-3 text-right">{formatCurrency(day.grossSales)}</td>
                          <td className="px-4 py-3 text-right text-rose-600">{formatCurrency(day.totalDiscounts)}</td>
                          <td className="px-4 py-3 text-right font-medium">{formatCurrency(day.netSales)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                      <tr className="font-bold">
                        <td colSpan={hasMultiOrgAccess && selectedOrgs.length > 0 ? "2" : "1"} className="px-4 py-3 text-right">
                          TOTALS
                        </td>
                        <td className="px-4 py-3 text-right">
                          {dailyBreakdown.reduce((sum, day) => sum + day.transactionCount, 0)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {formatCurrency(dailyBreakdown.reduce((sum, day) => sum + day.grossSales, 0))}
                        </td>
                        <td className="px-4 py-3 text-right text-rose-600">
                          {formatCurrency(dailyBreakdown.reduce((sum, day) => sum + day.totalDiscounts, 0))}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-emerald-600">
                          {formatCurrency(dailyBreakdown.reduce((sum, day) => sum + day.netSales, 0))}
                        </td>
                      </tr>
                    </tfoot>
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