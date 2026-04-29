import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../contexts/AuthContext'
import { OrgProvider } from '../contexts/OrgContext'
import BillingLogsPage from '../pages/BillingLogsPage'
import { useBillingLogs } from '../hooks/useBillingLogs'
import { useSettings } from '../hooks/useSettings'
import { useAuth } from '../contexts/AuthContext'
import { useOrg } from '../contexts/OrgContext'
import { logUserAction } from '../utils/logger'

// Mock the hooks
vi.mock('../hooks/useBillingLogs')
vi.mock('../hooks/useSettings')
vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
  AuthProvider: ({ children }) => children
}))
vi.mock('../contexts/OrgContext', () => ({
  useOrg: vi.fn(),
  OrgProvider: ({ children }) => children
}))
vi.mock('../utils/logger')

// Mock window.open
const mockWindowOpen = vi.fn()
Object.defineProperty(window, 'open', {
  writable: true,
  value: mockWindowOpen
})

// Mock the print window
const mockPrintWindow = {
  document: {
    write: vi.fn(),
    close: vi.fn()
  },
  onload: null,
  close: vi.fn()
}

const mockBillingLogs = [
  {
    id: '1',
    receiptNo: '123456',
    createdAt: new Date().toISOString(),
    cashierName: 'John Doe',
    cart: [
      {
        id: 'item1',
        name: 'Test Product',
        price: 10.00,
        qty: 2,
        selectedUnit: 'Each'
      }
    ],
    subtotal: 20.00,
    total: 22.00,
    itemCount: 1
  },
  {
    id: '2',
    receiptNo: '789012',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
    cashierName: 'Jane Smith',
    cart: [
      {
        id: 'item2',
        name: 'Old Product',
        price: 15.00,
        qty: 1,
        selectedUnit: 'Each'
      }
    ],
    subtotal: 15.00,
    total: 16.50,
    itemCount: 1
  }
]

const mockSettings = {
  reprintEnabled: true,
  currency: 'USD',
  taxEnabled: true,
  taxRate: 10,
  discountMode: 'global',
  globalDiscount: 0,
  storeInfo: {
    name: 'Test Store',
    address: '123 Test St',
    phone: '555-1234',
    footer: 'Thank you!'
  }
}

const mockUser = {
  id: 'user1',
  displayName: 'Test User',
  username: 'testuser'
}

const mockOrg = {
  selectedOrgId: 'org1'
}

function TestWrapper({ children }) {
  return (
    <BrowserRouter>
      {children}
    </BrowserRouter>
  )
}

