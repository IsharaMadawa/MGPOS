import { useState, useEffect } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useOrganizations, useOrgUsers } from '../hooks/useOrganizations'
import { useToast } from '../components/ToastContainer'
import { logUserAction, LOG_TYPES } from '../utils/logger'
import { db } from '../firebase'
import { doc, setDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore'
import PasswordChangeModal from '../components/PasswordChangeModal'

export default function SuperAdminPage() {
  const { isSuperAdmin, loading, userProfile } = useAuth()
  const navigate = useNavigate()
  const { organizations, createOrganization, deleteOrganization, loading: orgsLoading } = useOrganizations()
  const { addToast } = useToast()
  
  const [showNewOrg, setShowNewOrg] = useState(false)
  const [newOrg, setNewOrg] = useState({ code: '', name: '', description: '' })
  const [saving, setSaving] = useState(false)

  // User creation state
  const [showNewUser, setShowNewUser] = useState(false)
  const [selectedOrg, setSelectedOrg] = useState('')
  const [newUser, setNewUser] = useState({ username: '', password: '', displayName: '', email: '', role: 'user' })
  const [creatingUser, setCreatingUser] = useState(false)

  // Password change state
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState(null)

  // Refresh trigger for user lists
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  if (loading || orgsLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  if (!isSuperAdmin) {
    return <Navigate to="/" replace />
  }

  const handleCreateOrg = async (e) => {
    e.preventDefault()
    if (!newOrg.code.trim() || !newOrg.name.trim()) return
    
    setSaving(true)
    try {
      await createOrganization({
        code: newOrg.code.trim().toUpperCase(),
        name: newOrg.name.trim(),
        description: newOrg.description.trim(),
      })
      setNewOrg({ code: '', name: '', description: '' })
      setShowNewOrg(false)
    } catch (error) {
      console.error('Error creating organization:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteOrg = async (code) => {
    if (!confirm(`Are you sure you want to delete organization "${code}"? This cannot be undone.`)) return
    try {
      await deleteOrganization(code)
    } catch (error) {
      console.error('Error deleting organization:', error)
    }
  }

  const handleCreateUser = async (e) => {
    e.preventDefault()
    if (!selectedOrg || !newUser.username.trim() || !newUser.password || !newUser.displayName.trim()) return
    
    setCreatingUser(true)
    try {
      // Check if username already exists globally (same logic as signup)
      const usersRef = collection(db, 'users')
      const q = query(usersRef, where('username', '==', newUser.username.trim().toLowerCase()))
      const snapshot = await getDocs(q)

      if (!snapshot.empty) {
        throw new Error('This username is already taken. Please choose a different username.')
      }

      const userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
      await setDoc(doc(db, 'users', userId), {
        username: newUser.username.trim().toLowerCase(),
        password: newUser.password,
        displayName: newUser.displayName.trim(),
        email: newUser.email.trim() || null,
        role: newUser.role,
        orgId: selectedOrg,
        createdAt: serverTimestamp(),
      })
      setNewUser({ username: '', password: '', displayName: '', email: '', role: 'user' })
      setSelectedOrg('')
      setShowNewUser(false)
      addToast('User created successfully!', 'success', { important: true })
      
      // Log user creation
      try {
        await logUserAction(
          LOG_TYPES.USER_CREATE,
          `Created user: ${newUser.displayName} (${newUser.username}) with role: ${newUser.role}`,
          userProfile,
          selectedOrg,
          {
            userId: userId,
            username: newUser.username,
            displayName: newUser.displayName,
            email: newUser.email,
            role: newUser.role,
            orgId: selectedOrg
          }
        )
      } catch (logError) {
        console.error('Failed to log user creation:', logError)
      }
      
      // Trigger refresh for user lists
      setRefreshTrigger(prev => prev + 1)
    } catch (error) {
      console.error('Error creating user:', error)
      addToast('Error creating user: ' + error.message, 'error')
    } finally {
      setCreatingUser(false)
    }
  }

  const handlePasswordChange = (userId) => {
    setSelectedUserId(userId)
    setShowPasswordModal(true)
  }

  return (
    <div className="flex-1 bg-gray-50 overflow-auto p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Super Admin</h1>
            <p className="text-sm text-gray-500 mt-1">Manage organizations and system settings</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Back to POS
          </button>
        </div>

        {/* Organizations List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Organizations</h2>
            <button
              onClick={() => setShowNewOrg(!showNewOrg)}
              className="px-3 py-1.5 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors"
            >
              {showNewOrg ? 'Cancel' : '+ New Organization'}
            </button>
          </div>

          {/* New Organization Form */}
          {showNewOrg && (
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <form onSubmit={handleCreateOrg} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Organization Code</label>
                    <input
                      type="text"
                      value={newOrg.code}
                      onChange={e => setNewOrg({ ...newOrg, code: e.target.value.toUpperCase() })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="e.g., RESTAURANT1"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Organization Name</label>
                    <input
                      type="text"
                      value={newOrg.name}
                      onChange={e => setNewOrg({ ...newOrg, name: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Business Name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                    <input
                      type="text"
                      value={newOrg.description}
                      onChange={e => setNewOrg({ ...newOrg, description: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Optional description"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full md:w-auto px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Creating...' : 'Create Organization'}
                </button>
              </form>
            </div>
          )}

          {/* Organizations Table */}
          {organizations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>No organizations yet. Create one to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
                  <tr>
                    <th className="px-4 py-3">Code</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {organizations.map(org => (
                    <OrgRow 
                      key={org.id} 
                      org={org} 
                      onDelete={() => handleDeleteOrg(org.id)} 
                      onPasswordChange={handlePasswordChange}
                      refreshTrigger={refreshTrigger}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create User Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mt-6">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Create New User</h2>
            <button
              onClick={() => setShowNewUser(!showNewUser)}
              className="px-3 py-1.5 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors"
            >
              {showNewUser ? 'Cancel' : '+ New User'}
            </button>
          </div>

          {showNewUser && (
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <form onSubmit={handleCreateUser} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Organization</label>
                    <select
                      value={selectedOrg}
                      onChange={e => setSelectedOrg(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    >
                      <option value="">Select Organization</option>
                      {organizations.map(org => (
                        <option key={org.id} value={org.id}>{org.name} ({org.id})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Username</label>
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
                    <label className="block text-xs font-medium text-gray-700 mb-1">Full Name</label>
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
                    <label className="block text-xs font-medium text-gray-700 mb-1">Email <span className="text-gray-400">(optional)</span></label>
                    <input
                      type="email"
                      value={newUser.email}
                      onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Password</label>
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
                <div className="flex items-center gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
                    <select
                      value={newUser.role}
                      onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={creatingUser || !selectedOrg}
                    className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 mt-5"
                  >
                    {creatingUser ? 'Creating...' : 'Create User'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Password Change Modal */}
        {showPasswordModal && (
          <PasswordChangeModal
            onClose={() => {
              setShowPasswordModal(false)
              setSelectedUserId(null)
            }}
            targetUserId={selectedUserId}
          />
        )}
      </div>
    </div>
  )
}

function OrgRow({ org, onDelete, onPasswordChange, refreshTrigger }) {
  const [showUsers, setShowUsers] = useState(false)
  const { users, loading: usersLoading, updateUserRole, removeUser, refetch } = useOrgUsers(org.id)

  // Refresh user list when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger && showUsers) {
      refetch()
      
      // Log UI refresh
      try {
        logUserAction(
          LOG_TYPES.UI_REFRESH,
          `Refreshed user list for organization: ${org.id}`,
          { id: 'system', displayName: 'System' },
          org.id,
          {
            refreshTrigger: refreshTrigger,
            orgId: org.id,
            timestamp: new Date().toISOString()
          }
        ).catch(console.error)
      } catch (error) {
        console.error('Failed to log UI refresh:', error)
      }
    }
  }, [refreshTrigger, showUsers, refetch])

  return (
    <>
      <tr className="hover:bg-gray-50">
        <td className="px-4 py-3 font-mono text-sm">{org.id}</td>
        <td className="px-4 py-3 font-medium">{org.name}</td>
        <td className="px-4 py-3 text-sm text-gray-500">{org.description || '-'}</td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowUsers(!showUsers)}
              className="text-xs text-emerald-600 hover:text-emerald-700"
            >
              {showUsers ? 'Hide Users' : 'View Users'}
            </button>
            <button
              onClick={onDelete}
              className="text-xs text-red-500 hover:text-red-700"
            >
              Delete
            </button>
          </div>
        </td>
      </tr>
      {showUsers && (
        <tr>
          <td colSpan={4} className="bg-gray-50 px-4 py-3">
            {usersLoading ? (
              <p className="text-sm text-gray-500">Loading users...</p>
            ) : users.length === 0 ? (
              <p className="text-sm text-gray-500">No users in this organization.</p>
            ) : (
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-500 mb-2">Users ({users.length})</p>
                {users.map(user => (
                  <div key={user.id} className="flex items-center justify-between bg-white p-2 rounded-lg border border-gray-200">
                    <div>
                      <p className="text-sm font-medium">{user.displayName}</p>
                      <p className="text-xs text-gray-500">@{user.username} {user.email ? `• ${user.email}` : ''}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={user.role}
                        onChange={e => updateUserRole(user.id, e.target.value)}
                        className="text-xs border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button
                        onClick={() => onPasswordChange(user.id)}
                        className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                      >
                        Change Password
                      </button>
                      <button
                        onClick={() => removeUser(user.id)}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  )
}