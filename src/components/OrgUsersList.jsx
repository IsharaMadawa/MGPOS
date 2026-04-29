import { useState, useEffect } from 'react'
import { useOrgUsers } from '../hooks/useOrganizations'

export default function OrgUsersList({ orgId }) {
  const { users, loading, updateUserRole, removeUser, refetch } = useOrgUsers(orgId)

  useEffect(() => {
    refetch()
  }, [orgId, refetch])

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600 mx-auto"></div>
        <p className="text-sm text-gray-500 mt-2">Loading users...</p>
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p className="text-sm">No users in this organization.</p>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="space-y-2">
        {users.map(user => (
          <div key={user.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200">
            <div>
              <p className="text-sm font-medium text-gray-900">{user.displayName}</p>
              <p className="text-xs text-gray-500">@{user.username} {user.email ? `• ${user.email}` : ''}</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={user.role}
                onChange={e => updateUserRole(user.id, e.target.value)}
                className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
              <button
                onClick={() => {/* Password change functionality */}}
                className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                title="Change password"
              >
                Change Password
              </button>
              <button
                onClick={() => removeUser(user.id)}
                className="text-xs text-red-500 hover:text-red-700 transition-colors"
                title="Remove user"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
