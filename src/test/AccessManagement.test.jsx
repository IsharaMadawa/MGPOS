import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, beforeEach, describe, it, expect } from 'vitest'
import AccessManagement from '../components/AccessManagement'

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
const mockServerTimestamp = vi.fn()

vi.mock('firebase/firestore', () => ({
  collection: mockCollection,
  query: mockQuery,
  where: mockWhere,
  getDocs: mockGetDocs,
  doc: mockDoc,
  setDoc: mockSetDoc,
  serverTimestamp: mockServerTimestamp,
}))

// Mock contexts and hooks - must be at top level
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    userProfile: { 
      id: 'test-admin', 
      displayName: 'Test Admin',
      organizations: [
        { orgId: 'org1', role: 'admin' },
        { orgId: 'org2', role: 'user' },
      ]
    },
    isSuperAdmin: false,
  }),
}))

vi.mock('../hooks/useOrganizations', () => ({
  useOrganizations: () => ({
    organizations: [
      { id: 'org1', name: 'Organization 1' },
      { id: 'org2', name: 'Organization 2' },
      { id: 'org3', name: 'Organization 3' },
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
    USER_ACCESS_UPDATE: 'user_access_update',
  },
}))

describe('AccessManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockServerTimestamp.mockReturnValue(new Date())
  })

  test('renders access management interface', () => {
    const mockUsers = [
      {
        id: 'user1',
        username: 'user1',
        displayName: 'User One',
        organizations: [],
      },
      {
        id: 'user2',
        username: 'user2',
        displayName: 'User Two',
        organizations: [{ orgId: 'org1', role: 'user' }],
      },
    ]

    mockGetDocs.mockResolvedValue({
      docs: mockUsers.map(user => ({
        id: user.id,
        data: () => user,
      })),
      map: vi.fn((callback) => mockUsers),
    })

    render(<AccessManagement />)
    
    expect(screen.getByText('Access Management')).toBeInTheDocument()
    expect(screen.getByText('Select User')).toBeInTheDocument()
    expect(screen.getByText('Assign Organizations for')).toBeInTheDocument()
    expect(screen.getByText('Select a user to manage their organization access.')).toBeInTheDocument()
  })

  test('shows only organizations admin has access to', () => {
    const mockUsers = [
      {
        id: 'user1',
        username: 'user1',
        displayName: 'User One',
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

    render(<AccessManagement />)
    
    // Should only show org1 and org2 (admin access), not org3
    expect(screen.getByText('Organization 1')).toBeInTheDocument()
    expect(screen.getByText('Organization 2')).toBeInTheDocument()
    expect(screen.queryByText('Organization 3')).not.toBeInTheDocument()
  })

  test('selects a user and shows their current access', () => {
    const mockUsers = [
      {
        id: 'user1',
        username: 'user1',
        displayName: 'User One',
        organizations: [{ orgId: 'org1', role: 'admin' }],
      },
      {
        id: 'user2',
        username: 'user2',
        displayName: 'User Two',
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

    render(<AccessManagement />)
    
    // Click on user1
    fireEvent.click(screen.getByText('User One'))
    
    expect(screen.getByText('Assign Organizations for User One')).toBeInTheDocument()
    expect(screen.getByText('Current Access Summary')).toBeInTheDocument()
    expect(screen.getByText('Total Organizations:')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('Admin Access:')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  test('toggles organization access for a user', () => {
    const mockUsers = [
      {
        id: 'user1',
        username: 'user1',
        displayName: 'User One',
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

    render(<AccessManagement />)
    
    // Select user
    fireEvent.click(screen.getByText('User One'))
    
    // Initially no organizations selected
    const org1Checkbox = screen.getByLabelText('') // First checkbox for org1
    expect(org1Checkbox).not.toBeChecked()
    
    // Toggle org1 access
    fireEvent.click(org1Checkbox)
    expect(org1Checkbox).toBeChecked()
    
    // Role dropdown should appear
    expect(screen.getByDisplayValue('User')).toBeInTheDocument()
  })

  test('updates organization role', () => {
    const mockUsers = [
      {
        id: 'user1',
        username: 'user1',
        displayName: 'User One',
        organizations: [{ orgId: 'org1', role: 'user' }],
      },
    ]

    mockGetDocs.mockResolvedValue({
      docs: mockUsers.map(user => ({
        id: user.id,
        data: () => user,
      })),
      map: vi.fn((callback) => mockUsers),
    })

    render(<AccessManagement />)
    
    // Select user
    fireEvent.click(screen.getByText('User One'))
    
    // Change role from User to Admin
    const roleSelect = screen.getByDisplayValue('User')
    fireEvent.change(roleSelect, { target: { value: 'admin' } })
    
    expect(screen.getByDisplayValue('Admin')).toBeInTheDocument()
  })

  test('updates user access successfully', async () => {
    const mockUsers = [
      {
        id: 'user1',
        username: 'user1',
        displayName: 'User One',
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

    render(<AccessManagement />)
    
    // Select user
    fireEvent.click(screen.getByText('User One'))
    
    // Add org1 access
    const org1Checkbox = screen.getAllByRole('checkbox')[0]
    fireEvent.click(org1Checkbox)
    
    // Update access
    fireEvent.click(screen.getByText('Update Access'))
    
    await waitFor(() => {
      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          organizations: [{ orgId: 'org1', role: 'user' }],
          primaryOrgId: 'org1',
        }),
        { merge: true }
      )
    })
  })

  test('removes organization access', () => {
    const mockUsers = [
      {
        id: 'user1',
        username: 'user1',
        displayName: 'User One',
        organizations: [{ orgId: 'org1', role: 'user' }],
      },
    ]

    mockGetDocs.mockResolvedValue({
      docs: mockUsers.map(user => ({
        id: user.id,
        data: () => user,
      })),
      map: vi.fn((callback) => mockUsers),
    })

    render(<AccessManagement />)
    
    // Select user
    fireEvent.click(screen.getByText('User One'))
    
    // org1 should be initially selected
    const org1Checkbox = screen.getAllByRole('checkbox')[0]
    expect(org1Checkbox).toBeChecked()
    
    // Remove access
    fireEvent.click(org1Checkbox)
    expect(org1Checkbox).not.toBeChecked()
  })

  test('shows empty state when no users available', () => {
    mockGetDocs.mockResolvedValue({
      docs: [],
      forEach: vi.fn(),
    })

    render(<AccessManagement />)
    
    expect(screen.getByText('No users available. Create users first.')).toBeInTheDocument()
  })

  test('shows admin access warning for non-admin users', () => {
    // Mock user with no admin access
    vi.mock('../contexts/AuthContext', () => ({
      useAuth: () => ({
        userProfile: { 
          id: 'test-user', 
          displayName: 'Test User',
          organizations: [
            { orgId: 'org1', role: 'user' }, // Only user role, no admin
          ]
        },
        isSuperAdmin: false,
      }),
    }))

    const mockUsers = [
      {
        id: 'user1',
        username: 'user1',
        displayName: 'User One',
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

    render(<AccessManagement />)
    
    expect(screen.getByText("You don't have admin access to any organizations.")).toBeInTheDocument()
  })

  test('super admin sees all organizations', () => {
    // Mock super admin
    vi.mock('../contexts/AuthContext', () => ({
      useAuth: () => ({
        userProfile: { 
          id: 'super-admin', 
          displayName: 'Super Admin',
        },
        isSuperAdmin: true,
      }),
    }))

    const mockUsers = [
      {
        id: 'user1',
        username: 'user1',
        displayName: 'User One',
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

    render(<AccessManagement />)
    
    // Super admin should see all organizations
    expect(screen.getByText('Organization 1')).toBeInTheDocument()
    expect(screen.getByText('Organization 2')).toBeInTheDocument()
    expect(screen.getByText('Organization 3')).toBeInTheDocument()
  })
})
