import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, beforeEach, describe, it, expect } from 'vitest'
import UnifiedUserManager from '../components/UnifiedUserManager'
import { collection, query, where, getDocs, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'

// Mock Firebase
vi.mock('../firebase', () => ({
  db: {},
}))

// Mock Firestore
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn((...args) => args), // Return the arguments passed to query
  where: vi.fn((...args) => args), // Return the arguments passed to where
  getDocs: vi.fn(),
  doc: vi.fn(() => ({ id: 'mock-doc-id' })),
  setDoc: vi.fn(),
  deleteDoc: vi.fn(),
  serverTimestamp: vi.fn(),
}))

// Mock contexts and hooks - must be at top level
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
    USER_DELETE: 'user_delete',
  },
}))

describe('UnifiedUserManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    serverTimestamp.mockReturnValue(new Date())
  })

  test('renders user management interface', () => {
    // Mock empty users list
    getDocs.mockResolvedValue({
      docs: [],
      forEach: vi.fn(),
    })

    render(<UnifiedUserManager />)
    
    expect(screen.getByText('User Management')).toBeInTheDocument()
    expect(screen.getByText('+ New User')).toBeInTheDocument()
    expect(screen.getByText('All Users (0)')).toBeInTheDocument()
  })

  test('shows user creation form when clicking new user button', () => {
    getDocs.mockResolvedValue({
      docs: [],
      forEach: vi.fn(),
    })

    render(<UnifiedUserManager />)
    
    const newUserButton = screen.getByText('+ New User')
    fireEvent.click(newUserButton)
    
    expect(screen.getByText('Create New User')).toBeInTheDocument()
    expect(screen.getByText('Username')).toBeInTheDocument()
    expect(screen.getByText('Full Name')).toBeInTheDocument()
    expect(screen.getByText('Password')).toBeInTheDocument()
  })

  test('creates a new user successfully', async () => {
    // Mock all getDocs calls to return empty (no existing users)
    getDocs.mockResolvedValue({
      empty: true,
      docs: [],
    })

    // Mock user creation
    setDoc.mockResolvedValue()

    render(<UnifiedUserManager />)
    
    // Click new user button
    fireEvent.click(screen.getByText('+ New User'))
    
    // Fill form
    fireEvent.change(screen.getByPlaceholderText('johndoe'), {
      target: { value: 'testuser' },
    })
    fireEvent.change(screen.getByPlaceholderText('John Doe'), {
      target: { value: 'Test User' },
    })
    fireEvent.change(screen.getByPlaceholderText('john@example.com'), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('Min 6 characters'), {
      target: { value: 'password123' },
    })
    
    // Submit form using submit event to bypass HTML5 validation
    const form = screen.getByText('Create User').closest('form')
    fireEvent.submit(form)
    
    await waitFor(() => {
      expect(setDoc).toHaveBeenCalledWith(
        { id: 'mock-doc-id' }, // doc reference
        expect.objectContaining({
          username: 'testuser',
          displayName: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          role: 'user',
          organizations: [],
          primaryOrgId: null,
        })
      )
    })
  })

  test('shows error when username already exists', async () => {
    // Mock existing user
    getDocs.mockResolvedValue({
      empty: false,
      docs: [{ id: 'existing-user' }],
    })

    render(<UnifiedUserManager />)
    
    // Click new user button
    fireEvent.click(screen.getByText('+ New User'))
    
    // Fill form
    fireEvent.change(screen.getByPlaceholderText('johndoe'), {
      target: { value: 'existinguser' },
    })
    fireEvent.change(screen.getByPlaceholderText('John Doe'), {
      target: { value: 'Test User' },
    })
    fireEvent.change(screen.getByPlaceholderText('Min 6 characters'), {
      target: { value: 'password123' },
    })
    
    // Submit form
    fireEvent.click(screen.getByText('Create User'))
    
    await waitFor(() => {
      expect(screen.getByText('This username is already taken. Please choose a different username.')).toBeInTheDocument()
    })
  })

  test('validates required fields', async () => {
    getDocs.mockResolvedValue({
      docs: [],
      forEach: vi.fn(),
    })

    render(<UnifiedUserManager />)
    
    // Click new user button
    fireEvent.click(screen.getByText('+ New User'))
    
    // Fill in only username (missing password and display name)
    fireEvent.change(screen.getByPlaceholderText('johndoe'), {
      target: { value: 'testuser' },
    })
    
    // Submit form using submit event to bypass HTML5 validation
    const form = screen.getByText('Create User').closest('form')
    fireEvent.submit(form)
    
    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText('Username, password, and display name are required')).toBeInTheDocument()
    })
  })

  test('displays users list correctly', async () => {
    const mockUsers = [
      {
        id: 'user1',
        username: 'user1',
        displayName: 'User One',
        email: 'user1@example.com',
        organizations: [
          { orgId: 'org1', role: 'user' },
          { orgId: 'org2', role: 'admin' },
        ],
      },
      {
        id: 'user2',
        username: 'user2',
        displayName: 'User Two',
        email: null,
        organizations: [],
      },
    ]

    getDocs.mockResolvedValue({
      docs: mockUsers.map(user => ({
        id: user.id,
        data: () => user,
      })),
      map: vi.fn((callback) => mockUsers),
    })

    render(<UnifiedUserManager />)
    
    await waitFor(() => {
      expect(screen.getByText('All Users (2)')).toBeInTheDocument()
      expect(screen.getByText('user1')).toBeInTheDocument()
      expect(screen.getByText('User One')).toBeInTheDocument()
      expect(screen.getByText('user1@example.com')).toBeInTheDocument()
      expect(screen.getByText('user2')).toBeInTheDocument()
      expect(screen.getByText('User Two')).toBeInTheDocument()
      expect(screen.getByText('-')).toBeInTheDocument() // No email for user2
      
      // Check organization badges
      expect(screen.getByText('org1')).toBeInTheDocument()
      expect(screen.getByText('org2')).toBeInTheDocument()
      expect(screen.getByText('No access assigned')).toBeInTheDocument()
    })
  })

  test('deletes a user successfully', async () => {
    const mockUser = {
      id: 'user1',
      username: 'testuser',
      displayName: 'Test User',
      email: 'test@example.com',
    }

    getDocs.mockResolvedValue({
      docs: [
        {
          id: 'user1',
          data: () => mockUser,
        },
      ],
      map: vi.fn((callback) => [mockUser]),
    })

    // Mock window.confirm
    window.confirm = vi.fn(() => true)

    render(<UnifiedUserManager />)
    
    await waitFor(() => {
      const deleteButton = screen.getByText('Delete')
      fireEvent.click(deleteButton)
    })
    
    await waitFor(() => {
      expect(deleteDoc).toHaveBeenCalledWith({ id: 'mock-doc-id' })
    })
  })

  test('cancels user deletion when confirmation is declined', async () => {
    const mockUser = {
      id: 'user1',
      username: 'testuser',
      displayName: 'Test User',
      email: 'test@example.com',
    }

    getDocs.mockResolvedValue({
      docs: [
        {
          id: 'user1',
          data: () => mockUser,
        },
      ],
      map: vi.fn((callback) => [mockUser]),
    })

    // Mock window.confirm - user cancels
    window.confirm = vi.fn(() => false)

    render(<UnifiedUserManager />)
    
    await waitFor(() => {
      const deleteButton = screen.getByText('Delete')
      fireEvent.click(deleteButton)
    })
    
    expect(window.confirm).toHaveBeenCalled()
    expect(deleteDoc).not.toHaveBeenCalled()
  })
})
