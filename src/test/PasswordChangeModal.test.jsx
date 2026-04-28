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

describe('PasswordChangeModal', () => {
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  const renderWithProviders = (component) => {
    return render(
      <AuthProvider>
        <OrgProvider>
          {component}
        </OrgProvider>
      </AuthProvider>
    )
  }

  it('should render modal for own password change', () => {
    renderWithProviders(<PasswordChangeModal onClose={mockOnClose} />)
    
    expect(screen.getByText('Change Password')).toBeInTheDocument()
    expect(screen.getByText('Update your password')).toBeInTheDocument()
    expect(screen.getByLabelText('Current Password *')).toBeInTheDocument()
    expect(screen.getByLabelText('New Password *')).toBeInTheDocument()
    expect(screen.getByLabelText('Confirm New Password *')).toBeInTheDocument()
  })

  it('should render modal for changing other user password', () => {
    renderWithProviders(<PasswordChangeModal onClose={mockOnClose} targetUserId="user1" />)
    
    expect(screen.getByText('Change Password')).toBeInTheDocument()
    expect(screen.getByText('Change user password')).toBeInTheDocument()
    expect(screen.queryByLabelText('Current Password *')).not.toBeInTheDocument()
    expect(screen.getByLabelText('New Password *')).toBeInTheDocument()
    expect(screen.getByLabelText('Confirm New Password *')).toBeInTheDocument()
  })

  it('should show organization selector for super admin changing other user password', () => {
    renderWithProviders(<PasswordChangeModal onClose={mockOnClose} />)
    
    expect(screen.getByLabelText('Organization')).toBeInTheDocument()
    expect(screen.getByLabelText('User')).toBeInTheDocument()
  })

  it('should validate password requirements', async () => {
    renderWithProviders(<PasswordChangeModal onClose={mockOnClose} />)
    
    const submitButton = screen.getByText('Change Password')
    expect(submitButton).toBeDisabled()
    
    // Fill with short password
    const newPasswordInput = screen.getByLabelText('New Password *')
    const confirmPasswordInput = screen.getByLabelText('Confirm New Password *')
    
    fireEvent.change(newPasswordInput, { target: { value: '123' } })
    fireEvent.change(confirmPasswordInput, { target: { value: '123' } })
    
    // Should still be disabled due to minimum length requirement
    expect(submitButton).toBeDisabled()
    
    // Fill with valid password
    fireEvent.change(newPasswordInput, { target: { value: 'password123' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })
    
    // Button should be enabled
    expect(submitButton).not.toBeDisabled()
  })

  it('should validate password confirmation', async () => {
    renderWithProviders(<PasswordChangeModal onClose={mockOnClose} />)
    
    const newPasswordInput = screen.getByLabelText('New Password *')
    const confirmPasswordInput = screen.getByLabelText('Confirm New Password *')
    
    fireEvent.change(newPasswordInput, { target: { value: 'password123' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'different123' } })
    
    const submitButton = screen.getByText('Change Password')
    expect(submitButton).toBeDisabled()
  })

  it('should show password requirements', () => {
    renderWithProviders(<PasswordChangeModal onClose={mockOnClose} />)
    
    expect(screen.getByText('Password Requirements:')).toBeInTheDocument()
    expect(screen.getByText('Minimum 6 characters long')).toBeInTheDocument()
    expect(screen.getByText('Should be different from current password')).toBeInTheDocument()
    expect(screen.getByText('Must match confirmation password')).toBeInTheDocument()
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
    renderWithProviders(<PasswordChangeModal onClose={mockOnClose} />)
    
    const userSelect = screen.getByLabelText('User')
    const newPasswordInput = screen.getByLabelText('New Password *')
    const confirmPasswordInput = screen.getByLabelText('Confirm New Password *')
    const submitButton = screen.getByText('Change Password')
    
    // Initially disabled
    expect(submitButton).toBeDisabled()
    
    // Select user and fill passwords
    fireEvent.change(userSelect, { target: { value: 'user1' } })
    fireEvent.change(newPasswordInput, { target: { value: 'password123' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })
    
    expect(submitButton).not.toBeDisabled()
  })
})
