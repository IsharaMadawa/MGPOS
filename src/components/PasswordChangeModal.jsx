import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useUsers } from '../hooks/useOrganizations'
import { useOrganizations } from '../hooks/useOrganizations'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase'

export default function PasswordChangeModal({ onClose, targetUserId = null }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedOrgId, setSelectedOrgId] = useState('')
  const [selectedUserId, setSelectedUserId] = useState(targetUserId || '')
  
  const { changePassword, userProfile, isSuperAdmin } = useAuth()
  const { users, loading: usersLoading } = useUsers(selectedOrgId)
  const { organizations, loading: orgsLoading } = useOrganizations()
  const [allUsers, setAllUsers] = useState([])
  const [allUsersLoading, setAllUsersLoading] = useState(false)

  const isChangingOwnPassword = !targetUserId || targetUserId === userProfile?.id

  // Ensure selectedUserId is set when changing own password
  useEffect(() => {
    if (isChangingOwnPassword && !selectedUserId) {
      setSelectedUserId(userProfile?.id || '')
    }
  }, [isChangingOwnPassword, selectedUserId, userProfile?.id])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Validation
      if (!newPassword) {
        throw new Error('New password is required')
      }
      
      if (newPassword.length < 6) {
        throw new Error('Password must be at least 6 characters long')
      }

      if (newPassword !== confirmPassword) {
        throw new Error('New passwords do not match')
      }

      if (isChangingOwnPassword && !currentPassword) {
        throw new Error('Current password is required')
      }

      if (!selectedUserId) {
        throw new Error('Please select a user')
      }

      // Change password
      await changePassword(
        selectedUserId,
        newPassword,
        isChangingOwnPassword ? currentPassword : null
      )

      // Reset form and close
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUserSelect = (userId) => {
    setSelectedUserId(userId)
    setError('')
  }

  const handleOrgSelect = (orgId) => {
    setSelectedOrgId(orgId)
    setSelectedUserId('') // Reset user selection when org changes
  }

  const filteredUsers = users.filter(user => {
    // Super admins can change any password, but exclude themselves from "other users" list
    if (isSuperAdmin && !isChangingOwnPassword) {
      return user.id !== userProfile?.id
    }
    // Regular admins can change passwords of users in their org (including themselves)
    return true
  })

  // For superAdmins changing other users' passwords, get all users from all organizations
  useEffect(() => {
    if (isSuperAdmin && !isChangingOwnPassword) {
      // Fetch all users for superAdmin
      const fetchAllUsers = async () => {
        setAllUsersLoading(true)
        try {
          const usersRef = collection(db, 'users')
          const snapshot = await getDocs(usersRef)
          const allUsersData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
          // Filter out super admins and current user
          const filteredAllUsers = allUsersData.filter(user => 
            user.role !== 'super_admin' && user.id !== userProfile?.id
          )
          setAllUsers(filteredAllUsers)
        } catch (error) {
          console.error('Error fetching all users:', error)
        } finally {
          setAllUsersLoading(false)
        }
      }
      fetchAllUsers()
    }
  }, [isSuperAdmin, isChangingOwnPassword, userProfile?.id])

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Change Password</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {isChangingOwnPassword ? 'Update your password' : 'Change user password'}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Organization Selection - Removed for SuperAdmin to avoid confusion */}
          {/* SuperAdmins should be able to change any user's password without org selection */}

          {/* User Selection */}
          {!isChangingOwnPassword && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
              <select
                value={selectedUserId}
                onChange={(e) => handleUserSelect(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                disabled={usersLoading || allUsersLoading || (!isSuperAdmin && !selectedOrgId)}
              >
                <option value="">Select User</option>
                {(isSuperAdmin ? allUsers : filteredUsers).map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.displayName || user.username} ({user.role}) {user.orgId ? `· ${user.orgId}` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Current Password (for own password change) */}
          {isChangingOwnPassword && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Password *</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Enter current password"
                required
              />
            </div>
          )}

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password *</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Enter new password (min. 6 characters)"
              required
              minLength="6"
            />
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password *</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Confirm new password"
              required
              minLength="6"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Password Requirements */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
            <p className="text-xs text-gray-600 font-medium mb-1">Password Requirements:</p>
            <ul className="text-xs text-gray-500 space-y-0.5">
              <li>• Minimum 6 characters long</li>
              <li>• Should be different from current password</li>
              <li>• Must match confirmation password</li>
            </ul>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || (!isChangingOwnPassword && !selectedUserId)}
            >
              {loading ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
