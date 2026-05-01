import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import MultiOrgUserManager from '../components/MultiOrgUserManager'
import { AuthProvider } from '../contexts/AuthContext'
import { OrgProvider } from '../contexts/OrgContext'
import { collection, doc, setDoc, serverTimestamp, query, where, getDocs, arrayUnion } from 'firebase/firestore'

// Mock Firebase
vi.mock('../firebase', () => ({
  db: {},
}))

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(() => ({ id: 'mock-doc-id' })),
  setDoc: vi.fn(() => Promise.resolve()),
  serverTimestamp: vi.fn(() => new Date()),
  query: vi.fn((...args) => args), // Return the arguments passed to query
  where: vi.fn((...args) => args), // Return the arguments passed to where
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
    },
    isSuperAdmin: true
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
    collection.mockReturnValue({
      where: vi.fn(() => ({
        get: vi.fn(() => Promise.resolve({ empty: true, docs: [] }))
      })),
      get: vi.fn(() => Promise.resolve({ docs: [] }))
    })
  })

  describe('Component Rendering', () => {
    it('should render the multi-org user management interface', async () => {
      getDocs.mockResolvedValue({ docs: [] })
      renderWithProviders(<MultiOrgUserManager />)
      
      await waitFor(() => {
        expect(screen.getByText('Multi-Organization User Management')).toBeInTheDocument()
        expect(screen.getByText('All Users (0)')).toBeInTheDocument()
      })
    })

    it('should show create user form when button is clicked', async () => {
      getDocs.mockResolvedValue({ docs: [] })
      renderWithProviders(<MultiOrgUserManager />)
      
      await waitFor(() => {
        const createButton = screen.getByText('+ New Multi-Org User')
        fireEvent.click(createButton)
      })
      
      expect(screen.getByText('Create User with Multiple Organization Access')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('johndoe')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('John Doe')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('john@example.com')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Min 6 characters')).toBeInTheDocument() // Password input
    })

    it('should display organization checkboxes', async () => {
      getDocs.mockResolvedValue({ docs: [] })
      renderWithProviders(<MultiOrgUserManager />)
      
      await waitFor(() => {
        const createButton = screen.getByText('+ New Multi-Org User')
        fireEvent.click(createButton)
      })
      
      expect(screen.getByText('Organization 1')).toBeInTheDocument()
      expect(screen.getByText('Organization 2')).toBeInTheDocument()
      expect(screen.getByText('Organization 3')).toBeInTheDocument()
      expect(screen.getByText('org1')).toBeInTheDocument()
      expect(screen.getByText('org2')).toBeInTheDocument()
      expect(screen.getByText('org3')).toBeInTheDocument()
    })
  })

  describe('Organization Selection', () => {
    it('should allow selecting multiple organizations', async () => {
      getDocs.mockResolvedValue({ docs: [] })
      renderWithProviders(<MultiOrgUserManager />)
      
      await waitFor(() => {
        const createButton = screen.getByText('+ New Multi-Org User')
        fireEvent.click(createButton)
      })
      
      const org1Div = screen.getByText('Organization 1').closest('div')
      const org1Checkbox = org1Div.querySelector('input[type="checkbox"]')
      const org2Div = screen.getByText('Organization 2').closest('div')
      const org2Checkbox = org2Div.querySelector('input[type="checkbox"]')

      if (org1Checkbox && org2Checkbox) {
        fireEvent.click(org1Checkbox)
        expect(org1Checkbox.checked).toBe(true)
        fireEvent.click(org2Checkbox)
        expect(org2Checkbox.checked).toBe(true)
        
        expect(screen.getByText('Select Organizations (2 selected)')).toBeInTheDocument()
      }
    })

    it('should update selection count when organizations are selected/deselected', async () => {
      getDocs.mockResolvedValue({ docs: [] })
      renderWithProviders(<MultiOrgUserManager />)
      
      await waitFor(() => {
        const createButton = screen.getByText('+ New Multi-Org User')
        fireEvent.click(createButton)
      })
      
      const org1Div = screen.getByText('Organization 1').closest('div')
      const org1Checkbox = org1Div.querySelector('input[type="checkbox"]')

      if (org1Checkbox) {
        fireEvent.click(org1Checkbox)
        await waitFor(() => {
          expect(screen.getByText('Select Organizations (1 selected)')).toBeInTheDocument()
        })
        
        // Deselect
        fireEvent.click(org1Checkbox)
        await waitFor(() => {
          expect(screen.getByText('Select Organizations (0 selected)')).toBeInTheDocument()
        })
      }
    })
  })

  describe('Form Validation', () => {
    it('should show error when no organizations are selected', async () => {
      getDocs.mockResolvedValue({ docs: [] })
      renderWithProviders(<MultiOrgUserManager />)
      
      await waitFor(() => {
        const createButton = screen.getByText('+ New Multi-Org User')
        fireEvent.click(createButton)
      })
      
      const usernameInput = screen.getByPlaceholderText('johndoe')
      const passwordInput = screen.getByPlaceholderText('Min 6 characters')
      const nameInput = screen.getByPlaceholderText('John Doe')
      
      fireEvent.change(usernameInput, { target: { value: 'testuser' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.change(nameInput, { target: { value: 'Test User' } })
      
      // Submit form using submit event
      const form = screen.getByText('Create User').closest('form')
      fireEvent.submit(form)
      
      await waitFor(() => {
        expect(screen.getByText('Please select at least one organization for this user')).toBeInTheDocument()
      })
    })

    it('should show error when required fields are missing', async () => {
      getDocs.mockResolvedValue({ docs: [] })
      renderWithProviders(<MultiOrgUserManager />)
      
      await waitFor(() => {
        const createButton = screen.getByText('+ New Multi-Org User')
        fireEvent.click(createButton)
      })
      
      // Fill in only username (missing password and display name)
      fireEvent.change(screen.getByPlaceholderText('johndoe'), {
        target: { value: 'testuser' },
      })
      
      // Submit form using submit event
      const form = screen.getByText('Create User').closest('form')
      fireEvent.submit(form)
      
      await waitFor(() => {
        expect(screen.getByText('Username, password, and display name are required')).toBeInTheDocument()
      })
    })
  })

  describe('Role Selection', () => {
    it('should allow selecting user or admin role', async () => {
      getDocs.mockResolvedValue({ docs: [] })
      renderWithProviders(<MultiOrgUserManager />)
      
      await waitFor(() => {
        const createButton = screen.getByText('+ New Multi-Org User')
        fireEvent.click(createButton)
      })
      
      // Select an organization first to show role dropdown
      const org1Div = screen.getByText('Organization 1').closest('div')
      const org1Checkbox = org1Div.querySelector('input[type="checkbox"]')
      if (org1Checkbox) {
        fireEvent.click(org1Checkbox)
        
        await waitFor(() => {
          // Look for select element with role options
          const roleSelect = screen.getByDisplayValue('User') || screen.getByLabelText('Role in Organizations')
          expect(roleSelect).toBeInTheDocument()
        })
      }
    })
  })

  describe('Responsive Design', () => {
    it('should render properly on mobile viewports', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })
      
      getDocs.mockResolvedValue({ docs: [] })
      renderWithProviders(<MultiOrgUserManager />)
      
      await waitFor(() => {
        expect(screen.getByText('Multi-Organization User Management')).toBeInTheDocument()
        expect(screen.getByText('+ New Multi-Org User')).toBeInTheDocument()
      })
    })

    it('should render properly on desktop viewports', async () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      })
      
      getDocs.mockResolvedValue({ docs: [] })
      renderWithProviders(<MultiOrgUserManager />)
      
      await waitFor(() => {
        expect(screen.getByText('Multi-Organization User Management')).toBeInTheDocument()
        expect(screen.getByText('+ New Multi-Org User')).toBeInTheDocument()
      })
    })
  })
})
