import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import SuperAdminPage from '../pages/SuperAdminPage'
import { AuthProvider } from '../contexts/AuthContext'
import { OrgProvider } from '../contexts/OrgContext'

// Mock Firebase
vi.mock('../firebase', () => ({
  db: {},
}))

// Mock useToast
vi.mock('../components/ToastContainer', () => ({
  useToast: () => ({
    addToast: vi.fn()
  })
}))

// Mock useAuth
vi.mock('../contexts/AuthContext', () => ({
  AuthProvider: ({ children }) => children,
  useAuth: () => ({
    userProfile: {
      id: 'super_admin_1',
      displayName: 'Super Admin',
      role: 'super_admin'
    },
    isSuperAdmin: true,
    loading: false
  })
}))

// Mock useOrganizations
vi.mock('../hooks/useOrganizations', () => ({
  useOrganizations: () => ({
    organizations: [
      { id: 'org1', name: 'Organization 1', description: 'First org' },
      { id: 'org2', name: 'Organization 2', description: 'Second org' }
    ],
    createOrganization: vi.fn(),
    updateOrganization: vi.fn(),
    deleteOrganization: vi.fn(),
    loading: false
  }),
  useOrgUsers: () => ({
    users: [],
    loading: false,
    updateUserRole: vi.fn(),
    removeUser: vi.fn(),
    refetch: vi.fn()
  })
}))

// Mock logger
vi.mock('../utils/logger', () => ({
  logUserAction: vi.fn(),
  LOG_TYPES: {
    ORG_UPDATE: 'ORG_UPDATE'
  }
}))

// Mock MultiOrgUserManager
vi.mock('../components/MultiOrgUserManager', () => ({
  default: () => <div>MultiOrgUserManager Component</div>
}))

// Mock OrgUsersList
vi.mock('../components/OrgUsersList', () => ({
  default: () => <div>OrgUsersList Component</div>
}))

// Mock PasswordChangeModal
vi.mock('../components/PasswordChangeModal', () => ({
  default: () => <div>PasswordChangeModal Component</div>
}))

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <OrgProvider>
          {component}
        </OrgProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

