import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useProducts } from '../hooks/useProducts'

// Mock Firebase
vi.mock('../firebase', () => ({
  db: {
    collection: vi.fn(() => ({
      onSnapshot: vi.fn((callback) => {
        callback({
          docs: [
            { 
              id: 'prod-1', 
              data: () => ({ 
                name: 'Product 1', 
                price: 10.99, 
                category: 'Category A',
                unit: 'Each',
                discount: { enabled: false, type: 'percentage', value: 0 },
              }) 
            },
            { 
              id: 'prod-2', 
              data: () => ({ 
                name: 'Product 2', 
                price: 25.50, 
                category: 'Category B',
                unit: 'kg',
                discount: { enabled: true, type: 'percentage', value: 10 },
              }) 
            },
          ],
        })
        return () => {}
      }),
    })),
  },
}))

describe('useProducts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Initial state', () => {
    it('should start with empty products array', () => {
      const { result } = renderHook(() => useProducts())
      expect(result.current.products).toEqual([])
    })

    it('should start with loading true', () => {
      const { result } = renderHook(() => useProducts())
      expect(result.current.loading).toBe(true)
    })
  })

  describe('Products data', () => {
    it('should load products from Firestore', async () => {
      const { result } = renderHook(() => useProducts())
      
      await waitFor(() => {
        expect(result.current.products.length).toBe(2)
      })
      
      expect(result.current.loading).toBe(false)
    })

    it('should map product documents correctly', async () => {
      const { result } = renderHook(() => useProducts())
      
      await waitFor(() => {
        expect(result.current.products).toEqual([
          expect.objectContaining({ id: 'prod-1', name: 'Product 1', price: 10.99 }),
          expect.objectContaining({ id: 'prod-2', name: 'Product 2', price: 25.50 }),
        ])
      })
    })
  })

  describe('CRUD functions', () => {
    it('should have addProduct function', () => {
      const { result } = renderHook(() => useProducts())
      expect(typeof result.current.addProduct).toBe('function')
    })

    it('should have updateProduct function', () => {
      const { result } = renderHook(() => useProducts())
      expect(typeof result.current.updateProduct).toBe('function')
    })

    it('should have deleteProduct function', () => {
      const { result } = renderHook(() => useProducts())
      expect(typeof result.current.deleteProduct).toBe('function')
    })
  })
})