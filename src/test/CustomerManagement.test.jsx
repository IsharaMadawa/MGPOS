import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CustomerManagement from '../components/CustomerManagement'
import { AuthProvider } from '../contexts/AuthContext'
import { OrgProvider } from '../contexts/OrgContext'
import { ToastProvider } from '../components/ToastContainer'

// Mock useSettings hook
vi.mock('../hooks/useSettings.js', () => ({
  useSettings: () => ({
    currencySymbol: '$',
    settings: { currency: 'USD' }
  })
}))

// Mock useCustomers hook
const mockUseCustomers = {
  customers: [],
  loading: false,
  createCustomer: vi.fn(),
  updateCustomer: vi.fn(),
  deleteCustomer: vi.fn(),
  updateCreditBalance: vi.fn(),
  searchCustomers: vi.fn()
}

vi.mock('../hooks/useCustomers.js', () => ({
  useCustomers: () => mockUseCustomers
}))

// Mock useAuth hook
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    userProfile: { displayName: 'Test User' }
  }),
  AuthProvider: ({ children }) => children
}))

// Mock OrgContext
vi.mock('../contexts/OrgContext', () => ({
  useOrg: () => ({
    selectedOrgId: 'test-org-id',
    hasAdminAccessToOrganization: () => true
  }),
  OrgProvider: ({ children }) => children
}))

// Mock ToastContainer
const mockAddToast = vi.fn()
vi.mock('../components/ToastContainer', () => ({
  useToast: () => ({
    addToast: mockAddToast
  }),
  ToastProvider: ({ children }) => children
}))

const wrapper = ({ children }) => (
  <AuthProvider>
    <OrgProvider>
      <ToastProvider>
        {children}
      </ToastProvider>
    </OrgProvider>
  </AuthProvider>
)