describe('BillingLogsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    useBillingLogs.mockReturnValue({
      logs: mockBillingLogs,
      loading: false
    })
    
    useSettings.mockReturnValue({
      settings: mockSettings
    })
    
    useAuth.mockReturnValue({
      userProfile: mockUser,
      isSuperAdmin: false
    })
    
    useOrg.mockReturnValue(mockOrg)
    
    logUserAction.mockResolvedValue()
    
    mockWindowOpen.mockReturnValue(mockPrintWindow)
  })

  test('renders billing logs page correctly', () => {
    render(
      <TestWrapper>
        <BillingLogsPage />
      </TestWrapper>
    )

    expect(screen.getByText('Billing Logs')).toBeInTheDocument()
    expect(screen.getByText('View and reprint bills from your organization')).toBeInTheDocument()
    expect(screen.getByText('Reprint is enabled for today\'s bills only')).toBeInTheDocument()
  })

  test('displays billing logs in table', () => {
    render(
      <TestWrapper>
        <BillingLogsPage />
      </TestWrapper>
    )

    expect(screen.getByText('#123456')).toBeInTheDocument()
    expect(screen.getByText('#789012')).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    expect(screen.getByText('$22.00')).toBeInTheDocument()
    expect(screen.getByText('$16.50')).toBeInTheDocument()
  })

  test('shows reprint button for today\'s bills when enabled', () => {
    render(
      <TestWrapper>
        <BillingLogsPage />
      </TestWrapper>
    )

    const reprintButtons = screen.getAllByText('Reprint')
    expect(reprintButtons).toHaveLength(1) // Only today's bill should show reprint
  })

  test('shows disabled state for yesterday\'s bills', () => {
    render(
      <TestWrapper>
        <BillingLogsPage />
      </TestWrapper>
    )

    expect(screen.getByText('Not today')).toBeInTheDocument()
  })

  test('shows disabled state when reprint is disabled', () => {
    useSettings.mockReturnValue({
      settings: { ...mockSettings, reprintEnabled: false }
    })

    render(
      <TestWrapper>
        <BillingLogsPage />
      </TestWrapper>
    )

    expect(screen.getAllByText('Disabled')).toHaveLength(2)
  })

  test('handles reprint action correctly', async () => {
    render(
      <TestWrapper>
        <BillingLogsPage />
      </TestWrapper>
    )

    const reprintButton = screen.getByText('Reprint')
    fireEvent.click(reprintButton)

    await waitFor(() => {
      expect(logUserAction).toHaveBeenCalledWith(
        'bill_reprinted',
        'Reprinted bill #123456',
        mockUser,
        'org1'
      )
    })

    expect(mockWindowOpen).toHaveBeenCalledWith('', '_blank', 'width=420,height=700')
    expect(mockPrintWindow.document.write).toHaveBeenCalledWith(
      expect.stringContaining('*** REPRINT ***')
    )
    expect(mockPrintWindow.document.write).toHaveBeenCalledWith(
      expect.stringContaining('Reprinted:')
    )
  })

  test('filters work correctly', async () => {
    render(
      <TestWrapper>
        <BillingLogsPage />
      </TestWrapper>
    )

    // Show filters - wait for button to be available
    await waitFor(() => {
      expect(screen.getByText('Show Filters')).toBeInTheDocument()
    })
    const showFiltersButton = screen.getByText('Show Filters')
    fireEvent.click(showFiltersButton)

    // Filter by receipt number
    const receiptInput = screen.getByPlaceholderText('Enter receipt number')
    fireEvent.change(receiptInput, { target: { value: '123456' } })

    expect(screen.getByText('#123456')).toBeInTheDocument()
    expect(screen.queryByText('#789012')).not.toBeInTheDocument()
  })

  test('clear filters works correctly', async () => {
    render(
      <TestWrapper>
        <BillingLogsPage />
      </TestWrapper>
    )

    // Show filters - wait for button to be available
    await waitFor(() => {
      expect(screen.getByText('Show Filters')).toBeInTheDocument()
    })
    const showFiltersButton = screen.getByText('Show Filters')
    fireEvent.click(showFiltersButton)

    // Filter by receipt number
    const receiptInput = screen.getByPlaceholderText('Enter receipt number')
    fireEvent.change(receiptInput, { target: { value: '123456' } })

    // Clear filters
    const clearButton = screen.getByText('Clear Filters')
    fireEvent.click(clearButton)

    expect(screen.getByText('#123456')).toBeInTheDocument()
    expect(screen.getByText('#789012')).toBeInTheDocument()
  })

  test('load more functionality works', async () => {
    const manyLogs = Array.from({ length: 100 }, (_, i) => ({
      ...mockBillingLogs[0],
      id: i.toString(),
      receiptNo: `${123456 + i}`,
      createdAt: new Date().toISOString()
    }))

    useBillingLogs.mockReturnValue({
      logs: manyLogs,
      loading: false
    })

    render(
      <TestWrapper>
        <BillingLogsPage />
      </TestWrapper>
    )

    // Wait for Load More button to be available
    await waitFor(() => {
      expect(screen.getByText('Load More')).toBeInTheDocument()
    })
    const loadMoreButton = screen.getByText('Load More')
    fireEvent.click(loadMoreButton)

    // Should show more logs (pagination increases)
    expect(screen.getByText('#123500')).toBeInTheDocument()
  })
})
