import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, beforeEach, describe, it, expect } from 'vitest'
import AccessManagement from '../components/AccessManagement'
import { collection, query, where, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore'

// Create mock implementations that can be overridden in tests
const { getDocs: getDocsMock } = vi.hoisted(() => ({
  getDocs: vi.fn(),
}))

// Mock Firebase
vi.mock('../firebase', () => ({
  db: {},
}))

// Mock Firestore
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: getDocsMock,
  doc: vi.fn(),
  setDoc: vi.fn(),
  serverTimestamp: vi.fn(),
}))

// Mock contexts and hooks - must be at top level
const mockUseAuth = vi.fn()
const mockUseOrganizations = vi.fn()

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}))

vi.mock('../hooks/useOrganizations', () => ({
  useOrganizations: () => mockUseOrganizations(),
}))

vi.mock('../components/ToastContainer', () => ({
  useToast: () => ({
    addToast: vi.fn(),
  }),
}))

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks()
  // Set default mock implementations
  mockUseAuth.mockReturnValue({
    userProfile: { 
      id: 'test-admin', 
      displayName: 'Test Admin',
      organizations: [
        { orgId: 'org1', role: 'admin' },
        { orgId: 'org2', role: 'admin' },
      ]
    },
    isSuperAdmin: false,
  })
  
  mockUseOrganizations.mockReturnValue({
    organizations: [
      { id: 'org1', name: 'Organization 1' },
      { id: 'org2', name: 'Organization 2' },
      { id: 'org3', name: 'Organization 3' },
    ],
  })
})

vi.mock('../utils/logger', () => ({
  logUserAction: vi.fn(),
  LOG_TYPES: {
    USER_ACCESS_UPDATE: 'user_access_update',
  },
}))

