import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import MultiOrgUserManager from '../components/MultiOrgUserManager'
import { AuthProvider } from '../contexts/AuthContext'
import { OrgProvider } from '../contexts/OrgContext'

// Mock Firebase - provide proper Firestore mock
const mockCollection = vi.fn(() => ({
  where: vi.fn(() => ({
    get: vi.fn(() => Promise.resolve({ empty: true, docs: [] }))
  })),
  get: vi.fn(() => Promise.resolve({ docs: [] }))
}))
const mockDoc = vi.fn()
const mockSetDoc = vi.fn(() => Promise.resolve())
const mockServerTimestamp = vi.fn(() => new Date())

vi.mock('../firebase', () => ({
  db: {
    collection: mockCollection,
    doc: mockDoc
  }
}))

vi.mock('firebase/firestore', () => ({
  collection: mockCollection,
  doc: mockDoc,
  setDoc: mockSetDoc,
  serverTimestamp: mockServerTimestamp,
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(() => Promise.resolve({ empty: true, docs: [] })),
  arrayUnion: vi.fn()
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
    }
  })
}))

// Mock useOrganizations
vi.mock('../hooks/useOrganizations', () => ({
  useOrganizations: () => ({
    organizations: [
      { id: 'org1', name: 'Organization 1', description: 'First org' },
      { id: 'org2', name: 'Organization 2', description: 'Second org' },
      { id: 'org3', name: 'Organization 3', description: 'Third org' }
    ]
  })
}))

// Mock logger
vi.mock('../utils/logger', () => ({
  logUserAction: vi.fn(),
  LOG_TYPES: {
    USER_CREATE: 'USER_CREATE'
  }
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

describe('MultiOrgUserManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset mock implementations
    mockCollection.mockReturnValue({
      where: vi.fn(() => ({
        get: vi.fn(() => Promise.resolve({ empty: true, docs: [] }))
      })),
      get: vi.fn(() => Promise.resolve({ docs: [] }))
    })
  })

  describe('Component Rendering', () => {
    it('should render the multi-org user management interface', () => {
      renderWithProviders(<MultiOrgUserManager />)
      
      expect(screen.getByText('Multi-Organization User Management')).toBeInTheDocument()
      expect(screen.getByText('Create User with Multiple Organization Access')).toBeInTheDocument()
      expect(screen.getByText('All Users')).toBeInTheDocument()
    })

    it('should show create user form when button is clicked', () => {
      renderWithProviders(<MultiOrgUserManager />)
      
      const createButton = screen.getByText('+ New Multi-Org User')
      fireEvent.click(createButton)
      
      expect(screen.getByText('Create User with Multiple Organization Access')).toBeInTheDocument()
      expect(screen.getByLabelText('Username')).toBeInTheDocument()
      expect(screen.getByLabelText('Full Name')).toBeInTheDocument()
      expect(screen.getByLabelText('Email (optional)')).toBeInTheDocument()
      expect(screen.getByLabelText('Password')).toBeInTheDocument()
      expect(screen.getByLabelText('Role in Organizations')).toBeInTheDocument()
    })

    it('should display organization checkboxes', () => {
      renderWithProviders(<MultiOrgUserManager />)
      
      const createButton = screen.getByText('+ New Multi-Org User')
      fireEvent.click(createButton)
      
      expect(screen.getByText('Organization 1')).toBeInTheDocument()
      expect(screen.getByText('Organization 2')).toBeInTheDocument()
      expect(screen.getByText('Organization 3')).toBeInTheDocument()
      expect(screen.getByText('(org1)')).toBeInTheDocument()
      expect(screen.getByText('(org2)')).toBeInTheDocument()
      expect(screen.getByText('(org3)')).toBeInTheDocument()
    })
  })

  describe('Organization Selection', () => {
    it('should allow selecting multiple organizations', async () => {
      renderWithProviders(<MultiOrgUserManager />)
      
      const createButton = screen.getByText('+ New Multi-Org User')
      fireEvent.click(createButton)
      
      const org1Checkbox = screen.getByText('Organization 1').closest('label').querySelector('input[type="checkbox"]')
      const org2Checkbox = screen.getByText('Organization 2').closest('label').querySelector('input[type="checkbox"]')
      
      fireEvent.click(org1Checkbox)
      expect(org1Checkbox.checked).toBe(true)
      
      fireEvent.click(org2Checkbox)
      expect(org2Checkbox.checked).toBe(true)
      expect(org1Checkbox.checked).toBe(true)
      
      expect(screen.getByText('Select Organizations (2 selected)')).toBeInTheDocument()
    })

    it('should update selection count when organizations are selected/deselected', () => {
      renderWithProviders(<MultiOrgUserManager />)
      
      const createButton = screen.getByText('+ New Multi-Org User')
      fireEvent.click(createButton)
      
      const org1Checkbox = screen.getByText('Organization 1').closest('label').querySelector('input[type="checkbox"]')
      
      fireEvent.click(org1Checkbox)
      expect(screen.getByText('Select Organizations (1 selected)')).toBeInTheDocument()
      
      fireEvent.click(org1Checkbox)
      expect(screen.getByText('Select Organizations (0 selected)')).toBeInTheDocument()
    })
  })

  describe('Form Validation', () => {
    it('should show error when no organizations are selected', async () => {
      renderWithProviders(<MultiOrgUserManager />)
      
      const createButton = screen.getByText('+ New Multi-Org User')
      fireEvent.click(createButton)
      
      const submitButton = screen.getByText('Create User')
      const usernameInput = screen.getByLabelText('Username')
      const passwordInput = screen.getByLabelText('Password')
      const nameInput = screen.getByLabelText('Full Name')
      
      fireEvent.change(usernameInput, { target: { value: 'testuser' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.change(nameInput, { target: { value: 'Test User' } })
      
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Please select at least one organization for this user')).toBeInTheDocument()
      })
    })

    it('should show error when required fields are missing', async () => {
      renderWithProviders(<MultiOrgUserManager />)
      
      const createButton = screen.getByText('+ New Multi-Org User')
      fireEvent.click(createButton)
      
      const submitButton = screen.getByText('Create User')
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Username, password, and display name are required')).toBeInTheDocument()
      })
    })
  })

  describe('Role Selection', () => {
    it('should allow selecting user or admin role', () => {
      renderWithProviders(<MultiOrgUserManager />)
      
      const createButton = screen.getByText('+ New Multi-Org User')
      fireEvent.click(createButton)
      
      const roleSelect = screen.getByLabelText('Role in Organizations')
      expect(roleSelect).toBeInTheDocument()
      
      const userOption = screen.getByText('User')
      const adminOption = screen.getByText('Admin')
      
      expect(userOption).toBeInTheDocument()
      expect(adminOption).toBeInTheDocument()
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
      
      renderWithProviders(<MultiOrgUserManager />)
      
      expect(screen.getByText('Multi-Organization User Management')).toBeInTheDocument()
      expect(screen.getByText('+ New Multi-Org User')).toBeInTheDocument()
    })

    it('should render properly on desktop viewports', () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      })
      
      renderWithProviders(<MultiOrgUserManager />)
      
      expect(screen.getByText('Multi-Organization User Management')).toBeInTheDocument()
      expect(screen.getByText('+ New Multi-Org User')).toBeInTheDocument()
    })
  })
})
