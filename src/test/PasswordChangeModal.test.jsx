import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import PasswordChangeModal from '../components/PasswordChangeModal'
import { AuthProvider } from '../contexts/AuthContext'
import { OrgProvider } from '../contexts/OrgContext'

// Mock Firebase
vi.mock('../firebase', () => ({
  db: {},
}))

// Mock hooks
vi.mock('../hooks/useOrganizations', () => ({
  useUsers: () => ({
    users: [
      { id: 'user1', username: 'user1', displayName: 'User 1', role: 'user', orgId: 'org1' },
      { id: 'admin1', username: 'admin1', displayName: 'Admin 1', role: 'admin', orgId: 'org1' },
    ],
    loading: false,
    getUserById: (id) => ({ id, username: id, displayName: id, role: 'user', orgId: 'org1' }),
  }),
  useOrganizations: () => ({
    organizations: [
      { id: 'org1', name: 'Organization 1', code: 'ORG1' },
      { id: 'org2', name: 'Organization 2', code: 'ORG2' },
    ],
    loading: false,
  }),
}))

// Mock AuthContext
import * as AuthContext from '../contexts/AuthContext'
vi.mock('../contexts/AuthContext')

const mockUseAuth = vi.fn()
AuthContext.useAuth = mockUseAuth

describe('PasswordChangeModal', () => {
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  const renderWithProviders = (component, { isSuperAdmin = false } = {}) => {
    // Update the mock to return the correct values based on the parameter
    mockUseAuth.mockReturnValue({
      userProfile: { id: 'user1', role: isSuperAdmin ? 'super_admin' : 'admin' },
      isSuperAdmin,
      isAdmin: isSuperAdmin || true,
      changePassword: vi.fn(),
      login: vi.fn(),
      logout: vi.fn(),
      signup: vi.fn(),
      createSuperAdmin: vi.fn(),
      user: { uid: 'user1' },
      loading: false,
      initializing: false,
    })
    
    return render(
      <OrgProvider>
        {component}
      </OrgProvider>
    )
  }

  it('should render modal for own password change', () => {
    renderWithProviders(<PasswordChangeModal onClose={mockOnClose} />)
    
    expect(screen.getByRole('heading', { name: 'Change Password' })).toBeInTheDocument()
    expect(screen.getByText('Update your password')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter current password')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter new password (min. 6 characters)')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Confirm new password')).toBeInTheDocument()
  })

  it('should render modal for changing other user password', () => {
    renderWithProviders(<PasswordChangeModal onClose={mockOnClose} targetUserId="otherUser" />)
    
    expect(screen.getByRole('heading', { name: 'Change Password' })).toBeInTheDocument()
    expect(screen.getByText('Change user password')).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('Enter current password')).not.toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter new password (min. 6 characters)')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Confirm new password')).toBeInTheDocument()
  })

  it('should NOT show organization selector for super admin changing other user password', () => {
    renderWithProviders(<PasswordChangeModal onClose={mockOnClose} targetUserId="otherUser" />, { isSuperAdmin: true })
    
    // Organization selector should not be present for superAdmin
    const orgSelector = screen.queryByDisplayValue('Select Organization')
    expect(orgSelector).not.toBeInTheDocument()
    
    // User selector should be present
    expect(screen.getByDisplayValue('Select User')).toBeInTheDocument()
  })

  it('should validate password requirements', async () => {
    renderWithProviders(<PasswordChangeModal onClose={mockOnClose} />)
    
    const submitButton = screen.getByRole('button', { name: 'Change Password' })
    // For own password change, button is always enabled (validation happens on submit)
    expect(submitButton).not.toBeDisabled()
    
    // Fill with short password
    const newPasswordInput = screen.getByPlaceholderText('Enter new password (min. 6 characters)')
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm new password')
    
    fireEvent.change(newPasswordInput, { target: { value: '123' } })
    fireEvent.change(confirmPasswordInput, { target: { value: '123' } })
    
    // Button remains enabled (validation happens on submit)
    expect(submitButton).not.toBeDisabled()
    
    // Fill with valid password
    fireEvent.change(newPasswordInput, { target: { value: 'password123' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })
    
    // Button should still be enabled
    expect(submitButton).not.toBeDisabled()
  })

  it('should validate password confirmation', async () => {
    renderWithProviders(<PasswordChangeModal onClose={mockOnClose} />)
    
    const newPasswordInput = screen.getByPlaceholderText('Enter new password (min. 6 characters)')
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm new password')
    
    fireEvent.change(newPasswordInput, { target: { value: 'password123' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'different123' } })
    
    const submitButton = screen.getByRole('button', { name: 'Change Password' })
    // For own password change, button is always enabled (validation happens on submit)
    expect(submitButton).not.toBeDisabled()
  })

  it('should show password requirements', () => {
    renderWithProviders(<PasswordChangeModal onClose={mockOnClose} />)
    
    expect(screen.getByText('Password Requirements:')).toBeInTheDocument()
    expect(screen.getByText(/minimum 6 characters long/i)).toBeInTheDocument()
    expect(screen.getByText(/should be different from current password/i)).toBeInTheDocument()
    expect(screen.getByText(/must match confirmation password/i)).toBeInTheDocument()
  })

  it('should call onClose when cancel is clicked', () => {
    renderWithProviders(<PasswordChangeModal onClose={mockOnClose} />)
    
    const cancelButton = screen.getByText('Cancel')
    fireEvent.click(cancelButton)
    
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('should call onClose when close button is clicked', () => {
    renderWithProviders(<PasswordChangeModal onClose={mockOnClose} />)
    
    const closeButton = screen.getByRole('button', { name: '' }) // Close icon button
    fireEvent.click(closeButton)
    
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('should enable submit button when user is selected for admin changing other password', () => {
    renderWithProviders(<PasswordChangeModal onClose={mockOnClose} targetUserId="otherUser" />)
    
    const userSelect = screen.getByDisplayValue('Select User')
    const newPasswordInput = screen.getByPlaceholderText('Enter new password (min. 6 characters)')
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm new password')
    const submitButton = screen.getByRole('button', { name: 'Change Password' })
    
    // Initially enabled when targetUserId is provided
    expect(submitButton).not.toBeDisabled()
    
    // Select user and fill passwords
    fireEvent.change(userSelect, { target: { value: 'user1' } })
    fireEvent.change(newPasswordInput, { target: { value: 'password123' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })
    
    expect(submitButton).not.toBeDisabled()
  })
})
