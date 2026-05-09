import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays, subWeeks, subMonths, subYears, isAfter, isBefore } from 'date-fns'

// Advanced analytics calculations for business insights

export class AnalyticsCalculator {
  constructor(data, currencySymbol = '$', categories = null) {
    this.data = data || []
    this.currencySymbol = currencySymbol
    this.categories = categories
  }

  // Revenue Analytics
  calculateRevenueMetrics(period = 'month') {
    const now = new Date()
    const { start: currentStart, end: currentEnd } = this.getPeriodRange(now, period)
    const { start: previousStart, end: previousEnd } = this.getPreviousPeriodRange(now, period)

    const currentData = this.filterDataByDate(currentStart, currentEnd)
    const previousData = this.filterDataByDate(previousStart, previousEnd)

    const currentRevenue = this.calculateTotalRevenue(currentData)
    const previousRevenue = this.calculateTotalRevenue(previousData)

    return {
      current: currentRevenue,
      previous: previousRevenue,
      change: currentRevenue - previousRevenue,
      percentageChange: this.calculatePercentageChange(currentRevenue, previousRevenue),
      trend: this.getTrend(currentData, 'revenue'),
      forecast: this.forecastRevenue(currentData, period)
    }
  }

  // Transaction Analytics
  calculateTransactionMetrics(period = 'month') {
    const now = new Date()
    const { start: currentStart, end: currentEnd } = this.getPeriodRange(now, period)
    const { start: previousStart, end: previousEnd } = this.getPreviousPeriodRange(now, period)

    const currentData = this.filterDataByDate(currentStart, currentEnd)
    const previousData = this.filterDataByDate(previousStart, previousEnd)

    const currentTransactions = currentData.length
    const previousTransactions = previousData.length
    const currentAvgTransaction = this.calculateAverageTransaction(currentData)
    const previousAvgTransaction = this.calculateAverageTransaction(previousData)

    return {
      count: {
        current: currentTransactions,
        previous: previousTransactions,
        change: currentTransactions - previousTransactions,
        percentageChange: this.calculatePercentageChange(currentTransactions, previousTransactions)
      },
      averageValue: {
        current: currentAvgTransaction,
        previous: previousAvgTransaction,
        change: currentAvgTransaction - previousAvgTransaction,
        percentageChange: this.calculatePercentageChange(currentAvgTransaction, previousAvgTransaction)
      }
    }
  }

  // Product Performance Analytics
  calculateProductPerformance() {
    const productMap = new Map()

    this.data.forEach(transaction => {
      if (!transaction.cart || !Array.isArray(transaction.cart)) return

      transaction.cart.forEach(item => {
        const productId = item.id || item.productId
        if (!productMap.has(productId)) {
          productMap.set(productId, {
            id: productId,
            name: item.name || 'Unknown Product',
            category: item.category || 'Uncategorized',
            sku: item.sku || '',
            unitsSold: 0,
            revenue: 0,
            cost: 0,
            profit: 0,
            discountAmount: 0,
            transactions: 0
          })
        }

        const product = productMap.get(productId)
        const quantity = item.qty || 1
        const price = item.price || 0
        const cost = item.cost || 0
        const itemRevenue = price * quantity
        const itemCost = cost * quantity
        const itemProfit = itemRevenue - itemCost

        product.unitsSold += quantity
        product.revenue += itemRevenue
        product.cost += itemCost
        product.profit += itemProfit
        product.transactions += 1

        // Calculate discount
        if (item.discount && item.discount.enabled) {
          let discountAmount = 0
          if (item.discount.type === 'percentage') {
            discountAmount = itemRevenue * (item.discount.value / 100)
          } else {
            discountAmount = Math.min(item.discount.value * quantity, itemRevenue)
          }
          product.discountAmount += discountAmount
        }
      })
    })

    return Array.from(productMap.values())
      .map(product => ({
        ...product,
        profitMargin: product.revenue > 0 ? (product.profit / product.revenue) * 100 : 0,
        averagePrice: product.unitsSold > 0 ? product.revenue / product.unitsSold : 0,
        discountRate: product.revenue > 0 ? (product.discountAmount / product.revenue) * 100 : 0
      }))
      .sort((a, b) => b.revenue - a.revenue)
  }

