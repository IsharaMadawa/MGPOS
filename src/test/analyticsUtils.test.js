import { AnalyticsCalculator, calculateBusinessMetrics, generateInsights } from '../utils/analyticsUtils'

describe('analyticsUtils', () => {
  const now = new Date()
  const currentDate = now.toISOString()
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
  
  const mockTransactionData = [
    {
      id: '1',
      createdAt: currentDate,
      total: 100,
      itemCount: 3,
      paymentMethod: 'cash',
      cashierName: 'John Doe',
      cart: [
        {
          id: 'p1',
          name: 'Product A',
          price: 30,
          qty: 2,
          cost: 20,
          category: 'Electronics'
        },
        {
          id: 'p2',
          name: 'Product B',
          price: 40,
          qty: 1,
          cost: 25,
          category: 'Electronics'
        }
      ],
      customer: {
        id: 'c1',
        name: 'Customer A',
        phone: '123-456-7890'
      }
    },
    {
      id: '2',
      createdAt: yesterday,
      total: 150,
      itemCount: 2,
      paymentMethod: 'card',
      cashierName: 'Jane Smith',
      cart: [
        {
          id: 'p3',
          name: 'Product C',
          price: 75,
          qty: 2,
          cost: 50,
          category: 'Clothing'
        }
      ],
      customer: {
        id: 'c2',
        name: 'Customer B',
        phone: '098-765-4321'
      }
    }
  ]

  describe('AnalyticsCalculator', () => {
    let calculator

    beforeEach(() => {
      calculator = new AnalyticsCalculator(mockTransactionData, '$')
    })

    describe('Revenue Metrics', () => {
      test('should calculate revenue metrics correctly', () => {
        const metrics = calculator.calculateRevenueMetrics('month')

        expect(metrics.current).toBe(250)
        expect(metrics.previous).toBe(0)
        expect(metrics.change).toBe(250)
        expect(metrics.percentageChange).toBe(100)
      })
    })

    describe('Transaction Metrics', () => {
      test('should calculate transaction metrics correctly', () => {
        const metrics = calculator.calculateTransactionMetrics('month')

        expect(metrics.count.current).toBe(2)
        expect(metrics.averageValue.current).toBe(125)
      })
    })

    describe('Product Performance', () => {
      test('should calculate product performance correctly', () => {
        const performance = calculator.calculateProductPerformance()

        expect(performance).toHaveLength(3)
        expect(performance).toContainEqual(
          expect.objectContaining({
            id: 'p1',
            name: 'Product A',
            revenue: 60,
            unitsSold: 2,
            profit: 20
          })
        )
      })
    })

    describe('Category Performance', () => {
      test('should calculate category performance correctly', () => {
        const performance = calculator.calculateCategoryPerformance()

        expect(performance).toHaveLength(2)
        expect(performance).toContainEqual(
          expect.objectContaining({
            category: 'Electronics',
            revenue: 100,
            unitsSold: 3,
            profit: 35
          })
        )
      })
    })

    describe('Payment Method Analytics', () => {
      test('should calculate payment method analytics correctly', () => {
        const analytics = calculator.calculatePaymentMethodAnalytics()

        expect(analytics).toHaveLength(2)
        expect(analytics).toContainEqual(
          expect.objectContaining({
            method: 'cash',
            count: 1,
            amount: 100
          })
        )
      })
    })

    describe('Hourly Sales', () => {
      test('should calculate hourly sales correctly', () => {
        const hourlySales = calculator.calculateHourlySales()

        expect(hourlySales).toHaveLength(24)
        // Check that transactions are recorded in the correct hours
        const currentHour = new Date().getHours()
        const yesterdayHour = new Date(now.getTime() - 24 * 60 * 60 * 1000).getHours()
        
        expect(hourlySales[currentHour].transactions).toBeGreaterThan(0)
        expect(hourlySales[currentHour].revenue).toBeGreaterThan(0)
        expect(hourlySales[yesterdayHour].transactions).toBeGreaterThan(0)
        expect(hourlySales[yesterdayHour].revenue).toBeGreaterThan(0)
      })
    })

    describe('Customer Analytics', () => {
      test('should calculate customer analytics correctly', () => {
        const analytics = calculator.calculateCustomerAnalytics()

        expect(analytics).toHaveLength(2)
        expect(analytics).toContainEqual(
          expect.objectContaining({
            id: 'c1',
            name: 'Customer A',
            phone: '123-456-7890',
            transactions: 1,
            totalSpent: 100,
            itemsPurchased: 3
          })
        )
        expect(analytics).toContainEqual(
          expect.objectContaining({
            id: 'c2',
            name: 'Customer B',
            phone: '098-765-4321',
            transactions: 1,
            totalSpent: 150,
            itemsPurchased: 2
          })
        )
        // Check that the new properties exist
        expect(analytics[0]).toHaveProperty('daysSinceFirstTransaction')
        expect(analytics[0]).toHaveProperty('daysSinceLastTransaction')
      })
    })

    describe('Comparative Analysis', () => {
      test('should calculate comparative analysis correctly', () => {
        const comparison = calculator.calculateComparativeAnalysis('month', 'month', ['revenue', 'transactions'])

        expect(comparison.revenue.current).toBe(250)
        expect(comparison.revenue.previous).toBe(250)
        expect(comparison.revenue.change).toBe(0)
        expect(comparison.revenue.percentageChange).toBe(0)
      })
    })

    describe('Forecasting', () => {
      test('should forecast revenue correctly', () => {
        const forecast = calculator.forecastRevenue([
          { revenue: 100 },
          { revenue: 150 },
          { revenue: 200 }
        ])

        expect(typeof forecast).toBe('number')
      })
    })
  })

  describe('calculateBusinessMetrics', () => {
    test('should calculate comprehensive business metrics', () => {
      const metrics = calculateBusinessMetrics(mockTransactionData, {
        currencySymbol: '$',
        period: 'month',
        days: 30
      })

      expect(metrics).toHaveProperty('revenue')
      expect(metrics).toHaveProperty('transactions')
      expect(metrics).toHaveProperty('products')
      expect(metrics).toHaveProperty('categories')
      expect(metrics).toHaveProperty('paymentMethods')
      expect(metrics).toHaveProperty('hourlySales')
      expect(metrics).toHaveProperty('customers')
    })
  })

  describe('generateInsights', () => {
    test('should generate revenue growth insights', () => {
      const analytics = {
        revenue: { percentageChange: 15 },
        transactions: { count: { percentageChange: 5 } },
        products: [],
        paymentMethods: []
      }

      const insights = generateInsights(analytics)

      expect(insights).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'positive',
            title: 'Strong Revenue Growth',
            description: expect.stringContaining('increased by 15.0%')
          })
        ])
      )
    })

    test('should generate revenue decline insights', () => {
      const analytics = {
        revenue: { percentageChange: -15 },
        transactions: { count: { percentageChange: 0 } },
        products: [],
        paymentMethods: []
      }

      const insights = generateInsights(analytics)

      expect(insights).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'warning',
            title: 'Revenue Decline',
            description: expect.stringContaining('decreased by 15.0%')
          })
        ])
      )
    })

    test('should generate customer traffic insights', () => {
      const analytics = {
        revenue: { percentageChange: 0 },
        transactions: { count: { percentageChange: 20 } },
        products: [],
        paymentMethods: []
      }

      const insights = generateInsights(analytics)

      expect(insights).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'positive',
            title: 'Increased Customer Traffic',
            description: expect.stringContaining('increased by 20.0%')
          })
        ])
      )
    })

    test('should generate high-margin product insights', () => {
      const analytics = {
        revenue: { percentageChange: 0 },
        transactions: { count: { percentageChange: 0 } },
        products: [
          { name: 'Product X', profitMargin: 60 }
        ],
        paymentMethods: []
      }

      const insights = generateInsights(analytics)

      expect(insights).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'info',
            title: 'High-Margin Product',
            description: expect.stringContaining('Product X has a profit margin of 60.0%')
          })
        ])
      )
    })

    test('should generate payment method concentration insights', () => {
      const analytics = {
        revenue: { percentageChange: 0 },
        transactions: { count: { percentageChange: 0 } },
        products: [],
        paymentMethods: [
          { method: 'cash', percentage: 80 }
        ]
      }

      const insights = generateInsights(analytics)

      expect(insights).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'info',
            title: 'Payment Method Concentration',
            description: expect.stringContaining('cash accounts for 80.0% of all transactions')
          })
        ])
      )
    })
  })
})
