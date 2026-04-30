import { useState, useEffect } from 'react'
import { useLogs, useAllLogs, useLogStats, getLogTypeName, getLogLevelColor } from '../hooks/useLogs'
import { useAuth } from '../contexts/AuthContext'
import { useOrg } from '../contexts/OrgContext'
import { useOrganizations } from '../hooks/useOrganizations'
import { LOG_LEVELS, LOG_TYPES } from '../utils/logger'

export default function LogsPage() {
  const [filters, setFilters] = useState({
    level: '',
    type: '',
    userId: '',
    startDate: '',
    endDate: ''
  })
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const logsPerPage = 50

  const { userProfile, isSuperAdmin } = useAuth()
  const { selectedOrgId, setSelectedOrgId } = useOrg()
  const { organizations } = useOrganizations()
  
  // Use appropriate hook based on user role
  const { logs, loading, error } = isSuperAdmin 
    ? useAllLogs({ 
        limit: logsPerPage * currentPage,
        orgId: selectedOrgId || null,
        ...filters 
      })
    : useLogs({ 
        limit: logsPerPage * currentPage,
        ...filters 
      })
  
  const { stats, loading: statsLoading } = useLogStats()

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setFilters({
      level: '',
      type: '',
      userId: '',
      startDate: '',
      endDate: ''
    })
    setCurrentPage(1)
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A'
    try {
      return new Date(timestamp).toLocaleString()
    } catch {
      return 'Invalid Date'
    }
  }

  const getLevelBadgeClass = (level) => {
    const colors = {
      [LOG_LEVELS.INFO]: 'bg-blue-100 text-blue-800',
      [LOG_LEVELS.WARNING]: 'bg-yellow-100 text-yellow-800',
      [LOG_LEVELS.ERROR]: 'bg-red-100 text-red-800',
      [LOG_LEVELS.SUCCESS]: 'bg-green-100 text-green-800'
    }
    return colors[level] || 'bg-gray-100 text-gray-800'
  }

  const filteredLogs = logs.filter((log, index) => index < logsPerPage * currentPage)

  if (loading || statsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-red-600 text-center">
          <h2 className="text-2xl font-bold mb-4">Error Loading Logs</h2>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">System Logs</h1>
          <p className="mt-2 text-gray-600">
            {isSuperAdmin ? 'View system-wide logs across all organizations' : 'View logs for your organization'}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Total Logs</h3>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Info</h3>
            <p className="text-2xl font-bold text-blue-600">{stats.byLevel[LOG_LEVELS.INFO] || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Warnings</h3>
            <p className="text-2xl font-bold text-yellow-600">{stats.byLevel[LOG_LEVELS.WARNING] || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Errors</h3>
            <p className="text-2xl font-bold text-red-600">{stats.byLevel[LOG_LEVELS.ERROR] || 0}</p>
          </div>
        </div>

        {/* Organization Filter for Super Admin */}
        {isSuperAdmin && (
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Organization
            </label>
            <select
              value={selectedOrgId || ''}
              onChange={(e) => setSelectedOrgId(e.target.value || null)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">All Organizations</option>
              {organizations.map(org => (
                <option key={org.id} value={org.id}>
                  {org.name} ({org.code})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="text-emerald-600 hover:text-emerald-800 text-sm font-medium"
            >
              {showFilters ? 'Hide' : 'Show'} Filters
            </button>
          </div>

          {showFilters && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                  <select
                    value={filters.level}
                    onChange={(e) => handleFilterChange('level', e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">All Levels</option>
                    <option value={LOG_LEVELS.INFO}>Info</option>
                    <option value={LOG_LEVELS.WARNING}>Warning</option>
                    <option value={LOG_LEVELS.ERROR}>Error</option>
                    <option value={LOG_LEVELS.SUCCESS}>Success</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={filters.type}
                    onChange={(e) => handleFilterChange('type', e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">All Types</option>
                    <option value={LOG_TYPES.USER_LOGIN}>User Login</option>
                    <option value={LOG_TYPES.USER_LOGOUT}>User Logout</option>
                    <option value={LOG_TYPES.USER_SIGNUP}>User Signup</option>
                    <option value={LOG_TYPES.PRODUCT_CREATE}>Product Created</option>
                    <option value={LOG_TYPES.PRODUCT_UPDATE}>Product Updated</option>
                    <option value={LOG_TYPES.PRODUCT_DELETE}>Product Deleted</option>
                    <option value={LOG_TYPES.CATEGORY_CREATE}>Category Created</option>
                    <option value={LOG_TYPES.CATEGORY_UPDATE}>Category Updated</option>
                    <option value={LOG_TYPES.CATEGORY_DELETE}>Category Deleted</option>
                    <option value={LOG_TYPES.SALE_CREATE}>Sale Created</option>
                    <option value={LOG_TYPES.SETTINGS_UPDATE}>Settings Updated</option>
                    <option value={LOG_TYPES.SYSTEM_ERROR}>System Error</option>
                    <option value={LOG_TYPES.SYSTEM_WARNING}>System Warning</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                  <input
                    type="text"
                    value={filters.userId}
                    onChange={(e) => handleFilterChange('userId', e.target.value)}
                    placeholder="Enter user ID"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="datetime-local"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="datetime-local"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  Clear Filters
                </button>
              </div>
            </>
          )}
        </div>

        {/* Logs Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Recent Logs ({filteredLogs.length} of {logs.length})
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  {isSuperAdmin && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Organization
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={isSuperAdmin ? "6" : "5"} className="px-6 py-12 text-center text-gray-500">
                      No logs found matching your criteria
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(log.timestamp || log.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getLevelBadgeClass(log.level)}`}>
                          {log.level?.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getLogTypeName(log.type)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div className="font-medium">{log.userName}</div>
                          <div className="text-gray-500 text-xs">{log.userId}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-md truncate">
                        {log.description}
                      </td>
                      {isSuperAdmin && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {log.orgId || 'System'}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Load More */}
          {filteredLogs.length < logs.length && (
            <div className="px-4 py-3 border-t border-gray-200 text-center">
              <button
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="px-4 py-2 text-sm font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-md"
              >
                Load More
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