describe('CustomerManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAddToast.mockClear()
    mockUseCustomers.customers = []
    mockUseCustomers.loading = false
  })

  it('should render customer management page', () => {
    render(<CustomerManagement />, { wrapper })

    expect(screen.getByText('Customer Management')).toBeInTheDocument()
    expect(screen.getByText('Add Customer')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Search customers by name, phone, or email...')).toBeInTheDocument()
  })

  it('should display loading state', () => {
    mockUseCustomers.loading = true

    render(<CustomerManagement />, { wrapper })

    expect(screen.getByText('Loading customers...')).toBeInTheDocument()
  })

  it('should display customers list', () => {
    const mockCustomers = [
      { id: '1', name: 'John Doe', phone: '123-456-7890', email: 'john@example.com', creditBalance: 100, purchaseCount: 5, totalPurchases: 500, createdAt: '2023-01-01' },
      { id: '2', name: 'Jane Smith', phone: '098-765-4321', email: 'jane@example.com', creditBalance: -50, purchaseCount: 3, totalPurchases: 300, createdAt: '2023-01-02' }
    ]
    mockUseCustomers.customers = mockCustomers

    render(<CustomerManagement />, { wrapper })

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    expect(screen.getByText('📞 123-456-7890')).toBeInTheDocument()
    expect(screen.getByText('📞 098-765-4321')).toBeInTheDocument()
    expect(screen.getByText('Credit: $100.00')).toBeInTheDocument()
    expect(screen.getByText('Credit: $50.00')).toBeInTheDocument()
  })

  it('should filter customers by search term', async () => {
    const user = userEvent.setup()
    const mockCustomers = [
      { id: '1', name: 'John Doe', phone: '123-456-7890' },
      { id: '2', name: 'Jane Smith', phone: '098-765-4321' }
    ]
    mockUseCustomers.customers = mockCustomers

    render(<CustomerManagement />, { wrapper })

    const searchInput = screen.getByPlaceholderText('Search customers by name, phone, or email...')
    await user.type(searchInput, 'John')

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument()
  })

  it('should open create customer modal when Add Customer is clicked', async () => {
    const user = userEvent.setup()

    render(<CustomerManagement />, { wrapper })

    const addButton = screen.getByText('Add Customer')
    await user.click(addButton)

    expect(screen.getByText('Add New Customer')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Customer name')).toBeInTheDocument()
  })

  it('should create new customer', async () => {
    const user = userEvent.setup()
    mockUseCustomers.createCustomer.mockResolvedValue({ id: 'new-customer', name: 'New Customer' })

    render(<CustomerManagement />, { wrapper })

    // Click add customer
    const addButton = screen.getByText('Add Customer')
    await user.click(addButton)

    // Fill form
    const nameInput = screen.getByPlaceholderText('Customer name')
    await user.type(nameInput, 'New Customer')

    const phoneInput = screen.getByPlaceholderText('Phone number')
    await user.type(phoneInput, '555-123-4567')

    const emailInput = screen.getByPlaceholderText('Email address')
    await user.type(emailInput, 'new@example.com')

    const addressInput = screen.getByPlaceholderText('Address')
    await user.type(addressInput, '123 Main St')

    // Submit
    const submitButton = screen.getByText('Create')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockUseCustomers.createCustomer).toHaveBeenCalledWith({
        name: 'New Customer',
        phone: '555-123-4567',
        email: 'new@example.com',
        address: '123 Main St'
      })
    })
  })

  it('should edit existing customer', async () => {
    const user = userEvent.setup()
    const mockCustomers = [
      { id: '1', name: 'John Doe', phone: '123-456-7890', email: 'john@example.com', address: '123 Main St' }
    ]
    mockUseCustomers.customers = mockCustomers
    mockUseCustomers.updateCustomer.mockResolvedValue({ success: true })

    render(<CustomerManagement />, { wrapper })

    // Click edit button
    const editButton = screen.getByTitle('Edit customer')
    await user.click(editButton)

    expect(screen.getByText('Edit Customer')).toBeInTheDocument()

    // Update name
    const nameInput = screen.getByDisplayValue('John Doe')
    await user.clear(nameInput)
    await user.type(nameInput, 'John Updated')

    // Submit
    const updateButton = screen.getByText('Update')
    await user.click(updateButton)

    await waitFor(() => {
      expect(mockUseCustomers.updateCustomer).toHaveBeenCalledWith('1', {
        name: 'John Updated',
        phone: '123-456-7890',
        email: 'john@example.com',
        address: '123 Main St'
      })
    })
  })

  it('should delete customer', async () => {
    const user = userEvent.setup()
    const mockCustomers = [
      { id: '1', name: 'John Doe', phone: '123-456-7890' }
    ]
    mockUseCustomers.customers = mockCustomers
    mockUseCustomers.deleteCustomer.mockResolvedValue({ success: true })

    // Mock window.confirm
    window.confirm = vi.fn(() => true)

    render(<CustomerManagement />, { wrapper })

    // Click delete button
    const deleteButton = screen.getByTitle('Delete customer')
    await user.click(deleteButton)

    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete John Doe? This action cannot be undone.')

    await waitFor(() => {
      expect(mockUseCustomers.deleteCustomer).toHaveBeenCalledWith('1')
    })
  })

  it('should open credit balance modal', async () => {
    const user = userEvent.setup()
    const mockCustomers = [
      { id: '1', name: 'John Doe', phone: '123-456-7890', creditBalance: 100 }
    ]
    mockUseCustomers.customers = mockCustomers

    render(<CustomerManagement />, { wrapper })

    // Click credit balance button
    const creditButton = screen.getByTitle('Update credit balance')
    await user.click(creditButton)

    expect(screen.getByText('Update Credit Balance')).toBeInTheDocument()
    const modalContent = screen.getByText('Update Credit Balance').closest('.fixed')
    expect(modalContent).toHaveTextContent('John Doe')
    expect(modalContent).toHaveTextContent('Current balance: $100.00')
  })

  it('should update credit balance', async () => {
    const user = userEvent.setup()
    const mockCustomers = [
      { id: '1', name: 'John Doe', phone: '123-456-7890', creditBalance: 100 }
    ]
    mockUseCustomers.customers = mockCustomers
    mockUseCustomers.updateCreditBalance.mockResolvedValue({ success: true, newBalance: 150 })

    render(<CustomerManagement />, { wrapper })

    // Click credit balance button
    const creditButton = screen.getByTitle('Update credit balance')
    await user.click(creditButton)

    // Enter amount
    const amountInput = screen.getByPlaceholderText('Enter amount (positive to add, negative to subtract)')
    await user.type(amountInput, '50')

    // Submit
    const updateButton = screen.getByText('Update Balance')
    await user.click(updateButton)

    await waitFor(() => {
      expect(mockUseCustomers.updateCreditBalance).toHaveBeenCalledWith('1', 50, '')
    })
  })

  it('should show empty state when no customers', () => {
    render(<CustomerManagement />, { wrapper })

    expect(screen.getByText('No customers yet')).toBeInTheDocument()
    expect(screen.getByText('Add your first customer to get started')).toBeInTheDocument()
  })

  it('should show no results message when search returns no customers', async () => {
    const user = userEvent.setup()
    const mockCustomers = [
      { id: '1', name: 'John Doe', phone: '123-456-7890' }
    ]
    mockUseCustomers.customers = mockCustomers

    render(<CustomerManagement />, { wrapper })

    const searchInput = screen.getByPlaceholderText('Search customers by name, phone, or email...')
    await user.type(searchInput, 'Nonexistent')

    expect(screen.getByText('No customers found matching your search')).toBeInTheDocument()
    expect(screen.getByText('Try a different search term')).toBeInTheDocument()
  })

  it('should validate customer creation form', async () => {
    const user = userEvent.setup()

    render(<CustomerManagement />, { wrapper })

    // Click add customer
    const addButton = screen.getByText('Add Customer')
    await user.click(addButton)

    // Try to submit without name - should show validation error
    const submitButton = screen.getByRole('button', { name: 'Create' })
    await user.click(submitButton)

    // Form should show validation error toast
    expect(mockAddToast).toHaveBeenCalledWith('Customer name is required', 'error')
    // Form should not be submitted (no toast should be called for successful creation)
    expect(mockAddToast).not.toHaveBeenCalledWith('Customer created successfully', 'success')
  })

  it('should display customer statistics', () => {
    const mockCustomers = [
      { id: '1', name: 'John Doe', phone: '123-456-7890', purchaseCount: 5, totalPurchases: 500, createdAt: '2023-01-01' },
      { id: '2', name: 'Jane Smith', phone: '098-765-4321', purchaseCount: 3, totalPurchases: 300, createdAt: '2023-01-02' }
    ]
    mockUseCustomers.customers = mockCustomers
    // The currency symbol is mocked in useSettings hook above

    render(<CustomerManagement />, { wrapper })

    expect(screen.getByText('🛒 5 purchases')).toBeInTheDocument()
    expect(screen.getByText('💰 $500.00')).toBeInTheDocument()
    expect(screen.getByText('🛒 3 purchases')).toBeInTheDocument()
    expect(screen.getByText('💰 $300.00')).toBeInTheDocument()
  })
})
