import { AnalyticsCalculator, calculateBusinessMetrics, generateInsights } from '../utils/analyticsUtils'

describe('analyticsUtils', () => {
  const mockTransactionData = [
    {
      id: '1',
      createdAt: '2024-01-01T10:00:00Z',
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
      createdAt: '2024-01-02T14:00:00Z',
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
      ]
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
        expect(performance[0]).toEqual({
          id: 'p1',
          name: 'Product A',
          category: 'Electronics',
          sku: '',
          unitsSold: 2,
          revenue: 60,
          cost: 40,
          profit: 20,
          discountAmount: 0,
          transactions: 1,
          profitMargin: 33.33333333333333,
          averagePrice: 30,
          discountRate: 0
        })
      })
    })

    describe('Category Performance', () => {
      test('should calculate category performance correctly', () => {
        const performance = calculator.calculateCategoryPerformance()

        expect(performance).toHaveLength(2)
        expect(performance[0]).toEqual({
          category: 'Electronics',
          unitsSold: 3,
          revenue: 100,
          cost: 65,
          profit: 35,
          discountAmount: 0,
          transactions: 1,
          profitMargin: 35,
          averageTransactionValue: 100
        })
      })
    })

    describe('Payment Method Analytics', () => {
      test('should calculate payment method analytics correctly', () => {
        const analytics = calculator.calculatePaymentMethodAnalytics()

        expect(analytics).toHaveLength(2)
        expect(analytics[0]).toEqual({
          method: 'cash',
          count: 1,
          amount: 100,
          percentage: 40,
          averageTransactionValue: 100
        })
      })
    })

    describe('Hourly Sales', () => {
      test('should calculate hourly sales correctly', () => {
        const hourlySales = calculator.calculateHourlySales()

        expect(hourlySales).toHaveLength(24)
        expect(hourlySales[10].transactions).toBe(1)
        expect(hourlySales[10].revenue).toBe(100)
        expect(hourlySales[14].transactions).toBe(1)
        expect(hourlySales[14].revenue).toBe(150)
      })
    })

    describe('Customer Analytics', () => {
      test('should calculate customer analytics correctly', () => {
        const analytics = calculator.calculateCustomerAnalytics()

        expect(analytics).toHaveLength(1)
        expect(analytics[0]).toEqual({
          id: 'c1',
          name: 'Customer A',
          phone: '123-456-7890',
          email: '',
          transactions: 1,
          totalSpent: 100,
          averageTransactionValue: 100,
          firstTransaction: '2024-01-01T10:00:00Z',
          lastTransaction: '2024-01-01T10:00:00Z',
          itemsPurchased: 3
        })
      })
    })

    describe('Comparative Analysis', () => {
      test('should calculate comparative analysis correctly', () => {
        const comparison = calculator.calculateComparativeAnalysis('month', 'lastMonth', ['revenue', 'transactions'])

        expect(comparison.revenue.current).toBe(250)
        expect(comparison.revenue.previous).toBe(0)
        expect(comparison.revenue.change).toBe(250)
        expect(comparison.revenue.percentageChange).toBe(100)
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
        transactions: { count: { percentageChange: 5 } }
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
        revenue: { percentageChange: -15 }
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
        transactions: { count: { percentageChange: 20 } }
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
        products: [
          { name: 'Product X', profitMargin: 60 }
        ]
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
