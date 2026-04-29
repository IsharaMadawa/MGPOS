import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useOrg } from '../contexts/OrgContext'
import { useOrganizations } from '../hooks/useOrganizations'
import { useToast } from './ToastContainer'
import { collection, query, where, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

export default function UserOrganizationManager({ userId, userRole = 'user' }) {
  const { userProfile, addUserToOrganization, removeUserFromOrganization, setPrimaryOrganization } = useAuth()
  const { selectedOrgId } = useOrg()
  const { organizations, loading } = useOrganizations()
  const { addToast } = useToast()
  const [isAdding, setIsAdding] = useState(false)
  const [selectedOrgToAdd, setSelectedOrgToAdd] = useState('')
  const [roleForNewOrg, setRoleForNewOrg] = useState('user')

  const fetchUserOrganizations = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId))
      if (!userDoc.exists()) return []
      
      const userData = userDoc.data()
      let userOrgs = userData.organizations || []
      
      // Backward compatibility
      if (userData.orgId && !userOrgs.length) {
        userOrgs = [{ orgId: userData.orgId, role: userData.role || 'user' }]
      }
      
      return userOrgs
    } catch (error) {
      console.error('Error fetching user organizations:', error)
      return []
    }
  }

  const [userOrganizations, setUserOrganizations] = useState([])
  const [loadingUserOrgs, setLoadingUserOrgs] = useState(true)

  // Fetch user's current organizations
  const refreshUserOrganizations = async () => {
    setLoadingUserOrgs(true)
    try {
      const orgs = await fetchUserOrganizations()
      setUserOrganizations(orgs)
    } catch (error) {
      console.error('Error refreshing user organizations:', error)
    } finally {
      setLoadingUserOrgs(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    if (userId) {
      refreshUserOrganizations()
    }
  }, [userId])

  // Get available organizations (not already assigned to user)
  const availableOrganizations = organizations.filter(org => 
    !userOrganizations.find(userOrg => userOrg.orgId === org.id)
  )

  const handleAddOrganization = async () => {
    if (!selectedOrgToAdd) {
      addToast('Please select an organization', 'error')
      return
    }

    try {
      setIsAdding(true)
      await addUserToOrganization(userId, selectedOrgToAdd, roleForNewOrg)
      await refreshUserOrganizations()
      setSelectedOrgToAdd('')
      setRoleForNewOrg('user')
      addToast('User added to organization successfully', 'success')
    } catch (error) {
      console.error('Error adding user to organization:', error)
      addToast(error.message || 'Failed to add user to organization', 'error')
    } finally {
      setIsAdding(false)
    }
  }

  const handleRemoveOrganization = async (orgId) => {
    if (!confirm('Are you sure you want to remove this user from the organization?')) return

    try {
      await removeUserFromOrganization(userId, orgId)
      await refreshUserOrganizations()
      addToast('User removed from organization successfully', 'success')
    } catch (error) {
      console.error('Error removing user from organization:', error)
      addToast(error.message || 'Failed to remove user from organization', 'error')
    }
  }

  const handleSetPrimary = async (orgId) => {
    try {
      await setPrimaryOrganization(userId, orgId)
      await refreshUserOrganizations()
      addToast('Primary organization updated successfully', 'success')
    } catch (error) {
      console.error('Error setting primary organization:', error)
      addToast(error.message || 'Failed to set primary organization', 'error')
    }
  }

  if (loading || loadingUserOrgs) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="font-semibold text-gray-900 mb-4">Organization Access</h3>
      
      {/* Current Organizations */}
      <div className="space-y-3 mb-4">
        {userOrganizations.length === 0 ? (
          <p className="text-gray-500 text-sm">No organization access assigned</p>
        ) : (
          userOrganizations.map((userOrg) => {
            const org = organizations.find(o => o.id === userOrg.orgId)
            const isPrimary = userOrg.orgId === userProfile?.primaryOrgId
            
            return (
              <div
                key={userOrg.orgId}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">
                      {org?.name || userOrg.orgId}
                    </p>
                    {isPrimary && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                        Primary
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">Role: {userOrg.role}</p>
                </div>
                
                <div className="flex items-center gap-2">
                  {!isPrimary && (
                    <button
                      onClick={() => handleSetPrimary(userOrg.orgId)}
                      className="px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Set Primary
                    </button>
                  )}
                  
                  {userOrganizations.length > 1 && (
                    <button
                      onClick={() => handleRemoveOrganization(userOrg.orgId)}
                      className="px-3 py-1 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Add New Organization */}
      {availableOrganizations.length > 0 && (
        <div className="border-t border-gray-200 pt-4">
          <h4 className="font-medium text-gray-900 mb-3">Add Organization Access</h4>
          <div className="flex gap-2">
            <select
              value={selectedOrgToAdd}
              onChange={(e) => setSelectedOrgToAdd(e.target.value)}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              <option value="">Select organization...</option>
              {availableOrganizations.map(org => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
            
            <select
              value={roleForNewOrg}
              onChange={(e) => setRoleForNewOrg(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            
            <button
              onClick={handleAddOrganization}
              disabled={!selectedOrgToAdd || isAdding}
              className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAdding ? 'Adding...' : 'Add'}
            </button>
          </div>
        </div>
      )}

      {availableOrganizations.length === 0 && userOrganizations.length > 0 && (
        <div className="border-t border-gray-200 pt-4">
          <p className="text-sm text-gray-500">
            User has access to all available organizations
          </p>
        </div>
      )}
    </div>
  )
}
