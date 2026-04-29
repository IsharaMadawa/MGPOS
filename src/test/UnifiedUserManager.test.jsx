import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, beforeEach, describe, it, expect } from 'vitest'
import UnifiedUserManager from '../components/UnifiedUserManager'

// Mock Firebase
vi.mock('../firebase', () => ({
  db: {},
}))

// Mock Firestore - must be at top level
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
    mockServerTimestamp.mockReturnValue(new Date())
  })

  test('renders user management interface', () => {
    // Mock empty users list
    mockGetDocs.mockResolvedValue({
      docs: [],
      forEach: vi.fn(),
    })

    render(<UnifiedUserManager />)
    
    expect(screen.getByText('User Management')).toBeInTheDocument()
    expect(screen.getByText('+ New User')).toBeInTheDocument()
    expect(screen.getByText('All Users (0)')).toBeInTheDocument()
  })

  test('shows user creation form when clicking new user button', () => {
    mockGetDocs.mockResolvedValue({
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
    const mockUser = {
      id: 'user1',
      username: 'testuser',
      displayName: 'Test User',
      email: 'test@example.com',
    }

    // Mock username check - no existing user
    mockGetDocs.mockResolvedValueOnce({
      empty: true,
      docs: [],
    })

    // Mock user creation
    mockSetDoc.mockResolvedValue()

    // Mock updated users list
    mockGetDocs.mockResolvedValueOnce({
      docs: [
        {
          id: 'user1',
          data: () => mockUser,
        },
      ],
      map: vi.fn((callback) => [mockUser]),
    })

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
    
    // Submit form
    fireEvent.click(screen.getByText('Create User'))
    
    await waitFor(() => {
      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.any(Object), // doc reference
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
    mockGetDocs.mockResolvedValue({
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

  test('validates required fields', () => {
    mockGetDocs.mockResolvedValue({
      docs: [],
      forEach: vi.fn(),
    })

    render(<UnifiedUserManager />)
    
    // Click new user button
    fireEvent.click(screen.getByText('+ New User'))
    
    // Submit empty form
    fireEvent.click(screen.getByText('Create User'))
    
    // Should show validation error
    expect(screen.getByText('Username, password, and display name are required')).toBeInTheDocument()
  })

  test('displays users list correctly', () => {
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

    mockGetDocs.mockResolvedValue({
      docs: mockUsers.map(user => ({
        id: user.id,
        data: () => user,
      })),
      map: vi.fn((callback) => mockUsers),
    })

    render(<UnifiedUserManager />)
    
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

  test('deletes a user successfully', async () => {
    const mockUser = {
      id: 'user1',
      username: 'testuser',
      displayName: 'Test User',
      email: 'test@example.com',
    }

    mockGetDocs.mockResolvedValue({
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
    
    const deleteButton = screen.getByText('Delete')
    fireEvent.click(deleteButton)
    
    await waitFor(() => {
      expect(mockDeleteDoc).toHaveBeenCalledWith(expect.any(Object))
    })
  })

  test('cancels user deletion when confirmation is declined', () => {
    const mockUser = {
      id: 'user1',
      username: 'testuser',
      displayName: 'Test User',
      email: 'test@example.com',
    }

    mockGetDocs.mockResolvedValue({
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
    
    const deleteButton = screen.getByText('Delete')
    fireEvent.click(deleteButton)
    
    expect(window.confirm).toHaveBeenCalled()
    expect(mockDeleteDoc).not.toHaveBeenCalled()
  })
})
