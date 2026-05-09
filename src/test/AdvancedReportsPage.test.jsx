import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../contexts/AuthContext'
import { OrgProvider } from '../contexts/OrgContext'
import { ToastProvider } from '../components/ToastContainer'
import AdvancedReportsPage from '../pages/AdvancedReportsPage'
import * as useAdvancedReportsModule from '../hooks/useAdvancedReports'
import * as useAuthModule from '../contexts/AuthContext'
import * as useOrgModule from '../contexts/OrgContext'
import * as useOrganizationsModule from '../hooks/useOrganizations'
import * as useSettingsModule from '../hooks/useSettings'
import * as loggerModule from '../utils/logger'
import { LOG_TYPES } from '../utils/logger'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

// Mock the hooks and modules
vi.mock('../hooks/useAdvancedReports')
vi.mock('../contexts/AuthContext')
vi.mock('../contexts/OrgContext')
vi.mock('../hooks/useOrganizations')
vi.mock('../hooks/useSettings')
vi.mock('../utils/logger')
vi.mock('../components/ToastContainer', () => ({
  useToast: () => ({ addToast: vi.fn() }),
  ToastProvider: ({ children }) => children
}))

const mockAdvancedReports = {
  rawData: [],
  analytics: null,
  insights: [],
  loading: false,
  error: null,
  dashboardSummary: null,
  fetchAdvancedData: vi.fn(),
  getChartData: vi.fn(),
  getComparativeAnalysis: vi.fn(),
  exportData: vi.fn()
}

const mockAuth = {
  userProfile: {
    id: 'test-user-id',
    displayName: 'Test User',
    role: 'admin',
    orgId: 'test-org-id'
  },
  isAdmin: true,
  isSuperAdmin: false,
  loading: false
}

const mockOrg = {
  selectedOrgId: 'test-org-id',
  getAdminOrganizations: vi.fn(() => [])
}

const mockOrganizations = [
  { id: 'test-org-id', name: 'Test Organization' },
  { id: 'test-org-2', name: 'Test Organization 2' }
]

const mockSettings = {
  currencySymbol: '$'
}

