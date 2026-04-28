import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { OrgProvider, useOrg } from '../contexts/OrgContext'

describe('OrgContext', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('useOrg hook', () => {
    it('should provide initial null state when no org selected', () => {
      const { result } = renderHook(() => useOrg())
      expect(result.current.selectedOrgId).toBeNull()
    })

    it('should load previously selected org from localStorage', () => {
      localStorage.setItem('pos_selected_org', 'org-123')
      
      const { result } = renderHook(() => useOrg())
      expect(result.current.selectedOrgId).toBe('org-123')
    })
  })

  describe('setSelectedOrgId', () => {
    it('should update selected orgId', () => {
      const { result } = renderHook(() => useOrg())
      
      act(() => {
        result.current.setSelectedOrgId('org-456')
      })
      
      expect(result.current.selectedOrgId).toBe('org-456')
    })

    it('should persist org selection to localStorage', () => {
      const { result } = renderHook(() => useOrg())
      
      act(() => {
        result.current.setSelectedOrgId('org-789')
      })
      
      expect(localStorage.getItem('pos_selected_org')).toBe('org-789')
    })

    it('should allow clearing org selection', () => {
      localStorage.setItem('pos_selected_org', 'org-initial')
      const { result } = renderHook(() => useOrg())
      
      act(() => {
        result.current.setSelectedOrgId(null)
      })
      
      expect(result.current.selectedOrgId).toBeNull()
      expect(localStorage.getItem('pos_selected_org')).toBeNull()
    })
  })

  describe('clearSelectedOrg', () => {
    it('should clear the selected org', () => {
      localStorage.setItem('pos_selected_org', 'org-to-clear')
      const { result } = renderHook(() => useOrg())
      
      act(() => {
        result.current.clearSelectedOrg()
      })
      
      expect(result.current.selectedOrgId).toBeNull()
      expect(localStorage.getItem('pos_selected_org')).toBeNull()
    })
  })
})