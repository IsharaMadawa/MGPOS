import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CustomerSearchModal from '../components/CustomerSearchModal'
import { AuthProvider } from '../contexts/AuthContext'
import { OrgProvider } from '../contexts/OrgContext'

// Mock useCustomers hook
vi.mock('../hooks/useCustomers', () => ({
  useCustomers: () => ({
    customers: mockCustomers,
    createCustomer: vi.fn(),
    searchCustomers: vi.fn()
  })
}))

// Mock useAuth hook
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    userProfile: { displayName: 'Test User' }
  })
}))

// Mock ToastContainer
vi.mock('../components/ToastContainer', () => ({
  useToast: () => ({
    addToast: vi.fn()
  })
}))

const mockCustomers = [
  { id: '1', name: 'John Doe', phone: '123-456-7890', email: 'john@example.com' },
  { id: '2', name: 'Jane Smith', phone: '098-765-4321', email: 'jane@example.com' },
  { id: '3', name: 'Bob Johnson', phone: '555-123-4567', email: 'bob@example.com' }
]

const wrapper = ({ children }) => (
  <AuthProvider>
    <OrgProvider>
      {children}
    </OrgProvider>
  </AuthProvider>
)

describe('CustomerSearchModal', () => {
  const mockOnSelectCustomer = vi.fn()
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render modal when isOpen is true', () => {
    render(
      <CustomerSearchModal
        isOpen={true}
        onClose={mockOnClose}
        onSelectCustomer={mockOnSelectCustomer}
      />,
      { wrapper }
    )

    expect(screen.getByText('Select Customer')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Search by name, phone, or email...')).toBeInTheDocument()
  })

  it('should not render modal when isOpen is false', () => {
    render(
      <CustomerSearchModal
        isOpen={false}
        onClose={mockOnClose}
        onSelectCustomer={mockOnSelectCustomer}
      />,
      { wrapper }
    )

    expect(screen.queryByText('Select Customer')).not.toBeInTheDocument()
  })

  it('should display customers list', () => {
    render(
      <CustomerSearchModal
        isOpen={true}
        onClose={mockOnClose}
        onSelectCustomer={mockOnSelectCustomer}
      />,
      { wrapper }
    )

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    expect(screen.getByText('Bob Johnson')).toBeInTheDocument()
  })

  it('should filter customers by search term', async () => {
    const user = userEvent.setup()
    
    render(
      <CustomerSearchModal
        isOpen={true}
        onClose={mockOnClose}
        onSelectCustomer={mockOnSelectCustomer}
      />,
      { wrapper }
    )

    const searchInput = screen.getByPlaceholderText('Search by name, phone, or email...')
    await user.type(searchInput, 'John')

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument()
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument()
    })
  })

  it('should select customer when clicked', async () => {
    const user = userEvent.setup()
    
    render(
      <CustomerSearchModal
        isOpen={true}
        onClose={mockOnClose}
        onSelectCustomer={mockOnSelectCustomer}
      />,
      { wrapper }
    )

    await user.click(screen.getByText('John Doe'))

    expect(mockOnSelectCustomer).toHaveBeenCalledWith(mockCustomers[0])
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should close modal when close button is clicked', async () => {
    const user = userEvent.setup()
    
    render(
      <CustomerSearchModal
        isOpen={true}
        onClose={mockOnClose}
        onSelectCustomer={mockOnSelectCustomer}
      />,
      { wrapper }
    )

    const closeButton = screen.getByRole('button', { name: '' })
    await user.click(closeButton)

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should show create customer form when Create New Customer button is clicked', async () => {
    const user = userEvent.setup()
    
    render(
      <CustomerSearchModal
        isOpen={true}
        onClose={mockOnClose}
        onSelectCustomer={mockOnSelectCustomer}
      />,
      { wrapper }
    )

    const createButton = screen.getByText('Create New Customer')
    await user.click(createButton)

    expect(screen.getByText('Add New Customer')).toBeInTheDocument()
    expect(screen.getByLabelText('Name *')).toBeInTheDocument()
  })

  it('should show required selection message for credit purchases', () => {
    render(
      <CustomerSearchModal
        isOpen={true}
        onClose={mockOnClose}
        onSelectCustomer={mockOnSelectCustomer}
        requireSelection={true}
      />,
      { wrapper }
    )

    expect(screen.getByText('Customer selection required for credit purchases')).toBeInTheDocument()
  })

  it('should create new customer successfully', async () => {
    const mockCreateCustomer = vi.fn().mockResolvedValue({ id: 'new-customer', name: 'New Customer' })
    vi.mocked(require('../hooks/useCustomers').useCustomers).mockReturnValue({
      customers: mockCustomers,
      createCustomer: mockCreateCustomer,
      searchCustomers: vi.fn()
    })

    const user = userEvent.setup()
    
    render(
      <CustomerSearchModal
        isOpen={true}
        onClose={mockOnClose}
        onSelectCustomer={mockOnSelectCustomer}
      />,
      { wrapper }
    )

    // Click create new customer button
    const createButton = screen.getByText('Create New Customer')
    await user.click(createButton)

    // Fill form
    const nameInput = screen.getByLabelText('Name *')
    await user.type(nameInput, 'New Customer')

    const phoneInput = screen.getByLabelText('Phone')
    await user.type(phoneInput, '555-123-4567')

    // Submit form
    const submitButton = screen.getByText('Create Customer')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockCreateCustomer).toHaveBeenCalledWith({
        name: 'New Customer',
        phone: '555-123-4567',
        email: '',
        address: ''
      })
    })
  })

  it('should validate customer name is required', async () => {
    const user = userEvent.setup()
    
    render(
      <CustomerSearchModal
        isOpen={true}
        onClose={mockOnClose}
        onSelectCustomer={mockOnSelectCustomer}
      />,
      { wrapper }
    )

    // Click create new customer button
    const createButton = screen.getByText('Create New Customer')
    await user.click(createButton)

    // Try to submit without name
    const submitButton = screen.getByText('Create Customer')
    await user.click(submitButton)

    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText('Customer name is required')).toBeInTheDocument()
    })
  })

  it('should display customer credit balance', () => {
    const customersWithCredit = [
      { ...mockCustomers[0], creditBalance: 100 },
      { ...mockCustomers[1], creditBalance: -50 },
      { ...mockCustomers[2], creditBalance: 0 }
    ]

    vi.mocked(require('../hooks/useCustomers').useCustomers).mockReturnValue({
      customers: customersWithCredit,
      createCustomer: vi.fn(),
      searchCustomers: vi.fn()
    })

    render(
      <CustomerSearchModal
        isOpen={true}
        onClose={mockOnClose}
        onSelectCustomer={mockOnSelectCustomer}
      />,
      { wrapper }
    )

    expect(screen.getByText('+$100.00')).toBeInTheDocument()
    expect(screen.getByText('-$50.00')).toBeInTheDocument()
  })

  it('should cancel customer creation', async () => {
    const user = userEvent.setup()
    
    render(
      <CustomerSearchModal
        isOpen={true}
        onClose={mockOnClose}
        onSelectCustomer={mockOnSelectCustomer}
      />,
      { wrapper }
    )

    // Click create new customer button
    const createButton = screen.getByText('Create New Customer')
    await user.click(createButton)

    // Click cancel
    const cancelButton = screen.getByText('Cancel')
    await user.click(cancelButton)

    // Should return to search view
    expect(screen.getByText('Select Customer')).toBeInTheDocument()
    expect(screen.getByText('Create New Customer')).toBeInTheDocument()
  })
})
