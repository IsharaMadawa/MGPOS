import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useOrganizations } from '../hooks/useOrganizations'

// Mock Firebase
vi.mock('../firebase', () => ({
  db: {
    collection: vi.fn(() => ({
      where: vi.fn(() => ({
        onSnapshot: vi.fn((callback) => {
          callback({
            docs: [
              { id: 'org-1', data: () => ({ name: 'Organization 1', code: 'ORG1' }) },
              { id: 'org-2', data: () => ({ name: 'Organization 2', code: 'ORG2' }) },
            ],
          })
          return () => {}
        }),
      })),
    })),
  },
}))

describe('useOrganizations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Initial state', () => {
    it('should start with empty organizations array', () => {
      const { result } = renderHook(() => useOrganizations())
      expect(result.current.organizations).toEqual([])
    })

    it('should start with loading true', () => {
      const { result } = renderHook(() => useOrganizations())
      expect(result.current.loading).toBe(true)
    })
  })

  describe('Organizations data', () => {
    it('should load organizations from Firestore', async () => {
      const { result } = renderHook(() => useOrganizations())
      
      await waitFor(() => {
        expect(result.current.organizations.length).toBe(2)
      })
      
      expect(result.current.loading).toBe(false)
    })

    it('should map organization documents correctly', async () => {
      const { result } = renderHook(() => useOrganizations())
      
      await waitFor(() => {
        expect(result.current.organizations).toEqual([
          expect.objectContaining({ id: 'org-1', name: 'Organization 1' }),
          expect.objectContaining({ id: 'org-2', name: 'Organization 2' }),
        ])
      })
    })
  })

  describe('addOrganization', () => {
    it('should have addOrganization function', () => {
      const { result } = renderHook(() => useOrganizations())
      expect(typeof result.current.addOrganization).toBe('function')
    })
  })

  describe('updateOrganization', () => {
    it('should have updateOrganization function', () => {
      const { result } = renderHook(() => useOrganizations())
      expect(typeof result.current.updateOrganization).toBe('function')
    })
  })

  describe('deleteOrganization', () => {
    it('should have deleteOrganization function', () => {
      const { result } = renderHook(() => useOrganizations())
      expect(typeof result.current.deleteOrganization).toBe('function')
    })
  })
})