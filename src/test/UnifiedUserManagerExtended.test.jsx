import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import UnifiedUserManager from '../components/UnifiedUserManager'

// Mock Firebase
vi.mock('../firebase', () => ({
  db: {},
}))

// Mock contexts and hooks
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    userProfile: { id: 'test-admin', displayName: 'Test Admin' },
    isSuperAdmin: true,
  }),
}))

vi.mock('../hooks/useOrganizations', () => ({
  useOrganizations: () => ({
    organizations: [
      { id: 'org1', name: 'Organization 1' },
      { id: 'org2', name: 'Organization 2' },
    ],
  }),
}))

vi.mock('../components/ToastContainer', () => ({
  useToast: () => ({
    addToast: vi.fn(),
  }),
}))

vi.mock('../utils/logger', () => ({
  logUserAction: vi.fn(),
  LOG_TYPES: {
    USER_CREATE: 'user_create',
    USER_UPDATE: 'user_update',
    USER_DELETE: 'user_delete',
  },
}))

// Mock PasswordChangeModal
vi.mock('../components/PasswordChangeModal', () => ({
  default: ({ onClose, targetUserId }) => (
    <div data-testid="password-modal">
      <button onClick={onClose}>Close</button>
      <span data-testid="target-user-id">{targetUserId}</span>
    </div>
  ),
}))

// Mock Firestore
const mockCollection = vi.fn()
const mockQuery = vi.fn()
const mockWhere = vi.fn()
const mockGetDocs = vi.fn()
const mockDoc = vi.fn()
const mockSetDoc = vi.fn()
const mockDeleteDoc = vi.fn()
const mockServerTimestamp = vi.fn()

vi.mock('firebase/firestore', () => ({
  collection: mockCollection,
  query: mockQuery,
  where: mockWhere,
  getDocs: mockGetDocs,
  doc: mockDoc,
  setDoc: mockSetDoc,
  deleteDoc: mockDeleteDoc,
  serverTimestamp: mockServerTimestamp,
}))

