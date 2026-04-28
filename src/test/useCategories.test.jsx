import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useCategories } from '../hooks/useCategories'

// Mock Firebase
vi.mock('../firebase', () => ({
  db: {
    collection: vi.fn(() => ({
      where: vi.fn(() => ({
        onSnapshot: vi.fn((callback) => {
          callback({
            docs: [
              { id: 'cat-1', data: () => ({ name: 'Beverages' }) },
              { id: 'cat-2', data: () => ({ name: 'Food' }) },
              { id: 'cat-3', data: () => ({ name: 'Electronics' }) },
            ],
          })
          return () => {}
        }),
      })),
    })),
  },
}))

describe('useCategories', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Initial state', () => {
    it('should start with empty categories array', () => {
      const { result } = renderHook(() => useCategories())
      expect(result.current.categories).toEqual([])
    })

    it('should start with loading true', () => {
      const { result } = renderHook(() => useCategories())
      expect(result.current.loading).toBe(true)
    })
  })

  describe('Categories data', () => {
    it('should load categories from Firestore', async () => {
      const { result } = renderHook(() => useCategories())
      
      await waitFor(() => {
        expect(result.current.categories.length).toBe(3)
      })
      
      expect(result.current.loading).toBe(false)
    })

    it('should map category documents correctly', async () => {
      const { result } = renderHook(() => useCategories())
      
      await waitFor(() => {
        expect(result.current.categories).toEqual([
          expect.objectContaining({ id: 'cat-1', name: 'Beverages' }),
          expect.objectContaining({ id: 'cat-2', name: 'Food' }),
          expect.objectContaining({ id: 'cat-3', name: 'Electronics' }),
        ])
      })
    })
  })

  describe('CRUD functions', () => {
    it('should have addCategory function', () => {
      const { result } = renderHook(() => useCategories())
      expect(typeof result.current.addCategory).toBe('function')
    })

    it('should have updateCategory function', () => {
      const { result } = renderHook(() => useCategories())
      expect(typeof result.current.updateCategory).toBe('function')
    })

    it('should have deleteCategory function', () => {
      const { result } = renderHook(() => useCategories())
      expect(typeof result.current.deleteCategory).toBe('function')
    })
  })
})