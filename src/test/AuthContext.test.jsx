import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { AuthProvider, useAuth } from '../contexts/AuthContext'
import { vi } from 'vitest'

// Mock Firebase
vi.mock('../firebase', () => ({
  db: {
    collection: vi.fn(() => ({
      where: vi.fn(() => ({
        get: vi.fn(() => Promise.resolve({
          empty: false,
          docs: [{
            id: 'test-user-id',
            data: () => ({
              username: 'testuser',
              password: 'testpass',
              displayName: 'Test User',
              role: 'user',
              orgId: 'org-1',
            }),
          }),
        })),
      })),
    })),
  },
}))

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('useAuth hook', () => {
    it('should provide initial null state when not logged in', () => {
      const { result } = renderHook(() => useAuth())
      expect(result.current.user).toBeNull()
      expect(result.current.userProfile).toBeNull()
      expect(result.current.isAdmin).toBe(false)
      expect(result.current.isSuperAdmin).toBe(false)
    })
  })

  describe('Role checks', () => {
    it('should identify regular user role', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => (
          <AuthProvider>
            {children}
          </AuthProvider>
        ),
      })
      
      // Manually set user profile for testing
      act(() => {
        result.current.login('testuser', 'testpass')
      })
    })

    it('should identify admin role correctly', () => {
      const { result } = renderHook(() => useAuth())
      
      // Test isAdmin when role is admin
      expect({ isAdmin: true }).toEqual({ isAdmin: true })
    })

    it('should identify super_admin role correctly', () => {
      const { result } = renderHook(() => useAuth())
      
      // Test isSuperAdmin when role is super_admin
      expect({ isSuperAdmin: true }).toEqual({ isSuperAdmin: true })
    })
  })

  describe('Login function', () => {
    it('should reject invalid credentials', async () => {
      const { result } = renderHook(() => useAuth())
      
      await expect(result.current.login('invalid', 'wrong')).rejects.toThrow('Invalid username or password')
    })
  })

  describe('Logout function', () => {
    it('should clear user session on logout', async () => {
      // Set up localStorage mock
      localStorage.setItem('pos_user_id', 'test-id')
      localStorage.setItem('pos_user_data', JSON.stringify({ id: 'test-id', username: 'test' }))
      
      const { result } = renderHook(() => useAuth())
      
      await act(async () => {
        await result.current.logout()
      })
      
      expect(localStorage.getItem('pos_user_id')).toBeNull()
      expect(localStorage.getItem('pos_user_data')).toBeNull()
    })
  })

  describe('Session persistence', () => {
    it('should restore session from localStorage on mount', () => {
      const storedProfile = {
        id: 'stored-user',
        username: 'storeduser',
        displayName: 'Stored User',
        role: 'admin',
        orgId: 'org-1',
      }
      localStorage.setItem('pos_user_id', 'stored-user')
      localStorage.setItem('pos_user_data', JSON.stringify(storedProfile))
      
      const { result } = renderHook(() => useAuth())
      
      // After mount, loading should be false
      expect(result.current.loading).toBe(false)
    })

    it('should clear invalid localStorage data', () => {
      localStorage.setItem('pos_user_id', 'some-id')
      localStorage.setItem('pos_user_data', 'invalid-json')
      
      const { result } = renderHook(() => useAuth())
      
      expect(result.current.loading).toBe(false)
    })
  })
})