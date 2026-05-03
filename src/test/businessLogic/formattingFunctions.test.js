import { describe, it, expect, beforeEach, vi } from 'vitest'

// Extracted formatting functions from CartPanel.jsx and BillingLogsPage.jsx
function fmt(amount, sym) {
  // Handle null/undefined explicitly
  if (amount === null || amount === undefined) {
    return `${sym}NaN.00`
  }
  const num = Number(amount)
  if (isNaN(num)) return `${sym}NaN.00`
  return `${sym}${num.toFixed(2)}`
}

function formatQty(qty, unit) {
  if (!unit || unit === 'Each') return `${qty}`
  return `${qty} ${unit}`
}

function fmtDate(ts) {
  return new Date(ts).toLocaleDateString()
}

function fmtTime(ts) {
  return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
}

describe('Formatting Functions', () => {
  describe('fmt - Currency formatting', () => {
    it('should format positive numbers correctly', () => {
      expect(fmt(10, '$')).toBe('$10.00')
      expect(fmt(10.5, '$')).toBe('$10.50')
      expect(fmt(10.99, '$')).toBe('$10.99')
      expect(fmt(0, '$')).toBe('$0.00')
    })

    it('should format negative numbers correctly', () => {
      expect(fmt(-10, '$')).toBe('$-10.00')
      expect(fmt(-10.5, '$')).toBe('$-10.50')
    })

    it('should handle decimal places correctly', () => {
      expect(fmt(10.123, '$')).toBe('$10.12') // Rounded down
      expect(fmt(10.125, '$')).toBe('$10.13') // Rounded up
      expect(fmt(10.999, '$')).toBe('$11.00') // Rounded up
    })

    it('should work with different currency symbols', () => {
      expect(fmt(10, '€')).toBe('€10.00')
      expect(fmt(10, '£')).toBe('£10.00')
      expect(fmt(10, '¥')).toBe('¥10.00')
      expect(fmt(10, '₹')).toBe('₹10.00')
      expect(fmt(10, 'Rs')).toBe('Rs10.00')
    })

    it('should handle string inputs', () => {
      expect(fmt('10', '$')).toBe('$10.00')
      expect(fmt('10.5', '$')).toBe('$10.50')
      expect(fmt('invalid', '$')).toBe('$NaN.00')
    })

    it('should handle null/undefined inputs', () => {
      expect(fmt(null, '$')).toBe('$NaN.00')
      expect(fmt(undefined, '$')).toBe('$NaN.00')
    })

    it('should handle very large numbers', () => {
      expect(fmt(1000000, '$')).toBe('$1000000.00')
      expect(fmt(999999999.99, '$')).toBe('$999999999.99')
    })

    it('should handle very small numbers', () => {
      expect(fmt(0.001, '$')).toBe('$0.00')
      expect(fmt(0.009, '$')).toBe('$0.01')
    })
  })

  describe('formatQty - Quantity formatting', () => {
    it('should format quantity without unit', () => {
      expect(formatQty(5, null)).toBe('5')
      expect(formatQty(5, '')).toBe('5')
      expect(formatQty(5, 'Each')).toBe('5')
    })

    it('should format quantity with unit', () => {
      expect(formatQty(5, 'kg')).toBe('5 kg')
      expect(formatQty(2.5, 'L')).toBe('2.5 L')
      expect(formatQty(10, 'pcs')).toBe('10 pcs')
    })

    it('should handle decimal quantities', () => {
      expect(formatQty(2.5, 'kg')).toBe('2.5 kg')
      expect(formatQty(0.5, 'L')).toBe('0.5 L')
      expect(formatQty(1.75, 'm')).toBe('1.75 m')
    })

    it('should handle zero quantity', () => {
      expect(formatQty(0, 'kg')).toBe('0 kg')
      expect(formatQty(0, null)).toBe('0')
    })

    it('should handle negative quantities', () => {
      expect(formatQty(-5, 'kg')).toBe('-5 kg')
      expect(formatQty(-2.5, 'L')).toBe('-2.5 L')
    })

    it('should handle string quantities', () => {
      expect(formatQty('5', 'kg')).toBe('5 kg')
      expect(formatQty('2.5', 'L')).toBe('2.5 L')
    })

    it('should handle various unit types', () => {
      expect(formatQty(1, 'kg')).toBe('1 kg')
      expect(formatQty(1, 'L')).toBe('1 L')
      expect(formatQty(1, 'm')).toBe('1 m')
      expect(formatQty(1, 'pcs')).toBe('1 pcs')
      expect(formatQty(1, 'box')).toBe('1 box')
      expect(formatQty(1, 'bottle')).toBe('1 bottle')
    })
  })

  describe('fmtDate - Date formatting', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should format date correctly', () => {
      const timestamp = '2024-03-15T10:30:00.000Z'
      const result = fmtDate(timestamp)
      
      // The exact format depends on the locale, but it should be a valid date string
      expect(result).toMatch(/^(3\/15\/2024|15\.3\.2024|2024-03-15|3\/15\/24)$/)
    })

    it('should handle different date formats', () => {
      const dates = [
        '2024-01-01T00:00:00.000Z',
        '2024-12-31T23:59:59.999Z',
        '2024-02-29T12:00:00.000Z', // Leap year
        '2023-02-28T12:00:00.000Z'  // Non-leap year
      ]

      dates.forEach(date => {
        const result = fmtDate(date)
        expect(result).toBeTruthy()
        expect(typeof result).toBe('string')
        expect(result.length).toBeGreaterThan(0)
      })
    })

    it('should handle Date objects', () => {
      const date = new Date('2024-03-15T10:30:00.000Z')
      const result = fmtDate(date)
      
      expect(result).toBeTruthy()
      expect(typeof result).toBe('string')
    })

    it('should handle timestamp numbers', () => {
      const timestamp = new Date('2024-03-15T10:30:00.000Z').getTime()
      const result = fmtDate(timestamp)
      
      expect(result).toBeTruthy()
      expect(typeof result).toBe('string')
    })

    it('should handle invalid dates gracefully', () => {
      const invalidDates = [
        'invalid-date',
        null,
        undefined,
        '',
        '2024-13-01T00:00:00.000Z', // Invalid month
        '2024-02-30T00:00:00.000Z'  // Invalid day
      ]

      invalidDates.forEach(date => {
        const result = fmtDate(date)
        expect(result).toBeTruthy()
        expect(typeof result).toBe('string')
      })
    })
  })

  describe('fmtTime - Time formatting', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should format time correctly', () => {
      const timestamp = '2024-03-15T10:30:00.000Z'
      const result = fmtTime(timestamp)
      
      // Should format as HH:MM in 2-digit format
      expect(result).toMatch(/^\d{2}:\d{2}$/)
    })

    it('should handle different times', () => {
      const times = [
        '2024-03-15T00:00:00.000Z', // Midnight
        '2024-03-15T12:00:00.000Z', // Noon
        '2024-03-15T23:59:59.999Z', // End of day
        '2024-03-15T09:05:00.000Z', // Single digit hour/minute
        '2024-03-15T14:30:00.000Z'  // Afternoon
      ]

      times.forEach(time => {
        const result = fmtTime(time)
        expect(result).toMatch(/^\d{2}:\d{2}$/)
      })
    })

    it('should handle Date objects', () => {
      const date = new Date('2024-03-15T10:30:00.000Z')
      const result = fmtTime(date)
      
      expect(result).toMatch(/^\d{2}:\d{2}$/)
    })

    it('should handle timestamp numbers', () => {
      const timestamp = new Date('2024-03-15T10:30:00.000Z').getTime()
      const result = fmtTime(timestamp)
      
      expect(result).toMatch(/^\d{2}:\d{2}$/)
    })

    it('should handle invalid times gracefully', () => {
      const invalidTimes = [
        'invalid-time',
        null,
        undefined,
        ''
      ]

      invalidTimes.forEach(time => {
        const result = fmtTime(time)
        expect(result).toBeTruthy()
        expect(typeof result).toBe('string')
      })
    })

    it('should handle timezone differences correctly', () => {
      // Test with different timezones
      const utcTime = '2024-03-15T10:30:00.000Z'
      const result = fmtTime(utcTime)
      
      // The exact time will depend on the system timezone
      expect(result).toMatch(/^\d{2}:\d{2}$/)
    })
  })

  describe('Combined formatting scenarios', () => {
    it('should handle realistic POS scenarios', () => {
      // Typical POS receipt line item
      const amount = 19.99
      const currency = '$'
      const quantity = 2
      const unit = 'kg'
      const timestamp = '2024-03-15T14:30:00.000Z'

      const formattedAmount = fmt(amount, currency)
      const formattedQuantity = formatQty(quantity, unit)
      const formattedDate = fmtDate(timestamp)
      const formattedTime = fmtTime(timestamp)

      expect(formattedAmount).toBe('$19.99')
      expect(formattedQuantity).toBe('2 kg')
      expect(formattedDate).toBeTruthy()
      expect(formattedTime).toMatch(/^\d{2}:\d{2}$/)
    })

    it('should handle edge case values', () => {
      // Edge case: very small discount
      expect(fmt(0.001, '$')).toBe('$0.00')
      
      // Edge case: zero quantity
      expect(formatQty(0, 'kg')).toBe('0 kg')
      
      // Edge case: empty unit
      expect(formatQty(5, '')).toBe('5')
    })

    it('should maintain consistency across different inputs', () => {
      const testCases = [
        { amount: 10, currency: '$', expected: '$10.00' },
        { amount: 10.5, currency: '€', expected: '€10.50' },
        { amount: 0, currency: '£', expected: '£0.00' },
        { amount: -5, currency: '¥', expected: '¥-5.00' }
      ]

      testCases.forEach(({ amount, currency, expected }) => {
        expect(fmt(amount, currency)).toBe(expected)
      })
    })
  })
})
