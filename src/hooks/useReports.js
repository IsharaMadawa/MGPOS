import { useState, useEffect } from 'react'
import { collection, query, where, getDocs, orderBy, startAt, endAt, addDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { useOrg } from '../contexts/OrgContext'

// Date helper functions
export function getDateRange(period, customStart = null, customEnd = null) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  let start, end
  
  switch (period) {
    case 'today':
      start = today
      end = new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
      break
      
    case 'week':
      // Start of current week (Sunday)
      const dayOfWeek = today.getDay()
      start = new Date(today)
      start.setDate(today.getDate() - dayOfWeek)
      end = new Date(start)
      end.setDate(start.getDate() + 6)
      end.setHours(23, 59, 59, 999)
      break
      
    case 'month':
      start = new Date(today.getFullYear(), today.getMonth(), 1)
      end = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999)
      break
      
    case 'year':
      start = new Date(today.getFullYear(), 0, 1)
      end = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999)
      break
      
    case 'custom':
      start = customStart ? new Date(customStart) : today
      end = customEnd ? new Date(customEnd) : new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
      break
      
    default:
      start = today
      end = new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
  }
  
  return { start, end }
}

export function useReports() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { userProfile, isSuperAdmin } = useAuth()
  const { selectedOrgId } = useOrg()

  // Determine which orgId to use
  const orgId = isSuperAdmin ? selectedOrgId : userProfile?.orgId

  // Fetch reports for a single organization
  const fetchOrgReports = async (organizationId, period, customStart, customEnd) => {
    if (!organizationId) return []
    
    const { start, end } = getDateRange(period, customStart, customEnd)
    
    try {
      const logsRef = collection(db, 'organizations', organizationId, 'billing_logs')
      const q = query(
        logsRef,
        where('createdAt', '>=', start.toISOString()),
        where('createdAt', '<=', end.toISOString()),
        orderBy('createdAt', 'desc')
      )
      
      const snapshot = await getDocs(q)
      return snapshot.docs.map(doc => ({
        id: doc.id,
        orgId: organizationId,
        ...doc.data()
      }))
    } catch (err) {
      console.error(`Error fetching reports for org ${organizationId}:`, err)
      return []
    }
  }

  // Generate report for single org or multiple orgs
  const generateReport = async (period, customStart, customEnd, selectedOrgs = null) => {
    setLoading(true)
    setError(null)
    
    try {
      let orgsToQuery = []
      
      if (isSuperAdmin) {
        // Super admin: use selected orgs or current selected org
        if (selectedOrgs && selectedOrgs.length > 0) {
          orgsToQuery = selectedOrgs
        } else if (selectedOrgId) {
          orgsToQuery = [selectedOrgId]
        } else {
          setError('Please select an organization')
          setLoading(false)
          return null
        }
      } else {
        // Regular org admin: only their org
        if (!orgId) {
          setError('No organization assigned')
          setLoading(false)
          return null
        }
        orgsToQuery = [orgId]
      }

      // Fetch from all selected organizations
      const allLogs = await Promise.all(
        orgsToQuery.map(org => fetchOrgReports(org, period, customStart, customEnd))
      )
      
      // Flatten and sort by date
      const combinedLogs = allLogs
        .flat()
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      
      setReports(combinedLogs)
      setLoading(false)
      return combinedLogs
    } catch (err) {
      console.error('Error generating report:', err)
      setError(err.message)
      setLoading(false)
      return null
    }
  }

  // Calculate summary from reports
  const calculateSummary = (logs) => {
    if (!logs || logs.length === 0) {
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

    let grossSales = 0
    let totalDiscounts = 0
    let netSales = 0
    let totalTax = 0
    let itemCount = 0

    logs.forEach(log => {
      grossSales += log.subtotal || 0
      totalDiscounts += log.discountAmount || 0
      netSales += log.total || 0
      totalTax += log.taxAmount || 0
      itemCount += log.itemCount || 0
    })

    return {
      totalSales: grossSales,
      grossSales,
      totalDiscounts,
      netSales,
      totalTax,
      transactionCount: logs.length,
      itemCount,
    }
  }

  // Get cashier-wise breakdown
  const getCashierBreakdown = (logs) => {
    const cashierMap = new Map()
    
    logs.forEach(log => {
      const cashier = log.cashierName || 'Unknown'
      if (!cashierMap.has(cashier)) {
        cashierMap.set(cashier, {
          cashierName: cashier,
          transactionCount: 0,
          totalSales: 0,
          grossSales: 0,
          totalDiscounts: 0,
          netSales: 0,
        })
      }
      
      const data = cashierMap.get(cashier)
      data.transactionCount += 1
      data.totalSales += log.subtotal || 0
      data.grossSales += log.subtotal || 0
      data.totalDiscounts += log.discountAmount || 0
      data.netSales += log.total || 0
    })

    return Array.from(cashierMap.values()).sort((a, b) => b.netSales - a.netSales)
  }

  // Get daily breakdown
  const getDailyBreakdown = (logs) => {
    const dailyMap = new Map()
    
    logs.forEach(log => {
      const date = new Date(log.createdAt).toISOString().split('T')[0]
      if (!dailyMap.has(date)) {
        dailyMap.set(date, {
          date,
          transactionCount: 0,
          grossSales: 0,
          totalDiscounts: 0,
          netSales: 0,
        })
      }
      
      const data = dailyMap.get(date)
      data.transactionCount += 1
      data.grossSales += log.subtotal || 0
      data.totalDiscounts += log.discountAmount || 0
      data.netSales += log.total || 0
    })

    return Array.from(dailyMap.values()).sort((a, b) => b.date.localeCompare(a.date))
  }

  return {
    reports,
    loading,
    error,
    generateReport,
    calculateSummary,
    getCashierBreakdown,
    getDailyBreakdown,
    orgId,
  }
}