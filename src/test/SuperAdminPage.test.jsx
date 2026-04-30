import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import SuperAdminPage from '../pages/SuperAdminPage'
import { AuthProvider } from '../contexts/AuthContext'
import { OrgProvider } from '../contexts/OrgContext'
import { collection, doc, setDoc, serverTimestamp, query, where, getDocs, updateDoc, deleteDoc } from 'firebase/firestore'

// Mock Firebase
vi.mock('../firebase', () => ({
  db: {},
}))

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => ({
    where: vi.fn(() => ({
      get: vi.fn(() => Promise.resolve({ empty: true, docs: [] }))
    })),
    get: vi.fn(() => Promise.resolve({ docs: [] }))
  })),
  doc: vi.fn(),
  setDoc: vi.fn(() => Promise.resolve()),
  serverTimestamp: vi.fn(() => new Date()),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(() => Promise.resolve({ empty: true, docs: [] })),
  updateDoc: vi.fn(() => Promise.resolve()),
  deleteDoc: vi.fn(() => Promise.resolve())
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
    // Reset mock implementations
    collection.mockReturnValue({
      where: vi.fn(() => ({
        get: vi.fn(() => Promise.resolve({ empty: true, docs: [] }))
      })),
      get: vi.fn(() => Promise.resolve({ docs: [] }))
    })
  })

  describe('Organization Edit Functionality', () => {
    it('should render edit button for each organization', () => {
      renderWithProviders(<SuperAdminPage />)
      
      // Switch to Organizations tab
      const orgTab = screen.getByRole('button', { name: 'Organizations' })
      fireEvent.click(orgTab)
      
      expect(screen.getAllByText('Edit')).toHaveLength(2) // Two Edit buttons (one for each org)
      expect(screen.getAllByText('Delete')).toHaveLength(2) // Two Delete buttons (one for each org)
    })

    it('should show edit form when edit button is clicked', async () => {
      renderWithProviders(<SuperAdminPage />)
      
      // Switch to Organizations tab
      const orgTab = screen.getByRole('button', { name: 'Organizations' })
      fireEvent.click(orgTab)
      
      // Click edit button
      const editButton = screen.getAllByText('Edit')[0] // Get first Edit button
      fireEvent.click(editButton)
      
      const nameInput = await screen.findByLabelText('Organization Name', {}, { timeout: 3000 })
      const descInput = await screen.findByLabelText('Description', {}, { timeout: 3000 })
      const updateButton = await screen.findByText('Update', {}, { timeout: 3000 })
      // Wait for the form to appear, then get the Cancel button from the form
      await screen.findByLabelText('Organization Name', {}, { timeout: 3000 })
      const cancelButton = screen.getAllByText('Cancel')[1] // Second Cancel button is in the edit form
      
      expect(nameInput).toBeInTheDocument()
      expect(descInput).toBeInTheDocument()
      expect(updateButton).toBeInTheDocument()
      expect(cancelButton).toBeInTheDocument()
    })

    it('should pre-fill edit form with current organization data', async () => {
      renderWithProviders(<SuperAdminPage />)
      
      // Switch to Organizations tab
      const orgTab = screen.getByRole('button', { name: 'Organizations' })
      fireEvent.click(orgTab)
      
      // Click edit button
      const editButton = screen.getAllByText('Edit')[0] // Get first Edit button
      fireEvent.click(editButton)
      
      const nameInput = await screen.findByLabelText('Organization Name', {}, { timeout: 3000 })
      const descInput = await screen.findByLabelText('Description', {}, { timeout: 3000 })
      
      expect(nameInput.value).toBe('Organization 1')
      expect(descInput.value).toBe('First org')
    })

    it('should allow editing organization name and description', async () => {
      renderWithProviders(<SuperAdminPage />)
      
      // Switch to Organizations tab
      const orgTab = screen.getByRole('button', { name: 'Organizations' })
      fireEvent.click(orgTab)
      
      // Click edit button
      const editButton = screen.getAllByText('Edit')[0] // Get first Edit button
      fireEvent.click(editButton)
      
      const nameInput = await screen.findByLabelText('Organization Name', {}, { timeout: 3000 })
      const descInput = await screen.findByLabelText('Description', {}, { timeout: 3000 })
      
      // Change values
      fireEvent.change(nameInput, { target: { value: 'Updated Organization Name' } })
      fireEvent.change(descInput, { target: { value: 'Updated description' } })
      
      expect(nameInput.value).toBe('Updated Organization Name')
      expect(descInput.value).toBe('Updated description')
    })

    it('should hide edit form when cancel button is clicked', async () => {
      renderWithProviders(<SuperAdminPage />)
      
      // Switch to Organizations tab
      const orgTab = screen.getByRole('button', { name: 'Organizations' })
      fireEvent.click(orgTab)
      
      // Click edit button
      const editButton = screen.getAllByText('Edit')[0] // Get first Edit button
      fireEvent.click(editButton)
      
      await screen.findByLabelText('Organization Name', {}, { timeout: 3000 })
      
      // Click cancel button in the edit form (get all Cancel buttons and click the second one which is in the form)
      const cancelButton = screen.getAllByText('Cancel')[1] // Second Cancel button is in the edit form
      fireEvent.click(cancelButton)
      
      await waitFor(() => {
        expect(screen.queryByLabelText('Organization Name')).not.toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('should toggle edit button text between Edit and Cancel', async () => {
      renderWithProviders(<SuperAdminPage />)
      
      // Switch to Organizations tab
      const orgTab = screen.getByRole('button', { name: 'Organizations' })
      fireEvent.click(orgTab)
      
      const editButton = screen.getAllByText('Edit')[0] // Get first Edit button
      expect(editButton.textContent).toBe('Edit')
      
      // Click edit button
      fireEvent.click(editButton)
      
      await waitFor(() => {
        expect(editButton.textContent).toBe('Cancel')
      }, { timeout: 3000 })
      
      // Click the same button (now showing Cancel)
      fireEvent.click(editButton)
      
      await waitFor(() => {
        expect(editButton.textContent).toBe('Edit')
      }, { timeout: 3000 })
    })

    it('should validate that organization name is required', async () => {
      renderWithProviders(<SuperAdminPage />)
      
      // Switch to Organizations tab
      const orgTab = screen.getByRole('button', { name: 'Organizations' })
      fireEvent.click(orgTab)
      
      // Click edit button
      const editButton = screen.getAllByText('Edit')[0] // Get first Edit button
      fireEvent.click(editButton)
      
      // Wait for the edit form to appear
      await screen.findByLabelText('Organization Name', {}, { timeout: 3000 })
      await screen.findByText('Update', {}, { timeout: 3000 })
      
      const nameInput = screen.getByLabelText('Organization Name')
      const updateButton = screen.getByText('Update')
      
      // Clear name field
      fireEvent.change(nameInput, { target: { value: '   ' } }) // spaces only
      
      // Try to submit - the form should prevent submission due to validation
      fireEvent.click(updateButton)
      
      // Form should still be visible (validation prevented submission)
      // Wait a bit to ensure the validation logic had time to execute
      await screen.findByLabelText('Organization Name', {}, { timeout: 1000 })
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
      expect(screen.getByRole('button', { name: 'Organizations' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Users' })).toBeInTheDocument()
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
      expect(screen.getByRole('button', { name: 'Organizations' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Users' })).toBeInTheDocument()
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
      expect(screen.getByRole('button', { name: 'Organizations' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Users' })).toBeInTheDocument()
    })
  })

  describe('Tab Navigation', () => {
    it('should switch between Organizations and Users tabs', () => {
      renderWithProviders(<SuperAdminPage />)
      
      // Should start on Organizations tab
      expect(screen.getByRole('button', { name: 'Organizations' })).toBeInTheDocument()
      
      // Click Users tab
      const usersTab = screen.getByRole('button', { name: 'Users' })
      fireEvent.click(usersTab)
      
      expect(screen.getByText('User Management')).toBeInTheDocument()
      
      // Click Organizations tab again
      const orgTab = screen.getByRole('button', { name: 'Organizations' })
      fireEvent.click(orgTab)
      
      expect(screen.getByRole('button', { name: 'Organizations' })).toBeInTheDocument()
    })

    it('should show active tab styling', () => {
      renderWithProviders(<SuperAdminPage />)
      
      // Use role to find button elements specifically
      const orgTab = screen.getByRole('button', { name: 'Organizations' })
      const usersTab = screen.getByRole('button', { name: 'Users' })
      
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
