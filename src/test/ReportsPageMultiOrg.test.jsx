import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import ReportsPage from '../pages/ReportsPage'
import { AuthContext } from '../contexts/AuthContext'
import { OrgContext } from '../contexts/OrgContext'

// Mock the hooks
vi.mock('../hooks/useOrganizations', () => ({
  useOrganizations: () => ({
    organizations: [
      { id: 'org1', name: 'Organization 1' },
      { id: 'org2', name: 'Organization 2' },
      { id: 'org3', name: 'Organization 3' }
    ]
  })
}))

vi.mock('../hooks/useReports', () => ({
  useReports: () => ({
    reports: [],
    loading: false,
    error: null,
    generateReport: vi.fn(),
    calculateSummary: vi.fn(() => ({
      grossSales: 0,
      totalDiscounts: 0,
      netSales: 0,
      transactionCount: 0
    })),
    getCashierBreakdown: vi.fn(() => []),
    getDailyBreakdown: vi.fn(() => [])
  }),
  getDateRange: vi.fn(() => ({
    start: new Date(),
    end: new Date()
  }))
}))

vi.mock('../hooks/useSettings', () => ({
  CURRENCIES: [
    { code: 'USD', symbol: '$' }
  ]
}))

vi.mock('../utils/logger', () => ({
  logUserAction: vi.fn()
}))

vi.mock('../components/ToastContainer', () => ({
  useToast: () => ({
    addToast: vi.fn()
  })
}))

