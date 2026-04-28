import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { AuthProvider } from '../contexts/AuthContext'
import { OrgProvider } from '../contexts/OrgContext'

// Mock hooks
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    userProfile: { id: 'user-1', displayName: 'Test User', role: 'user', orgId: 'org-1' },
    logout: vi.fn().mockResolvedValue(undefined),
    isAdmin: false,
    isSuperAdmin: false,
  }),
}))

vi.mock('../contexts/OrgContext', () => ({
  useOrg: () => ({
    selectedOrgId: null,
    setSelectedOrgId: vi.fn(),
  }),
}))

vi.mock('../hooks/useOrganizations', () => ({
  useOrganizations: () => ({
    organizations: [
      { id: 'org-1', name: 'Test Organization' },
    ],
  }),
}))

const renderWithProviders = (ui) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <OrgProvider>
          {ui}
        </OrgProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

describe('Navbar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render the brand name', () => {
      renderWithProviders(<Navbar />)
      expect(screen.getByText('MG POS')).toBeInTheDocument()
    })

    it('should render navigation links', () => {
      renderWithProviders(<Navbar />)
      expect(screen.getByText('POS')).toBeInTheDocument()
    })
  })

  describe('User info', () => {
    it('should display user display name', () => {
      renderWithProviders(<Navbar />)
      expect(screen.getByText('Test User')).toBeInTheDocument()
    })

    it('should display user role', () => {
      renderWithProviders(<Navbar />)
      expect(screen.getByText('user')).toBeInTheDocument()
    })
  })

  describe('Logout', () => {
    it('should have logout button', () => {
      renderWithProviders(<Navbar />)
      expect(screen.getByTitle('Sign out')).toBeInTheDocument()
    })
  })

  describe('Organization for non-super admin', () => {
    it('should display organization name for regular users', () => {
      renderWithProviders(<Navbar />)
      // Should show org name or ID since user has orgId
      expect(screen.getByText(/org-1|Test Organization/)).toBeInTheDocument()
    })
  })

  describe('Super admin view', () => {
    it('should show org selector for super admin', () => {
      // Mock super admin
      vi.mock('../contexts/AuthContext', () => ({
        useAuth: () => ({
          userProfile: { id: 'user-1', displayName: 'Super Admin', role: 'super_admin', orgId: null },
          logout: vi.fn().mockResolvedValue(undefined),
          isAdmin: true,
          isSuperAdmin: true,
        }),
      }))
      
      renderWithProviders(<Navbar />)
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })
  })

  describe('Admin view', () => {
    it('should show Settings link for admins', () => {
      vi.mock('../contexts/AuthContext', () => ({
        useAuth: () => ({
          userProfile: { id: 'user-1', displayName: 'Admin User', role: 'admin', orgId: 'org-1' },
          logout: vi.fn().mockResolvedValue(undefined),
          isAdmin: true,
          isSuperAdmin: false,
        }),
      }))
      
      renderWithProviders(<Navbar />)
      expect(screen.getByText('Settings')).toBeInTheDocument()
    })

    it('should show Reports link for admins', () => {
      vi.mock('../contexts/AuthContext', () => ({
        useAuth: () => ({
          userProfile: { id: 'user-1', displayName: 'Admin User', role: 'admin', orgId: 'org-1' },
          logout: vi.fn().mockResolvedValue(undefined),
          isAdmin: true,
          isSuperAdmin: false,
        }),
      }))
      
      renderWithProviders(<Navbar />)
      expect(screen.getByText('Reports')).toBeInTheDocument()
    })
  })
})