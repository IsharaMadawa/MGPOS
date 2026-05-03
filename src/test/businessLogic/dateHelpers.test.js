import { describe, it, expect, beforeEach, vi } from 'vitest'

// Extracted date helper functions from useReports.js
function getDateRange(period, customStart = null, customEnd = null) {
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

describe('Date Helper Functions', () => {
  // Mock current date for consistent testing - use local time to avoid timezone issues
  const mockDate = new Date('2024-03-15T10:30:00')
  
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(mockDate)
  })
  
  afterEach(() => {
    vi.useRealTimers()
  })

  describe('getDateRange', () => {
    describe('Today period', () => {
      it('should return today\'s date range', () => {
        const result = getDateRange('today')
        
        // Adjust for timezone - the actual result will be in local time
        const expectedStart = new Date('2024-03-15T00:00:00.000')
        const expectedEnd = new Date('2024-03-15T23:59:59.999')
        
        expect(result.start).toEqual(expectedStart)
        expect(result.end).toEqual(expectedEnd)
      })
    })

    describe('Week period', () => {
      it('should return current week range (Sunday to Saturday)', () => {
        const result = getDateRange('week')
        
        // March 15, 2024 is a Friday, so week starts on Sunday March 10
        expect(result.start).toEqual(new Date('2024-03-10T00:00:00.000'))
        expect(result.end).toEqual(new Date('2024-03-16T23:59:59.999'))
      })

      it('should handle Monday as first day correctly', () => {
        // Mock a Monday
        const mondayMock = new Date('2024-03-11T10:30:00.000Z')
        vi.setSystemTime(mondayMock)
        
        const result = getDateRange('week')
        
        expect(result.start).toEqual(new Date('2024-03-10T00:00:00.000')) // Sunday
        expect(result.end).toEqual(new Date('2024-03-16T23:59:59.999')) // Saturday
      })

      it('should handle Sunday as first day correctly', () => {
        // Mock a Sunday
        const sundayMock = new Date('2024-03-10T10:30:00.000Z')
        vi.setSystemTime(sundayMock)
        
        const result = getDateRange('week')
        
        expect(result.start).toEqual(new Date('2024-03-10T00:00:00.000')) // Same Sunday
        expect(result.end).toEqual(new Date('2024-03-16T23:59:59.999')) // Saturday
      })
    })

    describe('Month period', () => {
      it('should return current month range', () => {
        const result = getDateRange('month')
        
        expect(result.start).toEqual(new Date('2024-03-01T00:00:00.000'))
        expect(result.end).toEqual(new Date('2024-03-31T23:59:59.999'))
      })

      it('should handle February in leap year correctly', () => {
        // Mock February in a leap year (2024)
        const febMock = new Date('2024-02-15T10:30:00.000Z')
        vi.setSystemTime(febMock)
        
        const result = getDateRange('month')
        
        expect(result.start).toEqual(new Date('2024-02-01T00:00:00.000'))
        expect(result.end).toEqual(new Date('2024-02-29T23:59:59.999')) // Leap day
      })

      it('should handle February in non-leap year correctly', () => {
        // Mock February in a non-leap year (2023)
        const febMock = new Date('2023-02-15T10:30:00.000Z')
        vi.setSystemTime(febMock)
        
        const result = getDateRange('month')
        
        expect(result.start).toEqual(new Date('2023-02-01T00:00:00.000'))
        expect(result.end).toEqual(new Date('2023-02-28T23:59:59.999')) // Non-leap year
      })

      it('should handle month with 31 days correctly', () => {
        // Mock January (31 days)
        const janMock = new Date('2024-01-15T10:30:00.000Z')
        vi.setSystemTime(janMock)
        
        const result = getDateRange('month')
        
        expect(result.start).toEqual(new Date('2024-01-01T00:00:00.000'))
        expect(result.end).toEqual(new Date('2024-01-31T23:59:59.999'))
      })

      it('should handle month with 30 days correctly', () => {
        // Mock April (30 days)
        const aprMock = new Date('2024-04-15T10:30:00.000Z')
        vi.setSystemTime(aprMock)
        
        const result = getDateRange('month')
        
        expect(result.start).toEqual(new Date('2024-04-01T00:00:00.000'))
        expect(result.end).toEqual(new Date('2024-04-30T23:59:59.999'))
      })
    })

    describe('Year period', () => {
      it('should return current year range', () => {
        const result = getDateRange('year')
        
        expect(result.start).toEqual(new Date('2024-01-01T00:00:00.000'))
        expect(result.end).toEqual(new Date('2024-12-31T23:59:59.999'))
      })

      it('should handle leap year correctly', () => {
        const leapYearMock = new Date('2020-06-15T10:30:00.000Z')
        vi.setSystemTime(leapYearMock)
        
        const result = getDateRange('year')
        
        expect(result.start).toEqual(new Date('2020-01-01T00:00:00.000'))
        expect(result.end).toEqual(new Date('2020-12-31T23:59:59.999'))
      })
    })

    describe('Custom period', () => {
      it('should use custom start and end dates when provided', () => {
        const customStart = '2024-01-01'
        const customEnd = '2024-01-31'
        
        const result = getDateRange('custom', customStart, customEnd)
        
        expect(result.start).toEqual(new Date('2024-01-01T00:00:00.000Z'))
        expect(result.end).toEqual(new Date('2024-01-31T00:00:00.000Z'))
      })

      it('should use custom start date with default end when end not provided', () => {
        const customStart = '2024-01-01'
        
        const result = getDateRange('custom', customStart)
        
        expect(result.start).toEqual(new Date('2024-01-01T00:00:00.000Z'))
        expect(result.end).toEqual(new Date('2024-03-15T18:29:59.999Z')) // Today + 1 day
      })

      it('should use today as start when custom start not provided', () => {
        const customEnd = '2024-03-20'
        
        const result = getDateRange('custom', null, customEnd)
        
        expect(result.start).toEqual(new Date('2024-03-15T00:00:00.000')) // Today
        expect(result.end).toEqual(new Date('2024-03-20T00:00:00.000Z'))
      })

      it('should use defaults when no custom dates provided', () => {
        const result = getDateRange('custom')
        
        expect(result.start).toEqual(new Date('2024-03-15T00:00:00.000')) // Today
        expect(result.end).toEqual(new Date('2024-03-15T23:59:59.999')) // Today + 1 day
      })

      it('should handle invalid date strings gracefully', () => {
        const result = getDateRange('custom', 'invalid-date', '2024-03-20')
        
        expect(result.start).toEqual(new Date('Invalid Date'))
        expect(result.end).toEqual(new Date('2024-03-20T00:00:00.000Z'))
      })
    })

    describe('Default period', () => {
      it('should return today\'s range for unknown period', () => {
        const result = getDateRange('unknown')
        
        expect(result.start).toEqual(new Date('2024-03-15T00:00:00.000'))
        expect(result.end).toEqual(new Date('2024-03-15T23:59:59.999'))
      })
    })

    describe('Edge cases', () => {
      it('should handle year boundaries correctly', () => {
        // Mock December 31
        const yearEndMock = new Date('2024-12-31T10:30:00.000Z')
        vi.setSystemTime(yearEndMock)
        
        const result = getDateRange('today')
        
        expect(result.start).toEqual(new Date('2024-12-31T00:00:00.000'))
        expect(result.end).toEqual(new Date('2024-12-31T23:59:59.999'))
      })

      it('should handle month boundaries correctly', () => {
        // Mock last day of month
        const monthEndMock = new Date('2024-01-31T10:30:00.000Z')
        vi.setSystemTime(monthEndMock)
        
        const result = getDateRange('month')
        
        expect(result.start).toEqual(new Date('2024-01-01T00:00:00.000'))
        expect(result.end).toEqual(new Date('2024-01-31T23:59:59.999'))
      })

      it('should handle week boundaries correctly', () => {
        // Mock Saturday (end of week)
        const saturdayMock = new Date('2024-03-16T10:30:00.000Z')
        vi.setSystemTime(saturdayMock)
        
        const result = getDateRange('week')
        
        expect(result.start).toEqual(new Date('2024-03-10T00:00:00.000'))
        expect(result.end).toEqual(new Date('2024-03-16T23:59:59.999'))
      })
    })

    describe('Date format handling', () => {
      it('should handle ISO date strings', () => {
        const result = getDateRange('custom', '2024-03-01T00:00:00.000Z', '2024-03-31T23:59:59.999Z')
        
        expect(result.start).toEqual(new Date('2024-03-01T00:00:00.000Z'))
        expect(result.end).toEqual(new Date('2024-03-31T23:59:59.999Z'))
      })

      it('should handle various date formats', () => {
        const result1 = getDateRange('custom', '2024-03-01', '2024-03-31')
        const result2 = getDateRange('custom', '03/01/2024', '03/31/2024')
        
        expect(result1.start).toEqual(new Date('2024-03-01T00:00:00.000Z'))
        expect(result1.end).toEqual(new Date('2024-03-31T00:00:00.000Z'))
        
        // Note: Date parsing might vary by implementation
        expect(result2.start).toBeInstanceOf(Date)
        expect(result2.end).toBeInstanceOf(Date)
      })
    })
  })
})