describe('AdvancedReportsPage', () => {
  let originalInnerWidth

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Store original window.innerWidth
    originalInnerWidth = window.innerWidth
    
    useAdvancedReportsModule.useAdvancedReports.mockReturnValue(mockAdvancedReports)
    useAuthModule.useAuth.mockReturnValue(mockAuth)
    useOrgModule.useOrg.mockReturnValue(mockOrg)
    useOrganizationsModule.useOrganizations.mockReturnValue({ organizations: mockOrganizations })
    useSettingsModule.useSettings.mockReturnValue(mockSettings)
    loggerModule.logUserAction.mockResolvedValue()
  })

  afterEach(() => {
    // Restore original window.innerWidth
    if (originalInnerWidth !== undefined) {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: originalInnerWidth,
      })
    }
  })

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <OrgProvider>
            <ToastProvider>
              <AdvancedReportsPage />
            </ToastProvider>
          </OrgProvider>
        </AuthProvider>
      </BrowserRouter>
    )
  }

  describe('Access Control', () => {
    test('should redirect to login when user is not authenticated', () => {
      useAuthModule.useAuth.mockReturnValue({
        userProfile: null,
        isAdmin: false,
        isSuperAdmin: false,
        loading: false
      })

      renderComponent()

      // Should redirect to login page - the route protection handles this
      expect(screen.queryByText('Advanced Reports')).not.toBeInTheDocument()
    })

    test('should redirect to home when user is not admin', () => {
      useAuthModule.useAuth.mockReturnValue({
        userProfile: { role: 'user' },
        isAdmin: false,
        isSuperAdmin: false,
        loading: false
      })

      renderComponent()

      // Should redirect to home page
      expect(screen.queryByText('Advanced Reports')).not.toBeInTheDocument()
    })

    test('should display page for admin users', () => {
      renderComponent()

      expect(screen.getByText('Advanced Reports')).toBeInTheDocument()
      expect(screen.getByText('Generate Report')).toBeInTheDocument()
    })

    test('should display page for super admin users', () => {
      useAuthModule.useAuth.mockReturnValue({
        userProfile: { role: 'super_admin' },
        isAdmin: false,
        isSuperAdmin: true,
        loading: false
      })

      renderComponent()

      expect(screen.getByText('Advanced Reports')).toBeInTheDocument()
      expect(screen.getByText('Generate Report')).toBeInTheDocument()
    })
  })

  describe('Multi-Organization Support', () => {
    test('should show organization selector for super admin with multiple orgs', () => {
      useAuthModule.useAuth.mockReturnValue({
        userProfile: { role: 'super_admin' },
        isAdmin: false,
        isSuperAdmin: true,
        loading: false
      })
      useOrgModule.useOrg.mockReturnValue({
        selectedOrgId: null,
        getAdminOrganizations: vi.fn(() => mockOrganizations)
      })

      renderComponent()

      expect(screen.getByText('Select an Organization')).toBeInTheDocument()
      expect(screen.getByText('Please select an organization from the navigation bar or use the multi-organization selector below to generate advanced reports.')).toBeInTheDocument()
    })

    test('should show organization selector for multi-org admin', () => {
      useOrgModule.useOrg.mockReturnValue({
        selectedOrgId: null,
        getAdminOrganizations: vi.fn(() => mockOrganizations)
      })

      renderComponent()

      expect(screen.getByText('Select an Organization')).toBeInTheDocument()
    })

    test('should display organization buttons for multi-org access', () => {
      renderComponent()

      const orgButtons = screen.getAllByRole('button')
      const orgNames = orgButtons.map(btn => btn.textContent).filter(text => 
        text === 'Test Organization' || text === 'Test Organization 2'
      )

      expect(orgNames.length).toBeGreaterThan(0)
    })
  })

  describe('Dashboard Components', () => {
    test('should display metric cards when dashboard summary is available', () => {
      const mockDashboardSummary = {
        revenue: {
          current: 10000,
          previous: 8000,
          change: 2000,
          percentageChange: 25,
          trend: 'up'
        },
        transactions: {
          count: { current: 100, previous: 80 },
          averageValue: { current: 100, previous: 100 }
        },
        topProducts: [
          { id: '1', name: 'Product 1', revenue: 5000, unitsSold: 50, profitMargin: 20 },
          { id: '2', name: 'Product 2', revenue: 3000, unitsSold: 30, profitMargin: 15 }
        ],
        topCategories: [
          { category: 'Electronics', revenue: 8000, unitsSold: 80, profitMargin: 25 },
          { category: 'Clothing', revenue: 2000, unitsSold: 20, profitMargin: 10 }
        ]
      }

      mockAdvancedReports.dashboardSummary = mockDashboardSummary
      useAdvancedReportsModule.useAdvancedReports.mockReturnValue({
        ...mockAdvancedReports,
        dashboardSummary: mockDashboardSummary
      })

      renderComponent()

      expect(screen.getByText('Total Revenue')).toBeInTheDocument()
      expect(screen.getByText('$10,000')).toBeInTheDocument()
      expect(screen.getByText('+25.0%')).toBeInTheDocument()
      expect(screen.getByText('Transactions')).toBeInTheDocument()
      expect(screen.getByText('100')).toBeInTheDocument()
      expect(screen.getByText('Average Transaction')).toBeInTheDocument()
      expect(screen.getByText('$100')).toBeInTheDocument()
    })

    test('should display charts when chart data is available', () => {
      const mockChartData = {
        data: [
          { date: '2024-01-01', revenue: 1000 },
          { date: '2024-01-02', revenue: 1500 }
        ],
        type: 'line',
        title: 'Revenue Trend'
      }

      mockAdvancedReports.getChartData.mockReturnValue(mockChartData)
      useAdvancedReportsModule.useAdvancedReports.mockReturnValue({
        ...mockAdvancedReports,
        analytics: { revenue: { current: 2500 } }
      })

      renderComponent()

      expect(screen.getByText('Revenue Trend')).toBeInTheDocument()
      expect(screen.getByText('Top Products')).toBeInTheDocument()
      expect(screen.getByText('Sales by Category')).toBeInTheDocument()
      expect(screen.getByText('Payment Methods')).toBeInTheDocument()
    })

    test('should display insights when available', () => {
      const mockInsights = [
        {
          type: 'positive',
          title: 'Strong Revenue Growth',
          description: 'Revenue increased by 25.0% compared to previous period'
        },
        {
          type: 'warning',
          title: 'Revenue Decline',
          description: 'Revenue decreased by 10.0% compared to previous period'
        }
      ]

      mockAdvancedReports.insights = mockInsights
      useAdvancedReportsModule.useAdvancedReports.mockReturnValue({
        ...mockAdvancedReports,
        insights: mockInsights
      })

      renderComponent()

      expect(screen.getByText('Business Insights')).toBeInTheDocument()
      expect(screen.getByText('Strong Revenue Growth')).toBeInTheDocument()
      expect(screen.getByText('Revenue increased by 25.0% compared to previous period')).toBeInTheDocument()
      expect(screen.getByText('Revenue Decline')).toBeInTheDocument()
    })
  })

  describe('Export Functionality', () => {
    test('should call exportData when PDF export is clicked', async () => {
      const mockExportData = vi.fn().mockResolvedValue()
      mockAdvancedReports.exportData = mockExportData

      renderComponent()

      const pdfExportButton = screen.getByText('Export PDF')
      fireEvent.click(pdfExportButton)

      await waitFor(() => {
        expect(mockExportData).toHaveBeenCalledWith('pdf', 'sales-report', {})
      })
    })

    test('should call exportData when Excel export is clicked', async () => {
      const mockExportData = vi.fn().mockResolvedValue()
      mockAdvancedReports.exportData = mockExportData

      renderComponent()

      const excelExportButton = screen.getByText('Export Excel')
      fireEvent.click(excelExportButton)

      await waitFor(() => {
        expect(mockExportData).toHaveBeenCalledWith('excel', 'sales-report', {})
      })
    })

    test('should show success toast when export succeeds', async () => {
      const mockAddToast = vi.fn()
      const toastModule = await import('../components/ToastContainer')
      vi.mocked(toastModule.useToast).mockReturnValue({ addToast: mockAddToast })

      const mockExportData = vi.fn().mockResolvedValue()
      mockAdvancedReports.exportData = mockExportData

      renderComponent()

      const pdfExportButton = screen.getByText('Export PDF')
      fireEvent.click(pdfExportButton)

      await waitFor(() => {
        expect(mockAddToast).toHaveBeenCalledWith('Report exported successfully as PDF', 'success')
      })
    })
  })

  describe('Report Generation', () => {
    test('should call fetchAdvancedData when Generate Report is clicked', async () => {
      const mockFetchAdvancedData = vi.fn().mockResolvedValue()
      mockAdvancedReports.fetchAdvancedData = mockFetchAdvancedData

      renderComponent()

      const generateButton = screen.getByText('Generate Report')
      fireEvent.click(generateButton)

      await waitFor(() => {
        expect(mockFetchAdvancedData).toHaveBeenCalledWith(
          expect.any(String), // period
          null, // customStart
          null, // customEnd
          [] // selectedOrgs
        )
      })
    })

    test('should handle custom date range when period is CUSTOM', async () => {
      const mockFetchAdvancedData = vi.fn().mockResolvedValue()
      mockAdvancedReports.fetchAdvancedData = mockFetchAdvancedData

      renderComponent()

      // Select custom period
      const periodSelect = screen.getByDisplayValue('Period')
      fireEvent.change(periodSelect, { target: { value: 'custom' } })

      // Set custom dates
      const startDateInput = screen.getByPlaceholderText('Start Date')
      const endDateInput = screen.getByPlaceholderText('End Date')
      
      fireEvent.change(startDateInput, { target: { value: '2024-01-01' } })
      fireEvent.change(endDateInput, { target: { value: '2024-01-31' } })

      // Generate report
      const generateButton = screen.getByText('Generate Report')
      fireEvent.click(generateButton)

      await waitFor(() => {
        expect(mockFetchAdvancedData).toHaveBeenCalledWith(
          'custom',
          expect.any(Date), // customStart
          expect.any(Date), // customEnd
          [] // selectedOrgs
        )
      })
    })

    test('should log user action when report is generated', async () => {
      const mockLogUserAction = vi.fn().mockResolvedValue()
      loggerModule.logUserAction = mockLogUserAction

      renderComponent()

      const generateButton = screen.getByText('Generate Report')
      fireEvent.click(generateButton)

      await waitFor(() => {
        expect(mockLogUserAction).toHaveBeenCalledWith(
          LOG_TYPES.ADVANCED_REPORT_GENERATE,
          expect.stringContaining('Generated advanced report for'),
          mockAuth.userProfile,
          'test-org-id',
          expect.objectContaining({
            period: expect.any(String),
            comparisonMode: false,
            selectedOrgs: expect.any(Array),
            chartType: 'revenue-trend'
          })
        )
      })
    })
  })

  describe('Error Handling', () => {
    test('should display error message when error exists', () => {
      mockAdvancedReports.error = 'Failed to fetch data'
      useAdvancedReportsModule.useAdvancedReports.mockReturnValue({
        ...mockAdvancedReports,
        error: 'Failed to fetch data'
      })

      renderComponent()

      expect(screen.getByText('Error')).toBeInTheDocument()
      expect(screen.getByText('Failed to fetch data')).toBeInTheDocument()
    })

    test('should show loading state when loading', () => {
      mockAdvancedReports.loading = true
      useAdvancedReportsModule.useAdvancedReports.mockReturnValue({
        ...mockAdvancedReports,
        loading: true
      })

      renderComponent()

      expect(screen.getByText('Generating...')).toBeInTheDocument()
      const loadingSpinners = screen.getAllByRole('status')
      expect(loadingSpinners.length).toBeGreaterThan(0)
    })
  })

  describe('Responsive Design', () => {
    test('should be responsive on mobile view', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

      // Ensure organization is selected for responsive tests
      useOrgModule.useOrg.mockReturnValue({
        selectedOrgId: 'test-org-id',
        getAdminOrganizations: vi.fn(() => [])
      })

      renderComponent()

      // Should still display all main elements
      expect(screen.getByText('Advanced Reports')).toBeInTheDocument()
      expect(screen.getByText('Generate Report')).toBeInTheDocument()
    })

    test('should adapt layout for tablet view', () => {
      // Mock tablet viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      })

      // Ensure organization is selected for responsive tests
      useOrgModule.useOrg.mockReturnValue({
        selectedOrgId: 'test-org-id',
        getAdminOrganizations: vi.fn(() => [])
      })

      renderComponent()

      expect(screen.getByText('Advanced Reports')).toBeInTheDocument()
      // Component should render without errors in tablet view
      expect(screen.getByText('Generate Report')).toBeInTheDocument()
    })
  })
})
