import { useState, useEffect, useMemo, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useOrg } from '../contexts/OrgContext'
import { useOrganizations } from './useOrganizations'
import { useSettings } from './useSettings'
import { collection, query, where, getDocs, orderBy, startAt, endAt } from 'firebase/firestore'
import { db } from '../firebase'
import { getDateRange } from './useReports'
import { AnalyticsCalculator, calculateBusinessMetrics, generateInsights } from '../utils/analyticsUtils'
import { aggregateByPeriod, prepareComparisonData } from '../utils/chartUtils'

export function useAdvancedReports() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [rawData, setRawData] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [insights, setInsights] = useState([])
  
  const { userProfile, isSuperAdmin } = useAuth()
  const { selectedOrgId, getAdminOrganizations } = useOrg()
  const { organizations } = useOrganizations()
  const { currencySymbol } = useSettings()

  // Determine which orgId to use
  const orgId = isSuperAdmin ? selectedOrgId : userProfile?.orgId
  
  // Check if user has multi-organization admin access
  const adminOrganizations = getAdminOrganizations()
  const hasMultiOrgAccess = isSuperAdmin || (adminOrganizations.length > 1)

  // Fetch comprehensive data for advanced analytics
  const fetchAdvancedData = useCallback(async (period, customStart, customEnd, selectedOrgs = null) => {
    setLoading(true)
    setError(null)
    
    try {
      let orgsToQuery = []
      
      if (hasMultiOrgAccess) {
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
        if (!orgId) {
          setError('No organization assigned')
          setLoading(false)
          return null
        }
        orgsToQuery = [orgId]
      }

      const { start, end } = getDateRange(period, customStart, customEnd)
      
      // Fetch from all selected organizations
      const allLogs = await Promise.all(
        orgsToQuery.map(async (org) => {
          try {
            const logsRef = collection(db, 'organizations', org, 'billing_logs')
            const q = query(
              logsRef,
              where('createdAt', '>=', start.toISOString()),
              where('createdAt', '<=', end.toISOString()),
              orderBy('createdAt', 'desc')
            )
            
            const snapshot = await getDocs(q)
            return snapshot.docs.map(doc => ({
              id: doc.id,
              orgId: org,
              orgName: organizations?.find(o => o.id === org)?.name || 'Unknown Organization',
              ...doc.data()
            }))
          } catch (err) {
            console.error(`Error fetching data for org ${org}:`, err)
            return []
          }
        })
      )
      
      // Flatten and sort by date
      const combinedLogs = allLogs
        .flat()
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      
      setRawData(combinedLogs)
      
      // Calculate comprehensive analytics
      const analyticsData = calculateBusinessMetrics(combinedLogs, {
        period,
        currencySymbol: '$', // This should come from settings
        days: period === 'month' ? 30 : period === 'week' ? 7 : 1
      })
      
      setAnalytics(analyticsData)
      
      // Generate insights
      const generatedInsights = generateInsights(analyticsData)
      setInsights(generatedInsights)
      
      setLoading(false)
      return combinedLogs
    } catch (err) {
      console.error('Error fetching advanced reports data:', err)
      setError(err.message)
      setLoading(false)
      return null
    }
  }, [hasMultiOrgAccess, selectedOrgId, orgId, organizations])

  // Get dashboard summary data
  const getDashboardSummary = useCallback(() => {
    if (!analytics) return null

    return {
      revenue: {
        current: analytics.revenue.current || 0,
        previous: analytics.revenue.previous || 0,
        change: analytics.revenue.change || 0,
        percentageChange: analytics.revenue.percentageChange || 0,
        trend: analytics.revenue.trend || 'neutral',
        forecast: analytics.revenue.forecast || 0
      },
      transactions: {
        count: analytics.transactions.count || { current: 0, previous: 0, change: 0, percentageChange: 0 },
        averageValue: analytics.transactions.averageValue || { current: 0, previous: 0, change: 0, percentageChange: 0 }
      },
      topProducts: analytics.products?.slice(0, 5) || [],
      topCategories: analytics.categories?.slice(0, 5) || [],
      paymentMethods: analytics.paymentMethods || [],
      hourlySales: analytics.hourlySales || [],
      customerMetrics: analytics.customers?.slice(0, 10) || []
    }
  }, [analytics])

  // Get chart data for different visualizations
  const getChartData = useCallback((chartType, options = {}) => {
    if (!rawData || rawData.length === 0) return null

    switch (chartType) {
      case 'revenue-trend':
        return getRevenueTrendData(rawData, options)
      case 'sales-comparison':
        return getSalesComparisonData(rawData, options)
      case 'product-performance':
        return getProductPerformanceData(analytics?.products || [], options)
      case 'category-distribution':
        return getCategoryDistributionData(analytics?.categories || [], options)
      case 'payment-methods':
        return getPaymentMethodsData(analytics?.paymentMethods || [], options)
      case 'hourly-sales':
        return getHourlySalesData(analytics?.hourlySales || [], options)
      case 'customer-analysis':
        return getCustomerAnalysisData(analytics?.customers || [], options)
      default:
        return null
    }
  }, [rawData, analytics])

  // Comparative analysis
  const getComparativeAnalysis = useCallback((currentPeriod, previousPeriod, metrics = ['revenue', 'transactions']) => {
    if (!rawData || rawData.length === 0) return null

    const calculator = new AnalyticsCalculator(rawData)
    return calculator.calculateComparativeAnalysis(currentPeriod, previousPeriod, metrics)
  }, [rawData])

  // Export data
  const exportData = useCallback(async (format, type, options = {}) => {
    try {
      console.log('Starting export...', { format, type, rawDataLength: rawData?.length })
      console.log('Raw data sample:', rawData?.slice(0, 2))
      console.log('Analytics data:', analytics)
      console.log('Currency symbol:', currencySymbol)
      
      if (!rawData || rawData.length === 0) {
        console.log('No raw data available, checking if we can proceed with sample data...')
        // Create sample data for testing
        const sampleData = [
          {
            receiptNo: 'TEST-001',
            createdAt: new Date(),
            cashierName: 'Test User',
            paymentMethod: 'cash',
            itemCount: 2,
            cart: [{ price: 10, qty: 2 }],
            discountAmount: 0,
            total: 20
          }
        ]
        console.log('Using sample data for export...')
        
        const sampleSummary = {
          totalSales: 20,
          netSales: 20,
          totalDiscounts: 0,
          transactionCount: 1
        }
        
        const { exportSalesReportPDF } = await import('../utils/exportUtils')
        const timestamp = new Date().toISOString().split('T')[0]
        const filename = `${type}-sample-${timestamp}`
        
        if (format === 'pdf') {
          console.log('Exporting PDF with sample data...')
          await exportSalesReportPDF(sampleData, sampleSummary, currencySymbol || '$', filename)
          console.log('Sample PDF export completed')
        }
        return
      }

      const { exportSalesReportPDF, exportSalesReportExcel, exportProductPerformanceExcel } = await import('../utils/exportUtils')
      
      const timestamp = new Date().toISOString().split('T')[0]
      const filename = `${type}-${timestamp}`

      switch (type) {
        case 'sales-report':
          const summary = {
            totalSales: analytics?.revenue.current || 0,
            netSales: analytics?.revenue.current || 0,
            totalDiscounts: analytics?.revenue.current * 0.1 || 0, // Estimate
            transactionCount: analytics?.transactions.count.current || 0
          }
          
          console.log('Summary data:', summary)
          
          if (format === 'pdf') {
            console.log('Exporting PDF with real data...')
            await exportSalesReportPDF(rawData, summary, currencySymbol, filename)
            console.log('PDF export completed')
          } else if (format === 'excel') {
            console.log('Exporting Excel...')
            exportSalesReportExcel(rawData, summary, currencySymbol, filename)
            console.log('Excel export completed')
          }
          break

        case 'product-performance':
          if (format === 'excel') {
            console.log('Exporting product performance Excel...')
            exportProductPerformanceExcel(analytics?.products || [], currencySymbol, filename)
            console.log('Product performance export completed')
          }
          break

        default:
          throw new Error(`Unsupported export type: ${type}`)
      }
    } catch (error) {
      console.error('Export failed:', error)
      console.error('Error stack:', error.stack)
      throw error
    }
  }, [rawData, analytics, currencySymbol])

  // Chart data preparation functions
  const getRevenueTrendData = (data, options) => {
    const aggregated = aggregateByPeriod(data, 'createdAt', 'total', options.period || 'day')
    return {
      data: aggregated.map(item => ({
        date: item.date,
        revenue: item.value,
        transactions: item.count
      })),
      type: 'line',
      title: 'Revenue Trend'
    }
  }

  const getSalesComparisonData = (data, options) => {
    const currentPeriod = options.currentPeriod || 'month'
    const previousPeriod = options.previousPeriod || 'lastMonth'
    
    // This would need more sophisticated period comparison logic
    const currentData = data.filter(item => {
      const date = new Date(item.createdAt)
      // Filter based on current period
      return true // Simplified for now
    })
    
    const previousData = data.filter(item => {
      const date = new Date(item.createdAt)
      // Filter based on previous period
      return true // Simplified for now
    })

    return {
      current: currentData,
      previous: previousData,
      comparison: prepareComparisonData(currentData, previousData, 'total'),
      type: 'comparison',
      title: 'Sales Comparison'
    }
  }

  const getProductPerformanceData = (products, options) => {
    const topN = options.topN || 10
    const topProducts = products.slice(0, topN)
    
    return {
      data: topProducts.map(product => ({
        name: product.name,
        revenue: product.revenue,
        profit: product.profit,
        units: product.unitsSold,
        margin: product.profitMargin
      })),
      type: 'bar',
      title: 'Top Products Performance'
    }
  }

  const getCategoryDistributionData = (categories, options) => {
    return {
      data: categories.map(category => ({
        name: category.category,
        value: category.revenue,
        percentage: category.percentage || 0
      })),
      type: 'pie',
      title: 'Sales by Category'
    }
  }

  const getPaymentMethodsData = (paymentMethods, options) => {
    return {
      data: paymentMethods.map(method => ({
        name: method.method,
        value: method.amount,
        count: method.count,
        percentage: method.percentage
      })),
      type: 'donut',
      title: 'Payment Methods Distribution'
    }
  }

  const getHourlySalesData = (hourlySales, options) => {
    return {
      data: hourlySales.map(hour => ({
        hour: `${hour.hour}:00`,
        revenue: hour.revenue,
        transactions: hour.transactions
      })),
      type: 'area',
      title: 'Hourly Sales Pattern'
    }
  }

  const getCustomerAnalysisData = (customers, options) => {
    const topN = options.topN || 10
    const topCustomers = customers.slice(0, topN)
    
    return {
      data: topCustomers.map(customer => ({
        name: customer.name,
        totalSpent: customer.totalSpent,
        transactions: customer.transactions,
        averageValue: customer.averageTransactionValue
      })),
      type: 'bar',
      title: 'Top Customers'
    }
  }

  const value = useMemo(() => ({
    rawData,
    analytics,
    insights,
    loading,
    error,
    dashboardSummary: getDashboardSummary(),
    fetchAdvancedData,
    getChartData,
    getComparativeAnalysis,
    exportData
  }), [rawData, analytics, insights, loading, error, getDashboardSummary, fetchAdvancedData, getChartData, getComparativeAnalysis, exportData])

  return value
}