describe('SuperAdminPage - Organization Edit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Organization Edit Functionality', () => {
    it('should render edit button for each organization', () => {
      renderWithProviders(<SuperAdminPage />)
      
      // Switch to Organizations tab
      const orgTab = screen.getByText('Organizations')
      fireEvent.click(orgTab)
      
      expect(screen.getByText('Edit')).toBeInTheDocument()
      expect(screen.getByText('Delete')).toBeInTheDocument()
    })

    it('should show edit form when edit button is clicked', async () => {
      renderWithProviders(<SuperAdminPage />)
      
      // Switch to Organizations tab
      const orgTab = screen.getByText('Organizations')
      fireEvent.click(orgTab)
      
      // Click edit button
      const editButton = screen.getByText('Edit')
      fireEvent.click(editButton)
      
      await waitFor(() => {
        expect(screen.getByText('Edit Organization: org1')).toBeInTheDocument()
        expect(screen.getByLabelText('Organization Name')).toBeInTheDocument()
        expect(screen.getByLabelText('Description')).toBeInTheDocument()
        expect(screen.getByText('Update')).toBeInTheDocument()
        expect(screen.getByText('Cancel')).toBeInTheDocument()
      })
    })

    it('should pre-fill edit form with current organization data', async () => {
      renderWithProviders(<SuperAdminPage />)
      
      // Switch to Organizations tab
      const orgTab = screen.getByText('Organizations')
      fireEvent.click(orgTab)
      
      // Click edit button
      const editButton = screen.getByText('Edit')
      fireEvent.click(editButton)
      
      await waitFor(() => {
        const nameInput = screen.getByLabelText('Organization Name')
        const descInput = screen.getByLabelText('Description')
        
        expect(nameInput.value).toBe('Organization 1')
        expect(descInput.value).toBe('First org')
      })
    })

    it('should allow editing organization name and description', async () => {
      renderWithProviders(<SuperAdminPage />)
      
      // Switch to Organizations tab
      const orgTab = screen.getByText('Organizations')
      fireEvent.click(orgTab)
      
      // Click edit button
      const editButton = screen.getByText('Edit')
      fireEvent.click(editButton)
      
      await waitFor(() => {
        const nameInput = screen.getByLabelText('Organization Name')
        const descInput = screen.getByLabelText('Description')
        
        // Change values
        fireEvent.change(nameInput, { target: { value: 'Updated Organization Name' } })
        fireEvent.change(descInput, { target: { value: 'Updated description' } })
        
        expect(nameInput.value).toBe('Updated Organization Name')
        expect(descInput.value).toBe('Updated description')
      })
    })

    it('should hide edit form when cancel button is clicked', async () => {
      renderWithProviders(<SuperAdminPage />)
      
      // Switch to Organizations tab
      const orgTab = screen.getByText('Organizations')
      fireEvent.click(orgTab)
      
      // Click edit button
      const editButton = screen.getByText('Edit')
      fireEvent.click(editButton)
      
      await waitFor(() => {
        expect(screen.getByText('Edit Organization: org1')).toBeInTheDocument()
      })
      
      // Click cancel button
      const cancelButton = screen.getByText('Cancel')
      fireEvent.click(cancelButton)
      
      await waitFor(() => {
        expect(screen.queryByText('Edit Organization: org1')).not.toBeInTheDocument()
      })
    })

    it('should toggle edit button text between Edit and Cancel', async () => {
      renderWithProviders(<SuperAdminPage />)
      
      // Switch to Organizations tab
      const orgTab = screen.getByText('Organizations')
      fireEvent.click(orgTab)
      
      const editButton = screen.getByText('Edit')
      expect(editButton.textContent).toBe('Edit')
      
      // Click edit button
      fireEvent.click(editButton)
      
      await waitFor(() => {
        expect(editButton.textContent).toBe('Cancel')
      })
      
      // Click cancel button
      fireEvent.click(editButton)
      
      await waitFor(() => {
        expect(editButton.textContent).toBe('Edit')
      })
    })

    it('should validate that organization name is required', async () => {
      renderWithProviders(<SuperAdminPage />)
      
      // Switch to Organizations tab
      const orgTab = screen.getByText('Organizations')
      fireEvent.click(orgTab)
      
      // Click edit button
      const editButton = screen.getByText('Edit')
      fireEvent.click(editButton)
      
      await waitFor(() => {
        const nameInput = screen.getByLabelText('Organization Name')
        const updateButton = screen.getByText('Update')
        
        // Clear name field
        fireEvent.change(nameInput, { target: { value: '   ' } }) // spaces only
        
        // Try to submit
        fireEvent.click(updateButton)
        
        // Form should not submit (no error message shown, but update shouldn't happen)
        expect(screen.getByText('Edit Organization: org1')).toBeInTheDocument()
      })
    })
  })

  describe('Responsive Design', () => {
    it('should render properly on mobile viewports', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })
      
      renderWithProviders(<SuperAdminPage />)
      
      expect(screen.getByText('Super Admin')).toBeInTheDocument()
      expect(screen.getByText('Organizations')).toBeInTheDocument()
      expect(screen.getByText('Users')).toBeInTheDocument()
    })

    it('should render properly on tablet viewports', () => {
      // Mock tablet viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      })
      
      renderWithProviders(<SuperAdminPage />)
      
      expect(screen.getByText('Super Admin')).toBeInTheDocument()
      expect(screen.getByText('Organizations')).toBeInTheDocument()
      expect(screen.getByText('Users')).toBeInTheDocument()
    })

    it('should render properly on desktop viewports', () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      })
      
      renderWithProviders(<SuperAdminPage />)
      
      expect(screen.getByText('Super Admin')).toBeInTheDocument()
      expect(screen.getByText('Organizations')).toBeInTheDocument()
      expect(screen.getByText('Users')).toBeInTheDocument()
    })
  })

  describe('Tab Navigation', () => {
    it('should switch between Organizations and Users tabs', () => {
      renderWithProviders(<SuperAdminPage />)
      
      // Should start on Organizations tab
      expect(screen.getByText('Organizations')).toBeInTheDocument()
      
      // Click Users tab
      const usersTab = screen.getByText('Users')
      fireEvent.click(usersTab)
      
      expect(screen.getByText('User Management')).toBeInTheDocument()
      
      // Click Organizations tab again
      const orgTab = screen.getByText('Organizations')
      fireEvent.click(orgTab)
      
      expect(screen.getByText('Organizations')).toBeInTheDocument()
    })

    it('should show active tab styling', () => {
      renderWithProviders(<SuperAdminPage />)
      
      const orgTab = screen.getByText('Organizations')
      const usersTab = screen.getByText('Users')
      
      // Organizations tab should be active initially
      expect(orgTab).toHaveClass('border-emerald-500', 'text-emerald-600')
      expect(usersTab).toHaveClass('border-transparent', 'text-gray-500')
      
      // Click Users tab
      fireEvent.click(usersTab)
      
      expect(usersTab).toHaveClass('border-emerald-500', 'text-emerald-600')
      expect(orgTab).toHaveClass('border-transparent', 'text-gray-500')
    })
  })
})