  // Helper method to map category ID to name
  mapCategoryToName(categoryId) {
    if (!categoryId || !this.categories || !Array.isArray(this.categories)) {
      return categoryId || 'Uncategorized'
    }
    
    const foundCategory = this.categories.find(cat => cat.id === categoryId || cat.name === categoryId)
    return foundCategory ? foundCategory.name : categoryId
  }

  // Category Performance Analytics
  calculateCategoryPerformance() {
    const categoryMap = new Map()

    this.data.forEach(transaction => {
      if (!transaction.cart || !Array.isArray(transaction.cart)) return

      transaction.cart.forEach(item => {
        const category = this.mapCategoryToName(item.category) || 'Uncategorized'
        if (!categoryMap.has(category)) {
          categoryMap.set(category, {
            category,
            unitsSold: 0,
            revenue: 0,
            cost: 0,
            profit: 0,
            discountAmount: 0,
            transactions: 0
          })
        }

        const categoryData = categoryMap.get(category)
        const quantity = item.qty || 1
        const price = item.price || 0
        const cost = item.cost || 0
        const itemRevenue = price * quantity
        const itemCost = cost * quantity

        categoryData.unitsSold += quantity
        categoryData.revenue += itemRevenue
        categoryData.cost += itemCost
        categoryData.profit += itemRevenue - itemCost
        categoryData.transactions += 1
      })
    })

    return Array.from(categoryMap.values())
      .map(category => ({
        ...category,
        profitMargin: category.revenue > 0 ? (category.profit / category.revenue) * 100 : 0,
        averageTransactionValue: category.transactions > 0 ? category.revenue / category.transactions : 0
      }))
      .sort((a, b) => b.revenue - a.revenue)
  }

  // Payment Method Analytics
  calculatePaymentMethodAnalytics() {
    const paymentMap = new Map()

    this.data.forEach(transaction => {
      const method = transaction.paymentMethod || 'Unknown'
      if (!paymentMap.has(method)) {
        paymentMap.set(method, {
          method,
          count: 0,
          amount: 0,
          percentage: 0
        })
      }

      const paymentData = paymentMap.get(method)
      paymentData.count += 1
      paymentData.amount += transaction.total || 0
    })

    const totalAmount = Array.from(paymentMap.values()).reduce((sum, payment) => sum + payment.amount, 0)

    return Array.from(paymentMap.values())
      .map(payment => ({
        ...payment,
        percentage: totalAmount > 0 ? (payment.amount / totalAmount) * 100 : 0,
        averageTransactionValue: payment.count > 0 ? payment.amount / payment.count : 0
      }))
      .sort((a, b) => b.amount - a.amount)
  }

