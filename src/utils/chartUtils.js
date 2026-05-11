import { format } from 'date-fns'

// Chart color schemes
export const CHART_COLORS = {
  primary: '#10b981',
  secondary: '#3b82f6', 
  tertiary: '#f59e0b',
  danger: '#ef4444',
  warning: '#f97316',
  info: '#06b6d4',
  purple: '#8b5cf6',
  pink: '#ec4899',
  gray: '#6b7280'
}

export const CHART_COLOR_ARRAY = [
  CHART_COLORS.primary,
  CHART_COLORS.secondary,
  CHART_COLORS.tertiary,
  CHART_COLORS.danger,
  CHART_COLORS.warning,
  CHART_COLORS.info,
  CHART_COLORS.purple,
  CHART_COLORS.pink
]

// Format currency for chart display
export const formatChartCurrency = (value, currency = '$') => {
  return `${currency}${Number(value || 0).toFixed(2)}`
}

// Format date for chart labels
export const formatChartDate = (date, formatString = 'MMM dd') => {
  try {
    const dateObj = new Date(date)
    if (isNaN(dateObj.getTime())) {
      return date
    }
    return format(dateObj, formatString)
  } catch (error) {
    return date
  }
}

// Prepare data for line charts (time series)
export const prepareLineChartData = (data, xKey, yKey, name) => {
  return {
    name,
    data: data.map(item => ({
      x: item[xKey],
      y: item[yKey]
    }))
  }
}

// Prepare data for bar charts
export const prepareBarChartData = (data, xKey, yKey) => {
  return data.map(item => ({
    name: item[xKey],
    value: item[yKey]
  }))
}

// Prepare data for pie charts
export const preparePieChartData = (data, nameKey, valueKey) => {
  return data.map(item => ({
    name: item[nameKey],
    value: item[valueKey]
  }))
}

// Calculate percentage change between two values
export const calculatePercentageChange = (current, previous) => {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / Math.abs(previous)) * 100
}

// Format percentage for display
export const formatPercentage = (value, decimals = 1) => {
  return `${Number(value || 0).toFixed(decimals)}%`
}

// Get trend indicator
export const getTrendIndicator = (current, previous) => {
  const change = calculatePercentageChange(current, previous)
  return {
    change,
    isPositive: change > 0,
    isNeutral: change === 0,
    trend: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral'
  }
}

// Aggregate data by period
export const aggregateByPeriod = (data, dateKey, valueKey, period = 'day') => {
  const aggregated = new Map()
  
  data.forEach(item => {
    const date = new Date(item[dateKey])
    let key
    
    switch (period) {
      case 'hour':
        key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`
        break
      case 'day':
        key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
        break
      case 'week':
        const weekStart = new Date(date.setDate(date.getDate() - date.getDay()))
        key = `${weekStart.getFullYear()}-W${Math.ceil(weekStart.getDate() / 7)}`
        break
      case 'month':
        key = `${date.getFullYear()}-${date.getMonth()}`
        break
      case 'year':
        key = `${date.getFullYear()}`
        break
      default:
        key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
    }
    
    if (!aggregated.has(key)) {
      aggregated.set(key, {
        period: key,
        value: 0,
        count: 0,
        date: item[dateKey]
      })
    }
    
    const periodData = aggregated.get(key)
    periodData.value += item[valueKey] || 0
    periodData.count += 1
  })
  
  return Array.from(aggregated.values()).sort((a, b) => 
    new Date(a.date) - new Date(b.date)
  )
}

// Moving average calculation
export const calculateMovingAverage = (data, period = 7) => {
  const result = []
  
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - period + 1)
    const end = i + 1
    const subset = data.slice(start, end)
    const average = subset.reduce((sum, item) => sum + item.value, 0) / subset.length
    
    result.push({
      ...data[i],
      movingAverage: average
    })
  }
  
  return result
}

// Prepare comparison data for period-over-period analysis
export const prepareComparisonData = (currentData, previousData, key) => {
  const comparison = []
  
  currentData.forEach(current => {
    const previous = previousData.find(prev => 
      prev.period === current.period || 
      new Date(prev.date).toDateString() === new Date(current.date).toDateString()
    )
    
    const currentValue = current[key] || 0
    const previousValue = previous ? (previous[key] || 0) : 0
    
    comparison.push({
      ...current,
      previousValue,
      currentValue,
      change: currentValue - previousValue,
      percentageChange: calculatePercentageChange(currentValue, previousValue)
    })
  })
  
  return comparison
}

// Chart responsive configuration
export const getResponsiveConfig = (width) => {
  if (width < 640) { // Mobile
    return {
      fontSize: 10,
      margin: { top: 20, right: 10, left: 40, bottom: 40 },
      barSize: 20
    }
  } else if (width < 1024) { // Tablet
    return {
      fontSize: 12,
      margin: { top: 20, right: 20, left: 50, bottom: 50 },
      barSize: 30
    }
  } else { // Desktop
    return {
      fontSize: 14,
      margin: { top: 20, right: 30, left: 60, bottom: 60 },
      barSize: 40
    }
  }
}

// Custom tooltip formatter
export const createTooltipFormatter = (currency = '$') => {
  return (value, name) => {
    if (typeof value === 'number') {
      return [formatChartCurrency(value, currency), name]
    }
    return [value, name]
  }
}

// Export chart as image
export const exportChartAsImage = (chartRef, filename = 'chart') => {
  if (!chartRef.current) return null
  
  const svgElement = chartRef.current.container.querySelector('svg')
  if (!svgElement) return null
  
  const svgData = new XMLSerializer().serializeToString(svgElement)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const img = new Image()
  
  img.onload = () => {
    canvas.width = img.width
    canvas.height = img.height
    ctx.drawImage(img, 0, 0)
    
    // Convert to blob and download
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.download = `${filename}.png`
      link.href = url
      link.click()
      URL.revokeObjectURL(url)
    })
  }
  
  img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
}
