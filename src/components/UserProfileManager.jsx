import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useOrg } from '../contexts/OrgContext'
import { useOrganizations } from '../hooks/useOrganizations'
import { useToast } from './ToastContainer'

export default function UserProfileManager() {
  const { userProfile, setPrimaryOrganization } = useAuth()
  const { selectedOrgId, setSelectedOrgId, getAccessibleOrganizations } = useOrg()
  const { organizations, loading } = useOrganizations()
  const { addToast } = useToast()
  const [isSettingPrimary, setIsSettingPrimary] = useState(false)

  const accessibleOrgs = getAccessibleOrganizations()

  const handleOrgSwitch = async (orgId) => {
    try {
      setSelectedOrgId(orgId)
      const org = organizations.find(o => o.id === orgId)
      addToast(`Switched to ${org?.name || orgId}`, 'success')
    } catch (error) {
      console.error('Error switching organization:', error)
      addToast('Failed to switch organization', 'error')
    }
  }

  const handleSetPrimary = async (orgId) => {
    if (!userProfile?.id) return
    
    try {
      setIsSettingPrimary(true)
      await setPrimaryOrganization(userProfile.id, orgId)
      addToast('Primary organization updated successfully', 'success')
    } catch (error) {
      console.error('Error setting primary organization:', error)
      addToast('Failed to set primary organization', 'error')
    } finally {
      setIsSettingPrimary(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">My Profile</h2>
          <p className="text-sm text-gray-500 mt-1">Manage your organization access and preferences</p>
        </div>
      </div>

      {/* User Info */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center text-white font-semibold">
            {userProfile?.displayName?.charAt(0)?.toUpperCase() || userProfile?.username?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-gray-900">{userProfile?.displayName || userProfile?.username}</p>
            <p className="text-sm text-gray-500">@{userProfile?.username}</p>
            {userProfile?.email && <p className="text-sm text-gray-500">{userProfile.email}</p>}
          </div>
        </div>
      </div>

      {/* Organization Access */}
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Organization Access</h3>
          <p className="text-sm text-gray-500 mb-4">
            You have access to {accessibleOrgs.length} organization{accessibleOrgs.length !== 1 ? 's' : ''}. 
            Your primary organization is automatically selected when you log in.
          </p>
        </div>

        {accessibleOrgs.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <p className="text-gray-500">No organization access assigned</p>
            <p className="text-sm text-gray-400 mt-1">Contact an administrator to get organization access</p>
          </div>
        ) : (
          <div className="space-y-3">
            {accessibleOrgs.map((orgAccess) => {
              const org = organizations.find(o => o.id === orgAccess.orgId)
              const isActive = selectedOrgId === orgAccess.orgId
              const isPrimary = userProfile?.primaryOrgId === orgAccess.orgId
              
              return (
                <div
                  key={orgAccess.orgId}
                  className={`
                    relative p-4 rounded-lg border transition-all cursor-pointer
                    ${isActive 
                      ? 'border-emerald-500 bg-emerald-50' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }
                  `}
                  onClick={() => handleOrgSwitch(orgAccess.orgId)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-medium text-gray-900 truncate">
                          {org?.name || orgAccess.orgId}
                        </p>
                        {isPrimary && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                            Primary
                          </span>
                        )}
                        {isActive && (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full font-medium">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Role: {orgAccess.role}</span>
                        {org?.description && <span>· {org.description}</span>}
                      </div>
                    </div>
                    
                    {!isPrimary && !isActive && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSetPrimary(orgAccess.orgId)
                        }}
                        disabled={isSettingPrimary}
                        className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {isSettingPrimary ? 'Setting...' : 'Set Primary'}
                      </button>
                    )}
                  </div>
                  
                  {isActive && (
                    <div className="absolute top-4 right-4">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Instructions */}
      {accessibleOrgs.length > 1 && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-800">
                <strong>Tip:</strong> Click on any organization to switch to it, or set a primary organization that will be automatically selected when you log in.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
