import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useSettings, CURRENCIES } from '../hooks/useSettings'

// Mock Firebase
vi.mock('../firebase', () => ({
  db: {
    doc: vi.fn(() => ({
      get: vi.fn(() => Promise.resolve({
        exists: () => true,
        data: () => ({
          taxEnabled: true,
          taxRate: 8.25,
          currency: 'USD',
          discountMode: 'global',
          globalDiscount: 10,
          storeInfo: { name: 'Test Store' },
        }),
      })),
      onSnapshot: vi.fn((callback) => {
        callback({
          exists: () => true,
          data: () => ({
            taxEnabled: true,
            taxRate: 8.25,
            currency: 'USD',
            discountMode: 'global',
            globalDiscount: 10,
            storeInfo: { name: 'Test Store' },
          }),
        })
        return () => {}
      }),
    })),
  },
}))

describe('useSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('CURRENCIES constant', () => {
    it('should have USD currency', () => {
      const usd = CURRENCIES.find(c => c.code === 'USD')
      expect(usd).toBeDefined()
      expect(usd.symbol).toBe('$')
    })

    it('should have multiple currencies', () => {
      expect(CURRENCIES.length).toBeGreaterThan(5)
    })
  })

  describe('Initial state', () => {
    it('should have default settings initially', () => {
      const { result } = renderHook(() => useSettings())
      
      // Should have default values before loading
      expect(result.current.settings).toBeDefined()
      expect(result.current.settings.currency).toBe('USD')
    })

    it('should start with loading true', () => {
      const { result } = renderHook(() => useSettings())
      expect(result.current.loading).toBe(true)
    })
  })

  describe('Settings data', () => {
    it('should load settings from Firestore', async () => {
      const { result } = renderHook(() => useSettings())
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
      
      expect(result.current.settings.taxEnabled).toBe(true)
      expect(result.current.settings.taxRate).toBe(8.25)
    })
  })

  describe('updateSettings', () => {
    it('should have updateSettings function', () => {
      const { result } = renderHook(() => useSettings())
      expect(typeof result.current.updateSettings).toBe('function')
    })
  })
})