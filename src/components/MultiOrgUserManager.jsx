import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useOrganizations } from '../hooks/useOrganizations'
import { useToast } from './ToastContainer'
import { logUserAction, LOG_TYPES } from '../utils/logger'
import { db } from '../firebase'
import { doc, setDoc, serverTimestamp, collection, query, where, getDocs, arrayUnion } from 'firebase/firestore'

export default function MultiOrgUserManager() {
  const { userProfile } = useAuth()
  const { organizations } = useOrganizations()
  const { addToast } = useToast()
  
  const [showNewUser, setShowNewUser] = useState(false)
  const [newUser, setNewUser] = useState({ 
    username: '', 
    password: '', 
    displayName: '', 
    email: '', 
    selectedOrganizations: []
  })
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

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

  const handleCreateUser = async (e) => {
    e.preventDefault()
    
    if (!newUser.username.trim() || !newUser.password || !newUser.displayName.trim()) {
      setError('Username, password, and display name are required')
      return
    }

    if (newUser.selectedOrganizations.length === 0) {
      setError('Please select at least one organization for this user')
      return
    }

    setCreating(true)
    setError('')

    try {
      // Check if username exists globally
      const usersRef = collection(db, 'users')
      const q = query(usersRef, where('username', '==', newUser.username.trim().toLowerCase()))
      const snapshot = await getDocs(q)

      if (!snapshot.empty) {
        setError('This username is already taken. Please choose a different username.')
        setCreating(false)
        return
      }

      const userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
      
      // Create user with multi-organization structure
      await setDoc(doc(db, 'users', userId), {
        username: newUser.username.trim().toLowerCase(),
        password: newUser.password,
        displayName: newUser.displayName.trim(),
        email: newUser.email.trim() || null,
        role: 'user', // Base role is user, org-specific roles in organizations array
        organizations: newUser.selectedOrganizations,
        primaryOrgId: newUser.selectedOrganizations[0]?.orgId, // Set first selected org as primary
        createdAt: serverTimestamp(),
      })

      // Reset form
      setNewUser({ 
        username: '', 
        password: '', 
        displayName: '', 
        email: '', 
        selectedOrganizations: []
      })
      setShowNewUser(false)
      addToast('User created successfully!', 'success', { important: true })
      
      // Log user creation
      try {
        await logUserAction(
          LOG_TYPES.USER_CREATE,
          `Created multi-org user: ${newUser.displayName} (${newUser.username}) with access to ${newUser.selectedOrganizations.length} organizations`,
          userProfile,
          null, // Super admin action
          {
            userId: userId,
            username: newUser.username,
            displayName: newUser.displayName,
            email: newUser.email,
            organizations: newUser.selectedOrganizations,
            primaryOrgId: newUser.selectedOrganizations[0]?.orgId
          }
        )
      } catch (logError) {
        console.error('Failed to log user creation:', logError)
      }
      
      // Trigger refresh
      setRefreshTrigger(prev => prev + 1)
    } catch (err) {
      console.error('Error creating user:', err)
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  const toggleOrganizationSelection = (orgId) => {
    setNewUser(prev => {
      const isSelected = prev.selectedOrganizations.some(org => org.orgId === orgId)
      if (isSelected) {
        return {
          ...prev,
          selectedOrganizations: prev.selectedOrganizations.filter(org => org.orgId !== orgId)
        }
      } else {
        return {
          ...prev,
          selectedOrganizations: [...prev.selectedOrganizations, { orgId, role: 'user' }]
        }
      }
    })
  }

  const updateOrganizationRole = (orgId, role) => {
    setNewUser(prev => ({
      ...prev,
      selectedOrganizations: prev.selectedOrganizations.map(org =>
        org.orgId === orgId ? { ...org, role } : org
      )
    }))
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-semibold text-gray-900">Multi-Organization User Management</h2>
        <button
          onClick={() => setShowNewUser(!showNewUser)}
          className="px-3 py-1.5 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors"
        >
          {showNewUser ? 'Cancel' : '+ New Multi-Org User'}
        </button>
      </div>

      {showNewUser && (
        <div className="bg-gray-50 rounded-xl p-6 mb-6">
          <h3 className="font-medium text-gray-900 mb-4">Create User with Multiple Organization Access</h3>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                <input
                  type="text"
                  value={newUser.username}
                  onChange={e => setNewUser({ ...newUser, username: e.target.value.toLowerCase() })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="johndoe"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={newUser.displayName}
                  onChange={e => setNewUser({ ...newUser, displayName: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="John Doe"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email <span className="text-gray-400">(optional)</span></label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Min 6 characters"
                  required
                  minLength={6}
                />
              </div>
            </div>

            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Organizations ({newUser.selectedOrganizations.length} selected)
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
                {organizations.length === 0 ? (
                  <p className="text-sm text-gray-500">No organizations available. Create an organization first.</p>
                ) : (
                  organizations.map(org => {
                    const selectedOrg = newUser.selectedOrganizations.find(selected => selected.orgId === org.id)
                    const isSelected = !!selectedOrg
                    return (
                      <div key={org.id} className="flex items-center gap-3 p-2 border border-gray-200 rounded-lg">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleOrganizationSelection(org.id)}
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
                  })
                )}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={creating || newUser.selectedOrganizations.length === 0}
                className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create User'}
              </button>
              <button
                type="button"
                onClick={() => setShowNewUser(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users List */}
      <div>
        <h3 className="font-medium text-gray-900 mb-4">All Users ({users.length})</h3>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No users yet. Create your first multi-organization user.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Organizations</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Primary Org</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{user.username}</td>
                    <td className="px-4 py-3 text-sm font-medium">{user.displayName}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{user.email || '-'}</td>
                    <td className="px-4 py-3 text-sm">
                      {user.organizations ? (
                        <div className="space-y-1">
                          {user.organizations.map(org => (
                            <div key={org.orgId} className="flex items-center gap-2">
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded font-medium">
                                {org.orgId}
                              </span>
                              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                {org.role}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400">No organizations assigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs rounded font-medium">
                        {user.primaryOrgId || user.orgId || '-'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
