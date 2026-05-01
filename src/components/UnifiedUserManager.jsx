import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useOrganizations } from '../hooks/useOrganizations'
import { useToast } from './ToastContainer'
import { logUserAction, LOG_TYPES } from '../utils/logger'
import { db } from '../firebase'
import { doc, setDoc, serverTimestamp, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore'
import PasswordChangeModal from './PasswordChangeModal'

export default function UnifiedUserManager() {
  const { userProfile, isSuperAdmin } = useAuth()
  const { organizations } = useOrganizations()
  const { addToast } = useToast()

  // Only super admins can access this component
  if (!isSuperAdmin) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <svg className="w-12 h-12 text-red-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-600">Only super administrators can access unified user management.</p>
      </div>
    )
  }
  
  const [showNewUser, setShowNewUser] = useState(false)
  const [newUser, setNewUser] = useState({ 
    username: '', 
    password: '', 
    displayName: '', 
    email: ''
  })
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  
  // Edit user state
  const [editingUser, setEditingUser] = useState(null)
  const [editForm, setEditForm] = useState({ displayName: '', email: '' })
  const [updating, setUpdating] = useState(false)
  const [editError, setEditError] = useState('')
  
  // Password change state
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState(null)

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
      
      // Create user without organization assignment
      await setDoc(doc(db, 'users', userId), {
        username: newUser.username.trim().toLowerCase(),
        password: newUser.password,
        displayName: newUser.displayName.trim(),
        email: newUser.email.trim() || null,
        role: 'user',
        organizations: [],
        primaryOrgId: null,
        createdAt: serverTimestamp(),
      })

      // Reset form
      setNewUser({ 
        username: '', 
        password: '', 
        displayName: '', 
        email: ''
      })
      setShowNewUser(false)
      addToast('User created successfully! Use the Access tab to assign organizations.', 'success', { important: true })
      
      // Log user creation
      try {
        await logUserAction(
          LOG_TYPES.USER_CREATE,
          `Created user: ${newUser.displayName} (${newUser.username})`,
          userProfile,
          null, // Super admin action
          {
            userId: userId,
            username: newUser.username,
            displayName: newUser.displayName,
            email: newUser.email
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

  const handleEditUser = (userId) => {
    const user = users.find(u => u.id === userId)
    if (user) {
      setEditingUser(user)
      setEditForm({
        displayName: user.displayName || '',
        email: user.email || ''
      })
      setEditError('')
    }
  }

  const handleUpdateUser = async (e) => {
    e.preventDefault()
    if (!editingUser || !editForm.displayName.trim()) {
      setEditError('Display name is required')
      return
    }

    setUpdating(true)
    setEditError('')

    try {
      await setDoc(doc(db, 'users', editingUser.id), {
        displayName: editForm.displayName.trim(),
        email: editForm.email.trim() || null,
        updatedAt: serverTimestamp()
      }, { merge: true })

      // Update local state
      setUsers(users.map(u => 
        u.id === editingUser.id 
          ? { ...u, displayName: editForm.displayName.trim(), email: editForm.email.trim() || null }
          : u
      ))

      // Log user update
      try {
        await logUserAction(
          LOG_TYPES.USER_UPDATE,
          `Updated user: ${editingUser.username} - changed display name and/or email`,
          userProfile,
          null,
          {
            userId: editingUser.id,
            username: editingUser.username,
            oldDisplayName: editingUser.displayName,
            newDisplayName: editForm.displayName.trim(),
            oldEmail: editingUser.email,
            newEmail: editForm.email.trim() || null
          }
        )
      } catch (logError) {
        console.error('Failed to log user update:', logError)
      }

      addToast('User updated successfully!', 'success', { important: true })
      setEditingUser(null)
      setEditForm({ displayName: '', email: '' })
    } catch (err) {
      console.error('Error updating user:', err)
      setEditError(err.message)
    } finally {
      setUpdating(false)
    }
  }

  const handlePasswordChange = (userId) => {
    setSelectedUserId(userId)
    setShowPasswordModal(true)
  }

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return
    
    try {
      const user = users.find(u => u.id === userId)
      
      await deleteDoc(doc(db, 'users', userId))
      setUsers(users.filter(u => u.id !== userId))
      
      // Log user deletion
      try {
        await logUserAction(
          LOG_TYPES.USER_DELETE,
          `Deleted user: ${user?.displayName} (${user?.username})`,
          userProfile,
          null,
          {
            userId: userId,
            username: user?.username,
            displayName: user?.displayName,
            email: user?.email
          }
        )
      } catch (logError) {
        console.error('Failed to log user deletion:', logError)
      }
      
      addToast('User deleted successfully!', 'success', { important: true })
    } catch (err) {
      console.error('Error deleting user:', err)
      addToast('Failed to delete user', 'error')
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-semibold text-gray-900">User Management</h2>
        <button
          onClick={() => setShowNewUser(!showNewUser)}
          className="px-3 py-1.5 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors"
        >
          {showNewUser ? 'Cancel' : '+ New User'}
        </button>
      </div>

      {showNewUser && (
        <div className="bg-gray-50 rounded-xl p-6 mb-6">
          <h3 className="font-medium text-gray-900 mb-4">Create New User</h3>
          <p className="text-sm text-gray-600 mb-4">Create a user account first, then assign access to organizations in the Access tab.</p>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={creating}
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
            <p>No users yet. Create your first user.</p>
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium">{user.username}</td>
                    <td className="px-4 py-3 text-sm">{user.displayName}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{user.email || '-'}</td>
                    <td className="px-4 py-3 text-sm">
                      {user.organizations && user.organizations.length > 0 ? (
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
                        <span className="text-gray-400 text-xs">No access assigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditUser(user.id)}
                          className="text-blue-500 hover:text-blue-700 text-xs"
                          disabled={user.id === userProfile?.id && !isSuperAdmin}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handlePasswordChange(user.id)}
                          className="text-green-500 hover:text-green-700 text-xs"
                        >
                          Password
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-500 hover:text-red-700 text-xs"
                          disabled={user.id === userProfile?.id}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit User</h3>
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  value={editingUser.username}
                  disabled
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50"
                />
                <p className="text-xs text-gray-500 mt-1">Username cannot be changed</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                <input
                  type="text"
                  value={editForm.displayName}
                  onChange={e => setEditForm({ ...editForm, displayName: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-gray-400">(optional)</span></label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="user@example.com"
                />
              </div>
              
              {editError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-600">{editError}</p>
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={updating}
                  className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {updating ? 'Updating...' : 'Update User'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingUser(null)
                    setEditForm({ displayName: '', email: '' })
                    setEditError('')
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
  )
}
