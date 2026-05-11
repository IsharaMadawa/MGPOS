import {
  CHART_COLORS,
  formatChartCurrency,
  formatChartDate,
  prepareLineChartData,
  prepareBarChartData,
  preparePieChartData,
  calculatePercentageChange,
  formatPercentage,
  getTrendIndicator,
  aggregateByPeriod,
  calculateMovingAverage,
  prepareComparisonData,
  getResponsiveConfig,
  createTooltipFormatter
} from '../utils/chartUtils'

describe('chartUtils', () => {
  describe('Constants', () => {
    test('should have defined chart colors', () => {
      expect(CHART_COLORS).toBeDefined()
      expect(CHART_COLORS.primary).toBe('#10b981')
      expect(CHART_COLORS.secondary).toBe('#3b82f6')
      expect(CHART_COLORS.tertiary).toBe('#f59e0b')
    })
  })

  describe('formatChartCurrency', () => {
    test('should format positive numbers correctly', () => {
      expect(formatChartCurrency(1234.56)).toBe('$1234.56')
    })

    test('should format zero correctly', () => {
      expect(formatChartCurrency(0)).toBe('$0.00')
    })

    test('should handle null/undefined values', () => {
      expect(formatChartCurrency(null)).toBe('$0.00')
      expect(formatChartCurrency(undefined)).toBe('$0.00')
    })

    test('should use custom currency symbol', () => {
      expect(formatChartCurrency(1234.56, '€')).toBe('€1234.56')
    })
  })

  describe('formatChartDate', () => {
    test('should format date string correctly', () => {
      const dateString = '2024-01-15T10:30:00Z'
      expect(formatChartDate(dateString, 'MMM dd')).toMatch(/Jan 15/)
    })

    test('should handle invalid dates gracefully', () => {
      const invalidDate = 'invalid-date'
      expect(formatChartDate(invalidDate)).toBe('invalid-date')
    })
  })

  describe('prepareLineChartData', () => {
    test('should prepare data for line chart correctly', () => {
      const data = [
        { x: '2024-01-01', y: 100 },
        { x: '2024-01-02', y: 150 }
      ]
      const result = prepareLineChartData(data, 'x', 'y', 'Revenue')

      expect(result.name).toBe('Revenue')
      expect(result.data).toEqual([
        { x: '2024-01-01', y: 100 },
        { x: '2024-01-02', y: 150 }
      ])
    })
  })

  describe('prepareBarChartData', () => {
    test('should prepare data for bar chart correctly', () => {
      const data = [
        { name: 'Product A', value: 100 },
        { name: 'Product B', value: 150 }
      ]
      const result = prepareBarChartData(data, 'name', 'value')

      expect(result).toEqual([
        { name: 'Product A', value: 100 },
        { name: 'Product B', value: 150 }
      ])
    })
  })

  describe('preparePieChartData', () => {
    test('should prepare data for pie chart correctly', () => {
      const data = [
        { category: 'Electronics', amount: 500 },
        { category: 'Clothing', amount: 300 }
      ]
      const result = preparePieChartData(data, 'category', 'amount')

      expect(result).toEqual([
        { name: 'Electronics', value: 500 },
        { name: 'Clothing', value: 300 }
      ])
    })
  })

  describe('calculatePercentageChange', () => {
    test('should calculate positive percentage change', () => {
      expect(calculatePercentageChange(150, 100)).toBe(50)
    })

    test('should calculate negative percentage change', () => {
      expect(calculatePercentageChange(80, 100)).toBe(-20)
    })

    test('should handle zero previous value', () => {
      expect(calculatePercentageChange(100, 0)).toBe(100)
    })

    test('should handle zero current value', () => {
      expect(calculatePercentageChange(0, 100)).toBe(-100)
    })
  })

  describe('formatPercentage', () => {
    test('should format percentage correctly', () => {
      expect(formatPercentage(25.567)).toBe('25.6%')
      expect(formatPercentage(25.567, 2)).toBe('25.57%')
    })

    test('should handle zero and negative values', () => {
      expect(formatPercentage(0)).toBe('0.0%')
      expect(formatPercentage(-15.5)).toBe('-15.5%')
    })
  })

  describe('getTrendIndicator', () => {
    test('should identify upward trend', () => {
      const result = getTrendIndicator(150, 100)
      expect(result.isPositive).toBe(true)
      expect(result.trend).toBe('up')
    })

    test('should identify downward trend', () => {
      const result = getTrendIndicator(80, 100)
      expect(result.isPositive).toBe(false)
      expect(result.trend).toBe('down')
    })

    test('should identify neutral trend', () => {
      const result = getTrendIndicator(100, 100)
      expect(result.isNeutral).toBe(true)
      expect(result.trend).toBe('neutral')
    })
  })

  describe('aggregateByPeriod', () => {
    test('should aggregate data by day', () => {
      const data = [
        { date: '2024-01-01T10:00:00Z', value: 100 },
        { date: '2024-01-01T15:00:00Z', value: 150 },
        { date: '2024-01-02T10:00:00Z', value: 200 }
      ]

      const result = aggregateByPeriod(data, 'date', 'value', 'day')

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        period: '2024-0-1',
        value: 250,
        count: 2,
        date: '2024-01-01T10:00:00Z'
      })
      expect(result[1]).toEqual({
        period: '2024-0-2',
        value: 200,
        count: 1,
        date: '2024-01-02T10:00:00Z'
      })
    })

    test('should aggregate data by month', () => {
      const data = [
        { date: '2024-01-01T10:00:00Z', value: 100 },
        { date: '2024-01-15T10:00:00Z', value: 150 },
        { date: '2024-02-01T10:00:00Z', value: 200 }
      ]

      const result = aggregateByPeriod(data, 'date', 'value', 'month')

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        period: '2024-0',
        value: 250,
        count: 2,
        date: '2024-01-01T10:00:00Z'
      })
    })
  })

  describe('calculateMovingAverage', () => {
    test('should calculate moving average correctly', () => {
      const data = [
        { value: 100 },
        { value: 200 },
        { value: 300 },
        { value: 400 },
        { value: 500 }
      ]

      const result = calculateMovingAverage(data, 3)

      expect(result).toHaveLength(5)
      expect(result[2].movingAverage).toBe(200) // (100+200+300)/3
      expect(result[4].movingAverage).toBe(400) // (300+400+500)/3
    })
  })

  describe('prepareComparisonData', () => {
    test('should prepare comparison data correctly', () => {
      const currentData = [
        { period: '2024-01', value: 1000 },
        { period: '2024-02', value: 1200 }
      ]
      const previousData = [
        { period: '2024-01', value: 800 },
        { period: '2024-02', value: 1000 }
      ]

      const result = prepareComparisonData(currentData, previousData, 'value')

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        period: '2024-01',
        value: 1000,
        previousValue: 800,
        currentValue: 1000,
        change: 200,
        percentageChange: 25
      })
    })
  })

  describe('getResponsiveConfig', () => {
    test('should return mobile config for small screens', () => {
      const config = getResponsiveConfig(500)
      expect(config.fontSize).toBe(10)
      expect(config.barSize).toBe(20)
    })

    test('should return tablet config for medium screens', () => {
      const config = getResponsiveConfig(800)
      expect(config.fontSize).toBe(12)
      expect(config.barSize).toBe(30)
    })

    test('should return desktop config for large screens', () => {
      const config = getResponsiveConfig(1200)
      expect(config.fontSize).toBe(14)
      expect(config.barSize).toBe(40)
    })
  })

  describe('createTooltipFormatter', () => {
    test('should create tooltip formatter function', () => {
      const formatter = createTooltipFormatter('€')
      const result = formatter(1234.56, 'Revenue')
      
      expect(result).toEqual(['€1234.56', 'Revenue'])
    })

    test('should handle non-numeric values', () => {
      const formatter = createTooltipFormatter('$')
      const result = formatter('Test Value', 'Category')
      
      expect(result).toEqual(['Test Value', 'Category'])
    })
  })
})
