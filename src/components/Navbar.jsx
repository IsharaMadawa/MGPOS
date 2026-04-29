import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useOrg } from '../contexts/OrgContext'
import { useOrganizations } from '../hooks/useOrganizations'
import { useState } from 'react'
import PasswordChangeModal from './PasswordChangeModal'
import OrganizationSelector from './OrganizationSelector'

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { userProfile, logout, isAdmin, isSuperAdmin } = useAuth()
  const { selectedOrgId, setSelectedOrgId } = useOrg()
  const { organizations } = useOrganizations()
  const [showPasswordModal, setShowPasswordModal] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const handlePasswordChange = () => {
    setShowPasswordModal(true)
  }

  // Get current organization info using the new multi-organization structure
  const { getAccessibleOrganizations } = useOrg()
  const accessibleOrgs = getAccessibleOrganizations()
  const currentOrg = organizations.find(o => o.id === selectedOrgId)
  const orgName = currentOrg?.name || selectedOrgId || ''
  const hasMultipleOrgs = accessibleOrgs.length > 1

  return (
    <nav className="bg-emerald-700 text-white px-2 sm:px-3 py-2 flex items-center justify-between shadow-md flex-shrink-0 relative">
      <div className="flex items-center gap-2 sm:gap-3">
        <span className="text-sm sm:text-lg font-bold tracking-tight">MG POS</span>
        {isSuperAdmin ? (
          <select
            value={selectedOrgId || ''}
            onChange={e => setSelectedOrgId(e.target.value || null)}
            className="bg-emerald-600 text-emerald-100 text-xs sm:text-sm font-medium rounded px-2 py-1 border-none focus:outline-none focus:ring-2 focus:ring-emerald-400 max-w-[100px] sm:max-w-[140px] md:max-w-[180px]"
          >
            <option value="">Select Org</option>
            {organizations.map(org => (
              <option key={org.id} value={org.id}>{org.name}</option>
            ))}
          </select>
        ) : hasMultipleOrgs ? (
          // For users with multiple orgs, show a compact selector
          <select
            value={selectedOrgId || ''}
            onChange={e => setSelectedOrgId(e.target.value || null)}
            className="bg-emerald-600 text-emerald-100 text-xs sm:text-sm font-medium rounded px-2 py-1 border-none focus:outline-none focus:ring-2 focus:ring-emerald-400 max-w-[100px] sm:max-w-[140px] md:max-w-[180px]"
          >
            {accessibleOrgs.map(orgAccess => {
              const org = organizations.find(o => o.id === orgAccess.orgId)
              return (
                <option key={orgAccess.orgId} value={orgAccess.orgId}>
                  {org?.name || orgAccess.orgId}
                </option>
              )
            })}
          </select>
        ) : (
          orgName && (
            <span className="text-xs sm:text-sm font-medium text-emerald-200 px-2 py-1 bg-emerald-600 rounded truncate max-w-[100px] sm:max-w-[140px] md:max-w-[180px]">
              {orgName}
            </span>
          )
        )}
      </div>


      <div className="flex items-center gap-0.5 sm:gap-1 lg:gap-2 ml-auto">
        <Link
          to="/"
          className={`px-1.5 sm:px-2 lg:px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center ${
            location.pathname === '/'
              ? 'bg-emerald-800 text-white'
              : 'text-emerald-100 hover:bg-emerald-600'
          }`}
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span className="hidden lg:inline ml-1">POS</span>
        </Link>
        {isAdmin && (
          <Link
            to="/settings"
            className={`px-1.5 sm:px-2 lg:px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center ${
              location.pathname === '/settings'
                ? 'bg-emerald-800 text-white'
                : 'text-emerald-100 hover:bg-emerald-600'
            }`}
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="hidden lg:inline ml-1">Settings</span>
          </Link>
        )}
        {isAdmin && (
          <Link
            to="/reports"
            className={`px-1.5 sm:px-2 lg:px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center ${
              location.pathname === '/reports'
                ? 'bg-emerald-800 text-white'
                : 'text-emerald-100 hover:bg-emerald-600'
            }`}
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="hidden lg:inline ml-1">Reports</span>
          </Link>
        )}
        {isAdmin && (
          <Link
            to="/logs"
            className={`px-1.5 sm:px-2 lg:px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center ${
              location.pathname === '/logs'
                ? 'bg-emerald-800 text-white'
                : 'text-emerald-100 hover:bg-emerald-600'
            }`}
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span className="hidden lg:inline ml-1">Logs</span>
          </Link>
        )}
        {isAdmin && (
          <Link
            to="/billing-logs"
            className={`px-1.5 sm:px-2 lg:px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center ${
              location.pathname === '/billing-logs'
                ? 'bg-emerald-800 text-white'
                : 'text-emerald-100 hover:bg-emerald-600'
            }`}
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span className="hidden lg:inline ml-1">Bills</span>
          </Link>
        )}
        {isSuperAdmin && (
          <Link
            to="/super-admin"
            className={`px-1.5 sm:px-2 lg:px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center ${
              location.pathname === '/super-admin'
                ? 'bg-emerald-800 text-white'
                : 'text-emerald-100 hover:bg-emerald-600'
            }`}
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
            <span className="hidden lg:inline ml-1">Admin</span>
          </Link>
        )}
        {userProfile && (
          <div className="flex items-center gap-1 sm:gap-2 ml-1 sm:ml-2 pl-1 sm:pl-2 border-l border-emerald-500">
            <div className="hidden lg:block text-right">
              <div className="text-xs font-medium max-w-[100px] truncate">{userProfile.displayName}</div>
              <div className="text-[10px] text-emerald-200 capitalize">{userProfile.role}</div>
            </div>
            <div className="lg:hidden">
              <div className="text-xs font-medium text-emerald-100 max-w-[60px] truncate">{userProfile.displayName.slice(0, 8)}{userProfile.displayName.length > 8 ? '..' : ''}</div>
            </div>
            <button
              onClick={handlePasswordChange}
              className="px-1.5 sm:px-2 py-1.5 rounded-lg text-sm font-medium text-emerald-100 hover:bg-emerald-600 transition-colors"
              title="Change password"
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </button>
            <button
              onClick={handleLogout}
              className="px-1.5 sm:px-2 py-1.5 rounded-lg text-sm font-medium text-emerald-100 hover:bg-emerald-600 transition-colors flex items-center"
              title="Sign out"
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden xl:inline ml-1 text-xs">Logout</span>
            </button>
          </div>
        )}
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <PasswordChangeModal
          onClose={() => setShowPasswordModal(false)}
        />
      )}
    </nav>
  )
}
