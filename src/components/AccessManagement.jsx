import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useOrganizations } from '../hooks/useOrganizations'
import { useToast } from './ToastContainer'
import { logUserAction, LOG_TYPES } from '../utils/logger'
import { db } from '../firebase'
import { doc, setDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore'

export default function AccessManagement() {
  const { userProfile, isSuperAdmin } = useAuth()
  const { organizations } = useOrganizations()
  const { addToast } = useToast()
  
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [selectedUser, setSelectedUser] = useState(null)
  const [selectedOrganizations, setSelectedOrganizations] = useState([])
  const [updating, setUpdating] = useState(false)

  // Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersRef = collection(db, 'users')
        const snapshot = await getDocs(usersRef)
        const userList = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
        setUsers(userList)
      } catch (err) {
        console.error('Error fetching users:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
  }, [refreshTrigger])

  // Filter organizations based on user role
  const getAvailableOrganizations = () => {
    if (isSuperAdmin) {
      return organizations
    }
    
    // For organization admins, only show organizations they have admin access to
    const userOrgs = userProfile?.organizations || []
    return organizations.filter(org => 
      userOrgs.some(userOrg => 
        userOrg.orgId === org.id && userOrg.role === 'admin'
      )
    )
  }

  const availableOrgs = getAvailableOrganizations()

  const handleUserSelect = (userId) => {
    const user = users.find(u => u.id === userId)
    setSelectedUser(user)
    
    // Set selected organizations based on user's current access
    if (user?.organizations) {
      setSelectedOrganizations(user.organizations)
    } else {
      setSelectedOrganizations([])
    }
  }

  const toggleOrganizationAccess = (orgId) => {
    const isAlreadySelected = selectedOrganizations.some(org => org.orgId === orgId)
    
    if (isAlreadySelected) {
      // Remove access
      setSelectedOrganizations(prev => prev.filter(org => org.orgId !== orgId))
    } else {
      // Add access with default role
      setSelectedOrganizations(prev => [...prev, { orgId, role: 'user' }])
    }
  }

  const updateOrganizationRole = (orgId, newRole) => {
    setSelectedOrganizations(prev => 
      prev.map(org => 
        org.orgId === orgId ? { ...org, role: newRole } : org
      )
    )
  }

  const handleUpdateAccess = async () => {
    if (!selectedUser) return
    
    setUpdating(true)
    try {
      await setDoc(doc(db, 'users', selectedUser.id), {
        organizations: selectedOrganizations,
        primaryOrgId: selectedOrganizations.length > 0 ? selectedOrganizations[0].orgId : null,
        updatedAt: serverTimestamp()
      }, { merge: true })

      // Update local state
      setUsers(users.map(u => 
        u.id === selectedUser.id 
          ? { ...u, organizations: selectedOrganizations, primaryOrgId: selectedOrganizations.length > 0 ? selectedOrganizations[0].orgId : null }
          : u
      ))

      // Log access update
      try {
        await logUserAction(
          LOG_TYPES.USER_ACCESS_UPDATE,
          `Updated access for user: ${selectedUser.displayName} (${selectedUser.username}) - assigned to ${selectedOrganizations.length} organizations`,
          userProfile,
          null,
          {
            userId: selectedUser.id,
            username: selectedUser.username,
            displayName: selectedUser.displayName,
            organizations: selectedOrganizations,
            primaryOrgId: selectedOrganizations.length > 0 ? selectedOrganizations[0].orgId : null
          }
        )
      } catch (logError) {
        console.error('Failed to log access update:', logError)
      }

      addToast('Access updated successfully!', 'success', { important: true })
      setSelectedUser(null)
      setSelectedOrganizations([])
    } catch (err) {
      console.error('Error updating access:', err)
      addToast('Failed to update access', 'error')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="font-semibold text-gray-900 mb-2">Access Management</h2>
        <p className="text-sm text-gray-600">
          {isSuperAdmin 
            ? "Assign users to organizations and set their access levels."
            : "Assign users to your organizations and set their access levels."}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Selection */}
        <div>
          <h3 className="font-medium text-gray-900 mb-4">Select User</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-3">
            {users.length === 0 ? (
              <p className="text-sm text-gray-500">No users available. Create users first.</p>
            ) : (
              users.map(user => (
                <div
                  key={user.id}
                  onClick={() => handleUserSelect(user.id)}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedUser?.id === user.id
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{user.displayName}</p>
                      <p className="text-xs text-gray-500">@{user.username}</p>
                    </div>
                    <div className="text-xs text-gray-400">
                      {user.role === 'super_admin' ? organizations.length : (user.organizations?.length || 0)} orgs
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Organization Access */}
        <div>
          {selectedUser ? (
            selectedUser.role === 'super_admin' ? (
              <div className="text-center py-8">
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
                  <svg className="w-12 h-12 text-emerald-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Super Admin Access</h3>
                  <p className="text-gray-600 mb-4">Super Admin has access to all organizations by default.</p>
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-sm font-medium text-gray-700">Total Organizations:</p>
                    <p className="text-2xl font-bold text-emerald-600">{organizations.length}</p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <h3 className="font-medium text-gray-900 mb-4">
                  Assign Organizations for {selectedUser.displayName}
                </h3>
                
                {availableOrgs.length === 0 ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-sm text-amber-800">
                      {isSuperAdmin 
                        ? "No organizations available. Create organizations first."
                        : "You don't have admin access to any organizations."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-3">
                    {availableOrgs.map(org => {
                      const selectedOrg = selectedOrganizations.find(selected => selected.orgId === org.id)
                      const isSelected = !!selectedOrg
                      
                      return (
                        <div key={org.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleOrganizationAccess(org.id)}
                            className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{org.name}</p>
                            <p className="text-xs text-gray-500">{org.id}</p>
                          </div>
                          {isSelected && (
                            <select
                              value={selectedOrg.role}
                              onChange={(e) => updateOrganizationRole(org.id, e.target.value)}
                              className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                              <option value="user">User</option>
                              <option value="admin">Admin</option>
                            </select>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                <div className="mt-4 flex items-center gap-3">
                  <button
                    onClick={handleUpdateAccess}
                    disabled={updating}
                    className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  >
                    {updating ? 'Updating...' : 'Update Access'}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedUser(null)
                      setSelectedOrganizations([])
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Select a user to manage their organization access.</p>
            </div>
          )}
        </div>
      </div>

      {/* Current Access Summary */}
      {selectedUser && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="font-medium text-gray-900 mb-3">Current Access Summary</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            {selectedUser.role === 'super_admin' ? (
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-3">
                  <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-1">Super Admin</h4>
                <p className="text-sm text-gray-600 mb-3">Full access to all organizations</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Total Organizations:</p>
                    <p className="text-lg font-semibold text-emerald-600">{organizations.length}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Access Level:</p>
                    <p className="text-lg font-semibold text-emerald-600">Full</p>
                  </div>
                </div>
              </div>
            ) : selectedUser.organizations && selectedUser.organizations.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Total Organizations:</p>
                    <p className="text-lg font-semibold text-gray-900">{selectedUser.organizations.length}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Admin Access:</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {selectedUser.organizations.filter(org => org.role === 'admin').length}
                    </p>
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">Organization List:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedUser.organizations.map(org => (
                      <span
                        key={org.orgId}
                        className={`px-2 py-1 text-xs rounded font-medium ${
                          org.role === 'admin'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {org.orgId} ({org.role})
                      </span>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500">No organization access assigned yet.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
