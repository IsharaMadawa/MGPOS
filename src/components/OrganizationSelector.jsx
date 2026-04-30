import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useOrg } from '../contexts/OrgContext'
import { useOrganizations } from '../hooks/useOrganizations'
import { useToast } from './ToastContainer'

export default function OrganizationSelector({ className = '' }) {
  const { userProfile, setPrimaryOrganization } = useAuth()
  const { selectedOrgId, setSelectedOrgId, getAccessibleOrganizations } = useOrg()
  const { organizations, loading } = useOrganizations()
  const { addToast } = useToast()
  const [isSettingPrimary, setIsSettingPrimary] = useState(false)

  const accessibleOrgs = getAccessibleOrganizations()

  const handleOrgSelect = async (orgId) => {
    try {
      setSelectedOrgId(orgId)
      addToast(`Switched to ${organizations.find(org => org.id === orgId)?.name || orgId}`, 'success')
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
      <div className={`bg-white rounded-xl border border-gray-200 p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-3"></div>
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (accessibleOrgs.length <= 1) {
    return null // Don't show selector if user only has access to one organization
  }

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">Organization</h3>
        <span className="text-xs text-gray-500">
          {accessibleOrgs.length} accessible
        </span>
      </div>
      
      <div className="space-y-2">
        {accessibleOrgs.map((orgAccess) => {
          const org = organizations.find(o => o.id === orgAccess.orgId)
          const isActive = selectedOrgId === orgAccess.orgId
          const isPrimary = userProfile?.primaryOrgId === orgAccess.orgId
          
          return (
            <div
              key={orgAccess.orgId}
              className={`
                relative p-3 rounded-lg border transition-all cursor-pointer
                ${isActive 
                  ? 'border-emerald-500 bg-emerald-50' 
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }
              `}
              onClick={() => handleOrgSelect(orgAccess.orgId)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
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
                  <p className="text-sm text-gray-500 mt-1">
                    Role: {orgAccess.role}
                    {org?.description && ` · ${org.description}`}
                  </p>
                </div>
                
                {!isPrimary && !isActive && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSetPrimary(orgAccess.orgId)
                    }}
                    disabled={isSettingPrimary}
                    className="px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {isSettingPrimary ? 'Setting...' : 'Set Primary'}
                  </button>
                )}
              </div>
              
              {isActive && (
                <div className="absolute top-2 right-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                </div>
              )}
            </div>
          )
        })}
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-500">
          <span className="font-medium">Tip:</span> Your primary organization is automatically selected when you log in. You can switch between organizations anytime.
        </p>
      </div>
    </div>
  )
}
