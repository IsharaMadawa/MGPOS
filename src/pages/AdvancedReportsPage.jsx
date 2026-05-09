import { useState, useEffect, useRef } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useOrg } from '../contexts/OrgContext'
import { useOrganizations } from '../hooks/useOrganizations'
import { useAdvancedReports } from '../hooks/useAdvancedReports'
import { useSettings } from '../hooks/useSettings'
import { logUserAction } from '../utils/logger'
import { useToast } from '../components/ToastContainer'
import { ReportPeriod } from '../constants/enums'

// Import chart components
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts'

// Import utility functions
import { CHART_COLORS, CHART_COLOR_ARRAY, formatChartCurrency, formatPercentage, getTrendIndicator, exportChartAsImage } from '../utils/chartUtils'

// Dashboard Components
function MetricCard({ title, value, previousValue, change, percentageChange, trend, currency = '$', showCurrency = true, icon: Icon }) {
  const trendColor = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'
  const changeColor = percentageChange >= 0 ? 'text-green-600' : 'text-red-600'

  return (
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        {Icon && <Icon className="h-5 w-5 text-gray-400" />}
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-1">
        {showCurrency ? currency : ''}{Number(value || 0).toLocaleString()}
      </div>
      <div className="flex items-center space-x-2 text-sm">
        <span className={changeColor}>
          {percentageChange >= 0 ? '+' : ''}{percentageChange?.toFixed(1)}%
        </span>
        <span className="text-gray-500">vs previous period</span>
      </div>
    </div>
  )
}

function ChartContainer({ title, children, actions, loading = false }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <div className="flex space-x-2">{actions}</div>
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      ) : (
        <div className="min-h-[300px]">{children}</div>
      )}
    </div>
  )
}