describe('ReportsPage Multi-Organization Selection', () => {
  const mockSuperAdmin = {
    id: 'super1',
    displayName: 'Super Admin',
    role: 'super_admin',
    orgId: null
  }

  const mockRegularAdmin = {
    id: 'admin1',
    displayName: 'Regular Admin',
    role: 'admin',
    orgId: 'org1'
  }

  const mockMultiOrgAdmin = {
    id: 'multiAdmin1',
    displayName: 'Multi Org Admin',
    role: 'admin',
    organizations: [
      { orgId: 'org1', role: 'admin' },
      { orgId: 'org2', role: 'admin' }
    ]
  }

  const wrapper = ({ user, selectedOrgId, children }) => {
    return (
      <BrowserRouter>
        <AuthContext.Provider value={{ 
          userProfile: user, 
          isAdmin: user?.role === 'admin' || user?.role === 'super_admin',
          isSuperAdmin: user?.role === 'super_admin',
          loading: false 
        }}>
          <OrgContext.Provider value={{ 
            selectedOrgId,
            getAdminOrganizations: () => {
              if (user?.role === 'super_admin') return []
              if (user?.organizations) {
                return user.organizations.filter(org => org.role === 'admin')
              }
              return user?.role === 'admin' ? [{ orgId: user.orgId, role: 'admin' }] : []
            }
          }}>
            {children}
          </OrgContext.Provider>
        </AuthContext.Provider>
      </BrowserRouter>
    )
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should show multi-organization selector for super admin', () => {
    render(
      wrapper({ 
        user: mockSuperAdmin, 
        selectedOrgId: 'org1',
        children: <ReportsPage />
      })
    )

    expect(screen.getByText('Select Organizations (optional - leave empty to use current selected organization)')).toBeInTheDocument()
    expect(screen.getByText('Organization 1')).toBeInTheDocument()
    expect(screen.getByText('Organization 2')).toBeInTheDocument()
    expect(screen.getByText('Organization 3')).toBeInTheDocument()
  })

  it('should not show multi-organization selector for regular admin', () => {
    render(
      wrapper({ 
        user: mockRegularAdmin, 
        selectedOrgId: 'org1',
        children: <ReportsPage />
      })
    )

    expect(screen.queryByText('Select Organizations (optional - leave empty to use current selected organization)')).not.toBeInTheDocument()
  })

  it('should allow selecting multiple organizations', async () => {
    render(
      wrapper({ 
        user: mockSuperAdmin, 
        selectedOrgId: 'org1',
        children: <ReportsPage />
      })
    )

    const org2Button = screen.getByText('Organization 2')
    const org3Button = screen.getByText('Organization 3')

    // Initially should not be selected
    expect(org2Button).not.toHaveClass('bg-emerald-600')
    expect(org3Button).not.toHaveClass('bg-emerald-600')

    // Select org2
    fireEvent.click(org2Button)
    expect(org2Button).toHaveClass('bg-emerald-600')

    // Select org3
    fireEvent.click(org3Button)
    expect(org3Button).toHaveClass('bg-emerald-600')

    // Should show selected organizations
    expect(screen.getByText(/Selected:/)).toBeInTheDocument()
    expect(screen.getByText(/Organization 2, Organization 3/)).toBeInTheDocument()
  })

  it('should toggle organization selection', async () => {
    render(
      wrapper({ 
        user: mockSuperAdmin, 
        selectedOrgId: 'org1',
        children: <ReportsPage />
      })
    )

    const org2Button = screen.getByText('Organization 2')

    // Select org2
    fireEvent.click(org2Button)
    expect(org2Button).toHaveClass('bg-emerald-600')

    // Deselect org2
    fireEvent.click(org2Button)
    expect(org2Button).not.toHaveClass('bg-emerald-600')
  })

  it('should show error message when no organizations selected for super admin with no current org', () => {
    render(
      wrapper({ 
        user: mockSuperAdmin, 
        selectedOrgId: null,
        children: <ReportsPage />
      })
    )

    expect(screen.getByText('Select an Organization')).toBeInTheDocument()
    expect(screen.getByText('Please select an organization from the navigation bar or use the multi-organization selector below to generate reports.')).toBeInTheDocument()
  })

  it('should show report options for super admin with current org selected', () => {
    render(
      wrapper({ 
        user: mockSuperAdmin, 
        selectedOrgId: 'org1',
        children: <ReportsPage />
      })
    )

    expect(screen.getByText('Reports')).toBeInTheDocument()
    expect(screen.getByText('Period')).toBeInTheDocument()
    expect(screen.getByText('Report Type')).toBeInTheDocument()
    expect(screen.getByText('Generate Report')).toBeInTheDocument()
  })

  it('should show multi-organization selector for organization admin with multi-org access', () => {
    render(
      wrapper({ 
        user: mockMultiOrgAdmin, 
        selectedOrgId: 'org1',
        children: <ReportsPage />
      })
    )

    expect(screen.getByText('Select Organizations (optional - leave empty to use current selected organization)')).toBeInTheDocument()
    expect(screen.getByText('Organization 1')).toBeInTheDocument()
    expect(screen.getByText('Organization 2')).toBeInTheDocument()
    // Should not show org3 since admin doesn't have access to it
    expect(screen.queryByText('Organization 3')).not.toBeInTheDocument()
  })

  it('should allow multi-org admin to select multiple organizations', async () => {
    render(
      wrapper({ 
        user: mockMultiOrgAdmin, 
        selectedOrgId: 'org1',
        children: <ReportsPage />
      })
    )

    const org2Button = screen.getByText('Organization 2')

    // Initially should not be selected
    expect(org2Button).not.toHaveClass('bg-emerald-600')

    // Select org2
    fireEvent.click(org2Button)
    expect(org2Button).toHaveClass('bg-emerald-600')

    // Should show selected organizations
    expect(screen.getByText(/Selected:/)).toBeInTheDocument()
    // Look for Organization 2 within the selected text paragraph specifically
    const selectedParagraph = screen.getByText(/Selected:/).closest('p')
    expect(selectedParagraph?.textContent).toContain('Organization 2')
  })

  it('should show error message for multi-org admin with no org selected', () => {
    render(
      wrapper({ 
        user: mockMultiOrgAdmin, 
        selectedOrgId: null,
        children: <ReportsPage />
      })
    )

    expect(screen.getByText('Select an Organization')).toBeInTheDocument()
    expect(screen.getByText('Please select an organization from the navigation bar or use the multi-organization selector below to generate reports.')).toBeInTheDocument()
  })
})