  // Time-based Analytics
  calculateHourlySales() {
    const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      sales: 0,
      transactions: 0,
      revenue: 0
    }))

    this.data.forEach(transaction => {
      const hour = new Date(transaction.createdAt).getHours()
      hourlyData[hour].transactions += 1
      hourlyData[hour].sales += transaction.itemCount || 0
      hourlyData[hour].revenue += transaction.total || 0
    })

    return hourlyData
  }

  calculateDailySales(days = 30) {
    const dailyMap = new Map()
    const cutoffDate = subDays(new Date(), days)

    this.data
      .filter(transaction => new Date(transaction.createdAt) >= cutoffDate)
      .forEach(transaction => {
        const date = new Date(transaction.createdAt).toISOString().split('T')[0]
        if (!dailyMap.has(date)) {
          dailyMap.set(date, {
            date,
            sales: 0,
            transactions: 0,
            revenue: 0,
            discounts: 0
          })
        }

        const dayData = dailyMap.get(date)
        dayData.transactions += 1
        dayData.sales += transaction.itemCount || 0
        dayData.revenue += transaction.total || 0
        dayData.discounts += transaction.discountAmount || 0
      })

    return Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date))
  }

  // Customer Analytics
  calculateCustomerAnalytics() {
    const customerMap = new Map()

    this.data.forEach(transaction => {
      if (!transaction.customer) return

      const customerId = transaction.customer.id || transaction.customerId
      if (!customerId) return

      if (!customerMap.has(customerId)) {
        customerMap.set(customerId, {
          id: customerId,
          name: transaction.customer.name || 'Unknown Customer',
          phone: transaction.customer.phone || '',
          email: transaction.customer.email || '',
          transactions: 0,
          totalSpent: 0,
          averageTransactionValue: 0,
          firstTransaction: transaction.createdAt,
          lastTransaction: transaction.createdAt,
          itemsPurchased: 0
        })
      }

      const customer = customerMap.get(customerId)
      customer.transactions += 1
      customer.totalSpent += transaction.total || 0
      customer.itemsPurchased += transaction.itemCount || 0

      const transactionDate = new Date(transaction.createdAt)
      if (isBefore(transactionDate, new Date(customer.firstTransaction))) {
        customer.firstTransaction = transaction.createdAt
      }
      if (isAfter(transactionDate, new Date(customer.lastTransaction))) {
        customer.lastTransaction = transaction.createdAt
      }
    })

    return Array.from(customerMap.values())
      .map(customer => ({
        ...customer,
        averageTransactionValue: customer.transactions > 0 ? customer.totalSpent / customer.transactions : 0,
        daysSinceFirstTransaction: Math.floor((new Date() - new Date(customer.firstTransaction)) / (1000 * 60 * 60 * 24)),
        daysSinceLastTransaction: Math.floor((new Date() - new Date(customer.lastTransaction)) / (1000 * 60 * 60 * 24))
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
  }

  // Comparative Analysis
  calculateComparativeAnalysis(currentPeriod, previousPeriod, metrics = ['revenue', 'transactions']) {
    const currentData = this.filterDataByPeriod(currentPeriod)
    const previousData = this.filterDataByPeriod(previousPeriod)

    const comparison = {}

    metrics.forEach(metric => {
      const currentValue = this.calculateMetric(currentData, metric)
      const previousValue = this.calculateMetric(previousData, metric)
      
      comparison[metric] = {
        current: currentValue,
        previous: previousValue,
        change: currentValue - previousValue,
        percentageChange: this.calculatePercentageChange(currentValue, previousValue),
        trend: this.getTrend(currentData, metric)
      }
    })

    return comparison
  }

  // Forecasting
  forecastRevenue(historicalData, period = 'month') {
    if (historicalData.length < 2) return 0

    // Simple linear regression for forecasting
    const n = historicalData.length
    const xValues = historicalData.map((_, index) => index)
    const yValues = historicalData.map(item => item.revenue || 0)

    const sumX = xValues.reduce((sum, x) => sum + x, 0)
    const sumY = yValues.reduce((sum, y) => sum + y, 0)
    const sumXY = xValues.reduce((sum, x, index) => sum + x * yValues[index], 0)
    const sumXX = xValues.reduce((sum, x) => sum + x * x, 0)

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n

    // Forecast next period
    const nextX = n
    return slope * nextX + intercept
  }

  // Helper methods
  getPeriodRange(date, period) {
    switch (period) {
      case 'day':
        return {
          start: startOfDay(date),
          end: endOfDay(date)
        }
      case 'week':
        return {
          start: startOfWeek(date),
          end: endOfWeek(date)
        }
      case 'month':
        return {
          start: startOfMonth(date),
          end: endOfMonth(date)
        }
      case 'year':
        return {
          start: startOfYear(date),
          end: endOfYear(date)
        }
      default:
        return {
          start: startOfMonth(date),
          end: endOfMonth(date)
        }
    }
  }

  getPreviousPeriodRange(date, period) {
    const currentDate = new Date(date)
    let previousDate

    switch (period) {
      case 'day':
        previousDate = subDays(currentDate, 1)
        break
      case 'week':
        previousDate = subWeeks(currentDate, 1)
        break
      case 'month':
        previousDate = subMonths(currentDate, 1)
        break
      case 'year':
        previousDate = subYears(currentDate, 1)
        break
      default:
        previousDate = subMonths(currentDate, 1)
    }

    return this.getPeriodRange(previousDate, period)
  }

  filterDataByDate(startDate, endDate) {
    return this.data.filter(transaction => {
      const transactionDate = new Date(transaction.createdAt)
      return transactionDate >= startDate && transactionDate <= endDate
    })
  }

  filterDataByPeriod(period) {
    const { start, end } = this.getPeriodRange(new Date(), period)
    return this.filterDataByDate(start, end)
  }

  calculateTotalRevenue(data) {
    return data.reduce((sum, transaction) => sum + (transaction.total || 0), 0)
  }

  calculateAverageTransaction(data) {
    if (data.length === 0) return 0
    const totalRevenue = this.calculateTotalRevenue(data)
    return totalRevenue / data.length
  }

  calculatePercentageChange(current, previous) {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / Math.abs(previous)) * 100
  }

  calculateMetric(data, metric) {
    switch (metric) {
      case 'revenue':
        return this.calculateTotalRevenue(data)
      case 'transactions':
        return data.length
      case 'averageTransaction':
        return this.calculateAverageTransaction(data)
      case 'items':
        return data.reduce((sum, transaction) => sum + (transaction.itemCount || 0), 0)
      default:
        return 0
    }
  }

  getTrend(data, metric) {
    if (data.length < 2) return 'neutral'

    const sortedData = data.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    const firstHalf = sortedData.slice(0, Math.floor(sortedData.length / 2))
    const secondHalf = sortedData.slice(Math.floor(sortedData.length / 2))

    const firstHalfValue = this.calculateMetric(firstHalf, metric)
    const secondHalfValue = this.calculateMetric(secondHalf, metric)

    if (secondHalfValue > firstHalfValue) return 'up'
    if (secondHalfValue < firstHalfValue) return 'down'
    return 'neutral'
  }
}

// Utility functions for specific calculations
export const calculateBusinessMetrics = (data, options = {}) => {
  const analytics = new AnalyticsCalculator(data, options.currencySymbol, options.categories)
  
  return {
    revenue: analytics.calculateRevenueMetrics(options.period),
    transactions: analytics.calculateTransactionMetrics(options.period),
    products: analytics.calculateProductPerformance(),
    categories: analytics.calculateCategoryPerformance(),
    paymentMethods: analytics.calculatePaymentMethodAnalytics(),
    hourlySales: analytics.calculateHourlySales(),
    dailySales: analytics.calculateDailySales(options.days),
    customers: analytics.calculateCustomerAnalytics()
  }
}

export const generateInsights = (analytics) => {
  const insights = []

  // Revenue insights
  if (analytics.revenue.percentageChange > 10) {
    insights.push({
      type: 'positive',
      title: 'Strong Revenue Growth',
      description: `Revenue increased by ${analytics.revenue.percentageChange.toFixed(1)}% compared to the previous period`
    })
  } else if (analytics.revenue.percentageChange < -10) {
    insights.push({
      type: 'warning',
      title: 'Revenue Decline',
      description: `Revenue decreased by ${Math.abs(analytics.revenue.percentageChange).toFixed(1)}% compared to the previous period`
    })
  }

  // Transaction insights
  if (analytics.transactions.count.percentageChange > 15) {
    insights.push({
      type: 'positive',
      title: 'Increased Customer Traffic',
      description: `Transaction count increased by ${analytics.transactions.count.percentageChange.toFixed(1)}%`
    })
  }

  // Product insights
  const topProduct = analytics.products[0]
  if (topProduct && topProduct.profitMargin > 50) {
    insights.push({
      type: 'info',
      title: 'High-Margin Product',
      description: `${topProduct.name} has a profit margin of ${topProduct.profitMargin.toFixed(1)}%`
    })
  }

  // Payment method insights
  const topPaymentMethod = analytics.paymentMethods[0]
  if (topPaymentMethod && topPaymentMethod.percentage > 70) {
    insights.push({
      type: 'info',
      title: 'Payment Method Concentration',
      description: `${topPaymentMethod.method} accounts for ${topPaymentMethod.percentage.toFixed(1)}% of all transactions`
    })
  }

  return insights
}