function InsightsPanel({ insights }) {
  if (!insights || insights.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Insights</h3>
        <p className="text-gray-500">No insights available for the selected period.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Insights</h3>
      <div className="space-y-3">
        {insights.map((insight, index) => (
          <div key={index} className={`p-3 rounded-lg border-l-4 ${
            insight.type === 'positive' ? 'bg-green-50 border-green-400' :
            insight.type === 'warning' ? 'bg-yellow-50 border-yellow-400' :
            'bg-blue-50 border-blue-400'
          }`}>
            <h4 className="font-medium text-gray-900 mb-1">{insight.title}</h4>
            <p className="text-sm text-gray-600">{insight.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AdvancedReportsPage() {
  const { userProfile, isAdmin, isSuperAdmin, loading: authLoading } = useAuth()
  const { selectedOrgId, getAdminOrganizations } = useOrg()
  const { organizations } = useOrganizations()
  const { 
    rawData, 
    analytics, 
    insights, 
    loading, 
    error, 
    dashboardSummary, 
    fetchAdvancedData, 
    getChartData, 
    getComparativeAnalysis, 
    exportData 
  } = useAdvancedReports()
  const { addToast } = useToast()
  const { currencySymbol } = useSettings()

  const [period, setPeriod] = useState(ReportPeriod.THIS_MONTH)
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [selectedOrgs, setSelectedOrgs] = useState([])
  const [activeChart, setActiveChart] = useState('revenue-trend')
  const [comparisonMode, setComparisonMode] = useState(false)

  // Chart refs for export
  const revenueChartRef = useRef(null)
  const productChartRef = useRef(null)
  const categoryChartRef = useRef(null)

  // Check if user has multi-organization admin access
  const adminOrganizations = getAdminOrganizations()
  const hasMultiOrgAccess = isSuperAdmin || (adminOrganizations.length > 1)

  // For super admin, determine current org
  const currentOrgId = isSuperAdmin ? selectedOrgId : userProfile?.orgId
  const currentOrg = organizations.find(o => o.id === currentOrgId)

  if (authLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  if (!isAdmin && !isSuperAdmin) {
    return <Navigate to="/" replace />
  }

  // Show message if no org selected for users with multi-org access
  if (hasMultiOrgAccess && !selectedOrgId && selectedOrgs.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Advanced Reports</h1>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
            <svg className="w-12 h-12 text-amber-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Select an Organization</h3>
            <p className="text-gray-600">Please select an organization from the navigation bar or use the multi-organization selector below to generate advanced reports.</p>
          </div>
        </div>
      </div>
    )
  }

  const handleGenerateReport = async () => {
    try {
      await fetchAdvancedData(period, customStart ? new Date(customStart) : null, customEnd ? new Date(customEnd) : null, selectedOrgs)
      
      // Log report generation
      await logUserAction(
        'ADVANCED_REPORT_GENERATE',
        `Generated advanced report for ${period}`,
        userProfile,
        currentOrgId,
        {
          period,
          comparisonMode,
          selectedOrgs: selectedOrgs.length > 0 ? selectedOrgs : [currentOrgId],
          chartType: activeChart
        }
      )
    } catch (err) {
      console.error('Error in handleGenerateReport:', err)
      addToast('Failed to generate advanced report. Please try again.', 'error')
    }
  }

  const handleExport = async (format, type) => {
    try {
      await exportData(format, type)
      addToast(`Report exported successfully as ${format.toUpperCase()}`, 'success')
      
      // Log export action
      await logUserAction(
        'ADVANCED_REPORT_EXPORT',
        `Exported ${type} report as ${format}`,
        userProfile,
        currentOrgId,
        { format, type, period }
      )
    } catch (err) {
      console.error('Export error:', err)
      addToast('Failed to export report. Please try again.', 'error')
    }
  }

  const handleTestExport = async () => {
    try {
      const { exportTestPDF } = await import('../utils/exportUtils')
      await exportTestPDF('test-pdf')
      addToast('Test PDF exported successfully', 'success')
    } catch (err) {
      console.error('Test export error:', err)
      addToast('Failed to export test PDF', 'error')
    }
  }

  const handleOrgToggle = (orgId) => {
    setSelectedOrgs(prev => 
      prev.includes(orgId) 
        ? prev.filter(id => id !== orgId)
        : [...prev, orgId]
    )
  }

  const handleChartExport = (chartRef, chartName) => {
    exportChartAsImage(chartRef, chartName)
    addToast(`${chartName} chart exported as image`, 'success')
  }

  // Get chart data
  const revenueChartData = getChartData('revenue-trend', { period })
  const productChartData = getChartData('product-performance', { topN: 10 })
  const categoryChartData = getChartData('category-distribution')
  const paymentChartData = getChartData('payment-methods')
  const hourlyChartData = getChartData('hourly-sales')

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Advanced Reports</h1>
          <div className="flex space-x-2">
            <button
              onClick={() => handleExport('pdf', 'sales-report')}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Export PDF</span>
            </button>
            <button
              onClick={() => handleExport('excel', 'sales-report')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v1a1 1 0 001 1h4a1 1 0 001-1v-1m3-2V8a2 2 0 00-2-2H8a2 2 0 00-2 2v6m3-2h6" />
              </svg>
              <span>Export Excel</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Period Selection */}
            <div>
              <label htmlFor="period-select" className="block text-sm font-medium text-gray-700 mb-2">Period</label>
              <select
                id="period-select"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value={ReportPeriod.TODAY}>Today</option>
                <option value={ReportPeriod.THIS_WEEK}>This Week</option>
                <option value={ReportPeriod.THIS_MONTH}>This Month</option>
                <option value={ReportPeriod.THIS_YEAR}>This Year</option>
                <option value={ReportPeriod.CUSTOM}>Custom Range</option>
              </select>
            </div>

            {/* Custom Date Range */}
            {period === ReportPeriod.CUSTOM && (
              <>
                <div>
                  <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <input
                    id="start-date"
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                  <input
                    id="end-date"
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </>
            )}

            {/* Organization Selection for Multi-Org Admins */}
            {hasMultiOrgAccess && (
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Organizations</label>
                <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto">
                  {organizations.map(org => (
                    <button
                      key={org.id}
                      onClick={() => handleOrgToggle(org.id)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        selectedOrgs.includes(org.id) || (!selectedOrgs.length && org.id === selectedOrgId)
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {org.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Generate Button */}
            <div className="flex items-end">
              <button
                onClick={handleGenerateReport}
                disabled={loading}
                className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Generating...' : 'Generate Report'}
              </button>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Summary */}
        {dashboardSummary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <MetricCard
              title="Total Revenue"
              value={dashboardSummary.revenue.current}
              previousValue={dashboardSummary.revenue.previous}
              change={dashboardSummary.revenue.change}
              percentageChange={dashboardSummary.revenue.percentageChange}
              trend={dashboardSummary.revenue.trend}
              currency={currencySymbol}
            />
            <MetricCard
              title="Transactions"
              value={dashboardSummary.transactions.count.current}
              previousValue={dashboardSummary.transactions.count.previous}
              change={dashboardSummary.transactions.count.change}
              percentageChange={dashboardSummary.transactions.count.percentageChange}
              trend={dashboardSummary.revenue.trend}
              showCurrency={false}
            />
            <MetricCard
              title="Average Transaction"
              value={dashboardSummary.transactions.averageValue.current}
              previousValue={dashboardSummary.transactions.averageValue.previous}
              change={dashboardSummary.transactions.averageValue.change}
              percentageChange={dashboardSummary.transactions.averageValue.percentageChange}
              trend={dashboardSummary.revenue.trend}
              currency={currencySymbol}
            />
            <MetricCard
              title="Forecast Revenue"
              value={dashboardSummary.revenue.forecast}
              currency={currencySymbol}
            />
          </div>
        )}

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Revenue Trend Chart */}
          <ChartContainer 
            title="Revenue Trend" 
            loading={loading}
            actions={
              <button
                onClick={() => handleChartExport(revenueChartRef, 'revenue-trend')}
                className="p-2 text-gray-500 hover:text-gray-700"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
            }
          >
            {revenueChartData && (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueChartData.data} ref={revenueChartRef}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <YAxis tickFormatter={(value) => formatChartCurrency(value, currencySymbol)} />
                  <Tooltip 
                    formatter={(value) => [formatChartCurrency(value, currencySymbol), 'Revenue']}
                    labelFormatter={(label) => new Date(label).toLocaleDateString()}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke={CHART_COLORS.primary} 
                    strokeWidth={2}
                    dot={{ fill: CHART_COLORS.primary }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </ChartContainer>

          {/* Product Performance Chart */}
          <ChartContainer 
            title="Top Products" 
            loading={loading}
            actions={
              <button
                onClick={() => handleChartExport(productChartRef, 'product-performance')}
                className="p-2 text-gray-500 hover:text-gray-700"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
            }
          >
            {productChartData && (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={productChartData.data} ref={productChartRef}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis tickFormatter={(value) => formatChartCurrency(value, currencySymbol)} />
                  <Tooltip 
                    formatter={(value) => [formatChartCurrency(value, currencySymbol), 'Revenue']}
                  />
                  <Bar dataKey="revenue" fill={CHART_COLORS.primary} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartContainer>
        </div>

        {/* Second Row of Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Category Distribution */}
          <ChartContainer 
            title="Sales by Category" 
            loading={loading}
            actions={
              <button
                onClick={() => handleChartExport(categoryChartRef, 'category-distribution')}
                className="p-2 text-gray-500 hover:text-gray-700"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
            }
          >
            {categoryChartData && (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart ref={categoryChartRef}>
                  <Pie
                    data={categoryChartData.data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name} ${percentage.toFixed(1)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryChartData.data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLOR_ARRAY[index % CHART_COLOR_ARRAY.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [formatChartCurrency(value, currencySymbol), 'Revenue']} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartContainer>

          {/* Payment Methods Distribution */}
          <ChartContainer title="Payment Methods" loading={loading}>
            {paymentChartData && (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={paymentChartData.data}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {paymentChartData.data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLOR_ARRAY[index % CHART_COLOR_ARRAY.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [formatChartCurrency(value, currencySymbol), 'Amount']}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        return (
                          <div className="bg-white p-2 border border-gray-300 rounded shadow">
                            <p className="font-semibold">{data.name}</p>
                            <p>{formatChartCurrency(data.value, currencySymbol)}</p>
                            <p className="text-sm text-gray-600">{data.count} transactions</p>
                            <p className="text-sm text-gray-600">{data.percentage.toFixed(1)}%</p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartContainer>
        </div>

        {/* Business Insights */}
        <div className="mb-6">
          <InsightsPanel insights={insights} />
        </div>

        {/* Detailed Tables Section */}
        {dashboardSummary && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Products Table */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Products</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Units</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Margin</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {dashboardSummary.topProducts.slice(0, 5).map((product, index) => (
                      <tr key={product.id || index} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm font-medium text-gray-900">{product.name}</td>
                        <td className="px-4 py-2 text-sm text-right text-gray-500">{product.unitsSold}</td>
                        <td className="px-4 py-2 text-sm text-right text-gray-900">{formatChartCurrency(product.revenue, currencySymbol)}</td>
                        <td className="px-4 py-2 text-sm text-right">
                          <span className={`font-medium ${
                            product.profitMargin >= 20 ? 'text-green-600' :
                            product.profitMargin >= 10 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {formatPercentage(product.profitMargin)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Categories Table */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Categories</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Units</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Margin</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {dashboardSummary.topCategories.slice(0, 5).map((category, index) => (
                      <tr key={category.category || index} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm font-medium text-gray-900">{category.category}</td>
                        <td className="px-4 py-2 text-sm text-right text-gray-500">{category.unitsSold}</td>
                        <td className="px-4 py-2 text-sm text-right text-gray-900">{formatChartCurrency(category.revenue, currencySymbol)}</td>
                        <td className="px-4 py-2 text-sm text-right">
                          <span className={`font-medium ${
                            category.profitMargin >= 20 ? 'text-green-600' :
                            category.profitMargin >= 10 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {formatPercentage(category.profitMargin)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
