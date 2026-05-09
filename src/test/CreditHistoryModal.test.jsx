import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import CreditHistoryModal from '../components/CreditHistoryModal'
import { useCreditHistory, useCreditSummary, CreditTransactionType } from '../hooks/useCreditHistory'

// Mock hooks
vi.mock('../hooks/useCreditHistory', () => ({
  useCreditHistory: vi.fn(),
  useCreditSummary: vi.fn(),
  CreditTransactionType: {
    PURCHASE: 'purchase',
    PAYMENT: 'payment',
    ADJUSTMENT: 'adjustment'
  }
}))

// Mock settings
vi.mock('../hooks/useSettings', () => ({
  useSettings: () => ({
    currencySymbol: '$'
  })
}))

// Mock toast
vi.mock('../components/ToastContainer', () => ({
  useToast: () => ({
    addToast: vi.fn()
  })
}))

describe('CreditHistoryModal', () => {
  const mockCustomer = {
    id: 'customer-1',
    name: 'John Doe',
    phone: '123-456-7890',
    creditBalance: 50
  }

  const mockTransactions = [
    {
      id: 'trans-1',
      type: CreditTransactionType.PAYMENT,
      amount: 100,
      description: 'Initial payment',
      createdAt: '2023-01-01T10:00:00.000Z',
      createdByName: 'Admin User',
      runningBalance: 100
    },
    {
      id: 'trans-2',
      type: CreditTransactionType.PURCHASE,
      amount: 50,
      description: 'Credit purchase - Receipt #123',
      createdAt: '2023-01-02T14:30:00.000Z',
      createdByName: 'Cashier User',
      runningBalance: 50
    }
  ]

  const mockSummary = {
    totalCredit: 50,
    totalPurchases: 50,
    totalPayments: 100,
    totalAdjustments: 0,
    transactionCount: 2
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    useCreditHistory.mockReturnValue({
      transactions: mockTransactions,
      loading: false
    })
    
    useCreditSummary.mockReturnValue({
      summary: mockSummary,
      loading: false
    })
  })

  it('should render credit history modal when open', () => {
    render(
      <CreditHistoryModal
        isOpen={true}
        onClose={vi.fn()}
        customer={mockCustomer}
      />
    )

    expect(screen.getByText('Credit History')).toBeInTheDocument()
    expect(screen.getByText('John Doe (123-456-7890)')).toBeInTheDocument()
  })

  it('should not render when modal is closed', () => {
    render(
      <CreditHistoryModal
        isOpen={false}
        onClose={vi.fn()}
        customer={mockCustomer}
      />
    )

    expect(screen.queryByText('Credit History')).not.toBeInTheDocument()
  })

  it('should display summary cards', () => {
    render(
      <CreditHistoryModal
        isOpen={true}
        onClose={vi.fn()}
        customer={mockCustomer}
      />
    )

    expect(screen.getByText('Current Balance')).toBeInTheDocument()
    expect(screen.getByText('$50.00')).toBeInTheDocument()
    expect(screen.getByText('Total Payments')).toBeInTheDocument()
    expect(screen.getByText('$100.00')).toBeInTheDocument()
    expect(screen.getByText('Total Purchases')).toBeInTheDocument()
    expect(screen.getByText('$50.00')).toBeInTheDocument()
    expect(screen.getByText('Transactions')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('should display transaction list', () => {
    render(
      <CreditHistoryModal
        isOpen={true}
        onClose={vi.fn()}
        customer={mockCustomer}
      />
    )

    expect(screen.getByText('Initial payment')).toBeInTheDocument()
    expect(screen.getByText('Credit purchase - Receipt #123')).toBeInTheDocument()
    expect(screen.getByText('by Admin User')).toBeInTheDocument()
    expect(screen.getByText('by Cashier User')).toBeInTheDocument()
  })

  it('should show correct transaction types and amounts', () => {
    render(
      <CreditHistoryModal
        isOpen={true}
        onClose={vi.fn()}
        customer={mockCustomer}
      />
    )

    const paymentTransaction = screen.getAllByText('+$100.00')
    const purchaseTransaction = screen.getAllByText('-$50.00')

    expect(paymentTransaction).toHaveLength(1)
    expect(purchaseTransaction).toHaveLength(1)

    expect(screen.getByText('Purchase')).toBeInTheDocument()
    expect(screen.getByText('Payment')).toBeInTheDocument()
  })

  it('should display running balance for transactions', () => {
    render(
      <CreditHistoryModal
        isOpen={true}
        onClose={vi.fn()}
        customer={mockCustomer}
      />
    )

    expect(screen.getByText('Balance: $100.00')).toBeInTheDocument()
    expect(screen.getByText('Balance: $50.00')).toBeInTheDocument()
  })

  it('should show loading state', () => {
    useCreditHistory.mockReturnValue({
      transactions: [],
      loading: true
    })

    render(
      <CreditHistoryModal
        isOpen={true}
        onClose={vi.fn()}
        customer={mockCustomer}
      />
    )

    expect(screen.getByText('Loading credit history...')).toBeInTheDocument()
  })

  it('should show empty state when no transactions', () => {
    useCreditHistory.mockReturnValue({
      transactions: [],
      loading: false
    })

    render(
      <CreditHistoryModal
        isOpen={true}
        onClose={vi.fn()}
        customer={mockCustomer}
      />
    )

    expect(screen.getByText('No credit transactions found')).toBeInTheDocument()
    expect(screen.getByText('Credit transactions will appear here')).toBeInTheDocument()
  })

  it('should call onClose when close button is clicked', () => {
    const mockOnClose = vi.fn()

    render(
      <CreditHistoryModal
        isOpen={true}
        onClose={mockOnClose}
        customer={mockCustomer}
      />
    )

    const closeButton = screen.getByRole('button', { name: /close/i })
    fireEvent.click(closeButton)

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should call onClose when close button in footer is clicked', () => {
    const mockOnClose = vi.fn()

    render(
      <CreditHistoryModal
        isOpen={true}
        onClose={mockOnClose}
        customer={mockCustomer}
      />
    )

    const closeButton = screen.getByRole('button', { name: 'Close' })
    fireEvent.click(closeButton)

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should display adjustment transactions correctly', () => {
    const adjustmentTransactions = [
      {
        id: 'trans-3',
        type: CreditTransactionType.ADJUSTMENT,
        amount: 25,
        description: 'Credit adjustment',
        createdAt: '2023-01-03T09:00:00.000Z',
        createdByName: 'Admin User',
        runningBalance: 75
      }
    ]

    useCreditHistory.mockReturnValue({
      transactions: adjustmentTransactions,
      loading: false
    })

    render(
      <CreditHistoryModal
        isOpen={true}
        onClose={vi.fn()}
        customer={mockCustomer}
      />
    )

    expect(screen.getByText('Adjustment')).toBeInTheDocument()
    expect(screen.getByText('+$25.00')).toBeInTheDocument()
    expect(screen.getByText('Credit adjustment')).toBeInTheDocument()
  })

  it('should show transaction count in footer', () => {
    render(
      <CreditHistoryModal
        isOpen={true}
        onClose={vi.fn()}
        customer={mockCustomer}
      />
    )

    expect(screen.getByText('Showing 2 transactions')).toBeInTheDocument()
  })

  it('should handle singular transaction count', () => {
    useCreditHistory.mockReturnValue({
      transactions: [mockTransactions[0]],
      loading: false
    })

    render(
      <CreditHistoryModal
        isOpen={true}
        onClose={vi.fn()}
        customer={mockCustomer}
      />
    )

    expect(screen.getByText('Showing 1 transaction')).toBeInTheDocument()
  })

  it('should not render without customer', () => {
    render(
      <CreditHistoryModal
        isOpen={true}
        onClose={vi.fn()}
        customer={null}
      />
    )

    expect(screen.queryByText('Credit History')).not.toBeInTheDocument()
  })

  it('should display negative balance in red', () => {
    const negativeCustomer = {
      ...mockCustomer,
      creditBalance: -25
    }

    render(
      <CreditHistoryModal
        isOpen={true}
        onClose={vi.fn()}
        customer={negativeCustomer}
      />
    )

    const balanceElement = screen.getByText('-$25.00')
    expect(balanceElement).toHaveClass('text-red-700')
  })

  it('should display positive balance in blue', () => {
    render(
      <CreditHistoryModal
        isOpen={true}
        onClose={vi.fn()}
        customer={mockCustomer}
      />
    )

    const balanceElement = screen.getByText('$50.00')
    expect(balanceElement).toHaveClass('text-blue-700')
  })
})