describe('UnifiedUserManager - Extended Features', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockServerTimestamp.mockReturnValue(new Date())
  })

  describe('User Editing', () => {
    test('opens edit modal when Edit button is clicked', async () => {
      const mockUsers = [
        {
          id: 'user1',
          username: 'testuser',
          displayName: 'Test User',
          email: 'test@example.com',
          organizations: [],
        },
      ]

      mockGetDocs.mockResolvedValue({
        docs: mockUsers.map(user => ({
          id: user.id,
          data: () => user,
        })),
        map: vi.fn((callback) => mockUsers),
      })

      render(<UnifiedUserManager />)
      
      // Click Edit button
      const editButton = screen.getByText('Edit')
      fireEvent.click(editButton)
      
      // Check if edit modal appears
      await waitFor(() => {
        expect(screen.getByText('Edit User')).toBeInTheDocument()
        expect(screen.getByDisplayValue('testuser')).toBeInTheDocument()
        expect(screen.getByDisplayValue('Test User')).toBeInTheDocument()
        expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument()
      })
    })

    test('updates user information successfully', async () => {
      const mockUsers = [
        {
          id: 'user1',
          username: 'testuser',
          displayName: 'Test User',
          email: 'test@example.com',
          organizations: [],
        },
      ]

      mockGetDocs.mockResolvedValue({
        docs: mockUsers.map(user => ({
          id: user.id,
          data: () => user,
        })),
        map: vi.fn((callback) => mockUsers),
      })

      mockSetDoc.mockResolvedValue()

      render(<UnifiedUserManager />)
      
      // Click Edit button
      fireEvent.click(screen.getByText('Edit'))
      
      await waitFor(() => {
        expect(screen.getByText('Edit User')).toBeInTheDocument()
      })
      
      // Change display name and email
      const displayNameInput = screen.getByDisplayValue('Test User')
      const emailInput = screen.getByDisplayValue('test@example.com')
      
      fireEvent.change(displayNameInput, { target: { value: 'Updated User' } })
      fireEvent.change(emailInput, { target: { value: 'updated@example.com' } })
      
      // Submit form
      fireEvent.click(screen.getByText('Update User'))
      
      await waitFor(() => {
        expect(mockSetDoc).toHaveBeenCalledWith(
          expect.any(Object),
          expect.objectContaining({
            displayName: 'Updated User',
            email: 'updated@example.com',
          }),
          { merge: true }
        )
      })
    })

    test('validates required display name field', async () => {
      const mockUsers = [
        {
          id: 'user1',
          username: 'testuser',
          displayName: 'Test User',
          email: 'test@example.com',
          organizations: [],
        },
      ]

      mockGetDocs.mockResolvedValue({
        docs: mockUsers.map(user => ({
          id: user.id,
          data: () => user,
        })),
        map: vi.fn((callback) => mockUsers),
      })

      render(<UnifiedUserManager />)
      
      // Click Edit button
      fireEvent.click(screen.getByText('Edit'))
      
      await waitFor(() => {
        expect(screen.getByText('Edit User')).toBeInTheDocument()
      })
      
      // Clear display name
      const displayNameInput = screen.getByDisplayValue('Test User')
      fireEvent.change(displayNameInput, { target: { value: '' } })
      
      // Submit form
      fireEvent.click(screen.getByText('Update User'))
      
      await waitFor(() => {
        expect(screen.getByText('Display name is required')).toBeInTheDocument()
      })
    })

    test('closes edit modal when Cancel is clicked', async () => {
      const mockUsers = [
        {
          id: 'user1',
          username: 'testuser',
          displayName: 'Test User',
          email: 'test@example.com',
          organizations: [],
        },
      ]

      mockGetDocs.mockResolvedValue({
        docs: mockUsers.map(user => ({
          id: user.id,
          data: () => user,
        })),
        map: vi.fn((callback) => mockUsers),
      })

      render(<UnifiedUserManager />)
      
      // Click Edit button
      fireEvent.click(screen.getByText('Edit'))
      
      await waitFor(() => {
        expect(screen.getByText('Edit User')).toBeInTheDocument()
      })
      
      // Click Cancel
      fireEvent.click(screen.getByText('Cancel'))
      
      await waitFor(() => {
        expect(screen.queryByText('Edit User')).not.toBeInTheDocument()
      })
    })

    test('disables username field in edit form', async () => {
      const mockUsers = [
        {
          id: 'user1',
          username: 'testuser',
          displayName: 'Test User',
          email: 'test@example.com',
          organizations: [],
        },
      ]

      mockGetDocs.mockResolvedValue({
        docs: mockUsers.map(user => ({
          id: user.id,
          data: () => user,
        })),
        map: vi.fn((callback) => mockUsers),
      })

      render(<UnifiedUserManager />)
      
      // Click Edit button
      fireEvent.click(screen.getByText('Edit'))
      
      await waitFor(() => {
        const usernameInput = screen.getByDisplayValue('testuser')
        expect(usernameInput).toBeDisabled()
        expect(screen.getByText('Username cannot be changed')).toBeInTheDocument()
      })
    })
  })

  describe('Password Change', () => {
    test('opens password modal when Password button is clicked', async () => {
      const mockUsers = [
        {
          id: 'user1',
          username: 'testuser',
          displayName: 'Test User',
          email: 'test@example.com',
          organizations: [],
        },
      ]

      mockGetDocs.mockResolvedValue({
        docs: mockUsers.map(user => ({
          id: user.id,
          data: () => user,
        })),
        map: vi.fn((callback) => mockUsers),
      })

      render(<UnifiedUserManager />)
      
      // Click Password button
      const passwordButton = screen.getByText('Password')
      fireEvent.click(passwordButton)
      
      // Check if password modal appears
      await waitFor(() => {
        expect(screen.getByTestId('password-modal')).toBeInTheDocument()
        expect(screen.getByTestId('target-user-id')).toHaveTextContent('user1')
      })
    })

    test('closes password modal when modal calls onClose', async () => {
      const mockUsers = [
        {
          id: 'user1',
          username: 'testuser',
          displayName: 'Test User',
          email: 'test@example.com',
          organizations: [],
        },
      ]

      mockGetDocs.mockResolvedValue({
        docs: mockUsers.map(user => ({
          id: user.id,
          data: () => user,
        })),
        map: vi.fn((callback) => mockUsers),
      })

      render(<UnifiedUserManager />)
      
      // Click Password button
      fireEvent.click(screen.getByText('Password'))
      
      await waitFor(() => {
        expect(screen.getByTestId('password-modal')).toBeInTheDocument()
      })
      
      // Click Close button in modal
      fireEvent.click(screen.getByText('Close'))
      
      await waitFor(() => {
        expect(screen.queryByTestId('password-modal')).not.toBeInTheDocument()
      })
    })
  })

  describe('Action Buttons', () => {
    test('shows all action buttons for each user', async () => {
      const mockUsers = [
        {
          id: 'user1',
          username: 'testuser',
          displayName: 'Test User',
          email: 'test@example.com',
          organizations: [],
        },
        {
          id: 'user2',
          username: 'user2',
          displayName: 'User Two',
          email: null,
          organizations: [],
        },
      ]

      mockGetDocs.mockResolvedValue({
        docs: mockUsers.map(user => ({
          id: user.id,
          data: () => user,
        })),
        map: vi.fn((callback) => mockUsers),
      })

      render(<UnifiedUserManager />)
      
      // Should have Edit, Password, and Delete buttons for each user
      const editButtons = screen.getAllByText('Edit')
      const passwordButtons = screen.getAllByText('Password')
      const deleteButtons = screen.getAllByText('Delete')
      
      expect(editButtons).toHaveLength(2)
      expect(passwordButtons).toHaveLength(2)
      expect(deleteButtons).toHaveLength(2)
    })

    test('disables Edit button for current user (non-super admin)', async () => {
      // Mock non-super admin
      vi.mock('../contexts/AuthContext', () => ({
        useAuth: () => ({
          userProfile: { id: 'user1', displayName: 'Test User' },
          isSuperAdmin: false,
        }),
      }))

      const mockUsers = [
        {
          id: 'user1',
          username: 'testuser',
          displayName: 'Test User',
          email: 'test@example.com',
          organizations: [],
        },
        {
          id: 'user2',
          username: 'user2',
          displayName: 'User Two',
          email: null,
          organizations: [],
        },
      ]

      mockGetDocs.mockResolvedValue({
        docs: mockUsers.map(user => ({
          id: user.id,
          data: () => user,
        })),
        map: vi.fn((callback) => mockUsers),
      })

      render(<UnifiedUserManager />)
      
      const editButtons = screen.getAllByText('Edit')
      expect(editButtons[0]).toBeDisabled() // Current user
      expect(editButtons[1]).not.toBeDisabled() // Other user
    })

    test('disables Delete button for current user', async () => {
      const mockUsers = [
        {
          id: 'test-admin',
          username: 'admin',
          displayName: 'Test Admin',
          email: 'admin@example.com',
          organizations: [],
        },
        {
          id: 'user2',
          username: 'user2',
          displayName: 'User Two',
          email: null,
          organizations: [],
        },
      ]

      mockGetDocs.mockResolvedValue({
        docs: mockUsers.map(user => ({
          id: user.id,
          data: () => user,
        })),
        map: vi.fn((callback) => mockUsers),
      })

      render(<UnifiedUserManager />)
      
      const deleteButtons = screen.getAllByText('Delete')
      expect(deleteButtons[0]).toBeDisabled() // Current user
      expect(deleteButtons[1]).not.toBeDisabled() // Other user
    })
  })

  describe('User Update Logging', () => {
    test('logs user update action when user is updated', async () => {
      const mockUsers = [
        {
          id: 'user1',
          username: 'testuser',
          displayName: 'Test User',
          email: 'test@example.com',
          organizations: [],
        },
      ]

      mockGetDocs.mockResolvedValue({
        docs: mockUsers.map(user => ({
          id: user.id,
          data: () => user,
        })),
        map: vi.fn((callback) => mockUsers),
      })

      mockSetDoc.mockResolvedValue()

      const { logUserAction } = require('../utils/logger')

      render(<UnifiedUserManager />)
      
      // Click Edit button
      fireEvent.click(screen.getByText('Edit'))
      
      await waitFor(() => {
        expect(screen.getByText('Edit User')).toBeInTheDocument()
      })
      
      // Change display name
      const displayNameInput = screen.getByDisplayValue('Test User')
      fireEvent.change(displayNameInput, { target: { value: 'Updated User' } })
      
      // Submit form
      fireEvent.click(screen.getByText('Update User'))
      
      await waitFor(() => {
        expect(logUserAction).toHaveBeenCalledWith(
          'user_update',
          expect.stringContaining('Updated user: testuser'),
          expect.any(Object),
          null,
          expect.objectContaining({
            userId: 'user1',
            username: 'testuser',
            oldDisplayName: 'Test User',
            newDisplayName: 'Updated User',
          })
        )
      })
    })
  })
})