describe('AccessManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    serverTimestamp.mockReturnValue(new Date())
  })

  test('renders access management interface', async () => {
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

    getDocsMock.mockResolvedValue({
      docs: mockUsers.map(user => ({
        id: user.id,
        data: () => user,
      })),
      map: vi.fn((callback) => mockUsers),
    })

    render(<AccessManagement />)
    
    await screen.findByText('Access Management', {}, { timeout: 3000 })
    await screen.findByText('Select User', {}, { timeout: 3000 })
    await screen.findByText('Select a user to manage their organization access.', {}, { timeout: 3000 })
  })

  test('shows only organizations admin has access to', async () => {
    const mockUsers = [
      {
        id: 'user1',
        username: 'user1',
        displayName: 'User One',
        organizations: [],
      },
    ]

    getDocsMock.mockResolvedValue({
      docs: mockUsers.map(user => ({
        id: user.id,
        data: () => user,
      })),
      map: vi.fn((callback) => mockUsers),
    })

    render(<AccessManagement />)
    
    const userElement = await screen.findByText('User One', {}, { timeout: 3000 })
    fireEvent.click(userElement)
    
    await screen.findByText('Organization 1', {}, { timeout: 3000 })
    await screen.findByText('Organization 2', {}, { timeout: 3000 })
    expect(screen.queryByText('Organization 3')).not.toBeInTheDocument()
  })

  test('selects a user and shows their current access', async () => {
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

    getDocsMock.mockResolvedValue({
      docs: mockUsers.map(user => ({
        id: user.id,
        data: () => user,
      })),
      map: vi.fn((callback) => mockUsers),
    })

    render(<AccessManagement />)
    
    const userElement = await screen.findByText('User One', {}, { timeout: 3000 })
    fireEvent.click(userElement)
    
    await screen.findByText('Assign Organizations for User One', {}, { timeout: 3000 })
    await screen.findByText('Current Access Summary', {}, { timeout: 3000 })
    
    // Find the Total Organizations section and its value
    const totalOrgsContainer = await screen.findByText('Total Organizations:', {}, { timeout: 3000 }).then(el => el.parentElement)
    expect(totalOrgsContainer.querySelector('.text-lg').textContent).toBe('1')
    
    // Find the Admin Access section and its value
    const adminAccessContainer = await screen.findByText('Admin Access:', {}, { timeout: 3000 }).then(el => el.parentElement)
    expect(adminAccessContainer.querySelector('.text-lg').textContent).toBe('1')
  })

  test('toggles organization access for a user', async () => {
    const mockUsers = [
      {
        id: 'user1',
        username: 'user1',
        displayName: 'User One',
        organizations: [],
      },
    ]

    getDocsMock.mockResolvedValue({
      docs: mockUsers.map(user => ({
        id: user.id,
        data: () => user,
      })),
      map: vi.fn((callback) => mockUsers),
    })

    render(<AccessManagement />)
    
    const userElement = await screen.findByText('User One', {}, { timeout: 3000 })
    fireEvent.click(userElement)
    
    const org1Checkbox = await screen.findAllByRole('checkbox', {}, { timeout: 3000 })
    expect(org1Checkbox[0]).not.toBeChecked()
    
    fireEvent.click(org1Checkbox[0])
    expect(org1Checkbox[0]).toBeChecked()
    
    await screen.findByDisplayValue('User', {}, { timeout: 3000 })
  })

  test('updates organization role', async () => {
    const mockUsers = [
      {
        id: 'user1',
        username: 'user1',
        displayName: 'User One',
        organizations: [{ orgId: 'org1', role: 'user' }],
      },
    ]

    getDocsMock.mockResolvedValue({
      docs: mockUsers.map(user => ({
        id: user.id,
        data: () => user,
      })),
      map: vi.fn((callback) => mockUsers),
    })

    render(<AccessManagement />)
    
    const userElement = await screen.findByText('User One', {}, { timeout: 3000 })
    fireEvent.click(userElement)
    
    const org1Checkbox = await screen.findAllByRole('checkbox', {}, { timeout: 3000 })
    expect(org1Checkbox[0]).toBeChecked()
    
    const roleSelect = await screen.findAllByRole('combobox', {}, { timeout: 3000 })
    fireEvent.change(roleSelect[0], { target: { value: 'admin' } })
    await screen.findByDisplayValue('Admin', {}, { timeout: 3000 })
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

    getDocsMock.mockResolvedValue({
      docs: mockUsers.map(user => ({
        id: user.id,
        data: () => user,
      })),
      map: vi.fn((callback) => mockUsers),
    })

    setDoc.mockResolvedValue()

    render(<AccessManagement />)
    
    const userElement = await screen.findByText('User One', {}, { timeout: 3000 })
    fireEvent.click(userElement)
    
    const org1Checkbox = await screen.findAllByRole('checkbox', {}, { timeout: 3000 })
    fireEvent.click(org1Checkbox[0])
    
    const saveButton = await screen.findByText('Update Access', {}, { timeout: 3000 })
    fireEvent.click(saveButton)
    
    await vi.waitFor(() => {
      expect(setDoc).toHaveBeenCalled()
      const callArgs = setDoc.mock.calls[0]
      expect(callArgs[1]).toMatchObject({
        organizations: [{ orgId: 'org1', role: 'user' }],
        primaryOrgId: 'org1',
      })
      expect(callArgs[1]).toHaveProperty('updatedAt')
      expect(callArgs[2]).toEqual({ merge: true })
    }, { timeout: 3000 })
  })

  test('removes organization access', async () => {
    const mockUsers = [
      {
        id: 'user1',
        username: 'user1',
        displayName: 'User One',
        organizations: [{ orgId: 'org1', role: 'user' }],
      },
    ]

    getDocsMock.mockResolvedValue({
      docs: mockUsers.map(user => ({
        id: user.id,
        data: () => user,
      })),
      map: vi.fn((callback) => mockUsers),
    })

    render(<AccessManagement />)
    
    const userElement = await screen.findByText('User One', {}, { timeout: 3000 })
    fireEvent.click(userElement)
    
    const org1Checkbox = await screen.findAllByRole('checkbox', {}, { timeout: 3000 })
    expect(org1Checkbox[0]).toBeChecked()
    
    fireEvent.click(org1Checkbox[0])
    expect(org1Checkbox[0]).not.toBeChecked()
  })

  test('shows empty state when no users available', async () => {
    getDocsMock.mockResolvedValue({
      docs: [],
      map: vi.fn(() => []),
    })

    render(<AccessManagement />)
    
    await screen.findByText('No users available. Create users first.', {}, { timeout: 3000 })
  })

  test('shows admin access warning for non-admin users', async () => {
    // Mock user with no admin access
    mockUseAuth.mockReturnValue({
      userProfile: { 
        id: 'test-user', 
        displayName: 'Test User',
        organizations: [
          { orgId: 'org1', role: 'user' }, // Only user role, no admin
        ]
      },
      isSuperAdmin: false,
    })

    // Mock organizations that the user doesn't have admin access to
    mockUseOrganizations.mockReturnValue({
      organizations: [
        { id: 'org1', name: 'Organization 1' },
        { id: 'org2', name: 'Organization 2' },
        { id: 'org3', name: 'Organization 3' },
      ]
    })

    const mockUsers = [
      {
        id: 'user1',
        username: 'user1',
        displayName: 'User One',
        organizations: [],
      },
    ]

    getDocsMock.mockResolvedValue({
      docs: mockUsers.map(user => ({
        id: user.id,
        data: () => user,
      })),
      map: vi.fn((callback) => mockUsers),
    })

    render(<AccessManagement />)
    
    // Wait for the user to appear and click it
    const userElement = await screen.findByText('User One', {}, { timeout: 3000 })
    fireEvent.click(userElement)
    
    // Wait for the warning message to appear
    await screen.findByText("You don't have admin access to any organizations.", {}, { timeout: 3000 })
  })

  test('super admin sees all organizations', async () => {
    // Mock super admin
    mockUseAuth.mockReturnValue({
      userProfile: { 
        id: 'super-admin', 
        displayName: 'Super Admin',
      },
      isSuperAdmin: true,
    })

    const mockUsers = [
      {
        id: 'user1',
        username: 'user1',
        displayName: 'User One',
        organizations: [],
      },
    ]

    getDocsMock.mockResolvedValue({
      docs: mockUsers.map(user => ({
        id: user.id,
        data: () => user,
      })),
      map: vi.fn((callback) => mockUsers),
    })

    render(<AccessManagement />)
    
    // Select a user first
    const userElement = await screen.findByText('User One', {}, { timeout: 3000 })
    fireEvent.click(userElement)
    
    // Super admin should see all organizations
    await screen.findByText('Organization 1', {}, { timeout: 3000 })
    await screen.findByText('Organization 2', {}, { timeout: 3000 })
    await screen.findByText('Organization 3', {}, { timeout: 3000 })
  })
})
