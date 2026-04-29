import { useState, useEffect } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useOrganizations, useOrgUsers } from '../hooks/useOrganizations'
import { useToast } from '../components/ToastContainer'
import { logUserAction, LOG_TYPES } from '../utils/logger'
import { db } from '../firebase'
import { doc, setDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore'
import PasswordChangeModal from '../components/PasswordChangeModal'
import UnifiedUserManager from '../components/UnifiedUserManager'
import AccessManagement from '../components/AccessManagement'
import OrgUsersList from '../components/OrgUsersList'

export default function SuperAdminPage() {
  const { isSuperAdmin, loading, userProfile } = useAuth()
  const navigate = useNavigate()
  const { organizations, createOrganization, deleteOrganization, updateOrganization, refetch: refetchOrganizations, loading: orgsLoading } = useOrganizations()
  const { addToast } = useToast()
  
  const [activeTab, setActiveTab] = useState('organizations')
  const [showNewOrg, setShowNewOrg] = useState(false)
  const [newOrg, setNewOrg] = useState({ code: '', name: '', description: '' })
  const [saving, setSaving] = useState(false)

  
  // Password change state
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState(null)

  // Refresh trigger for user lists
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  // Refresh trigger for organizations
  const [orgRefreshTrigger, setOrgRefreshTrigger] = useState(0)

  // Refetch organizations when orgRefreshTrigger changes
  useEffect(() => {
    if (orgRefreshTrigger > 0) {
      refetchOrganizations()
    }
  }, [orgRefreshTrigger, refetchOrganizations])

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
      // Trigger organization refresh to update Navbar
      setOrgRefreshTrigger(prev => prev + 1)
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
      // Trigger organization refresh to update Navbar
      setOrgRefreshTrigger(prev => prev + 1)
    } catch (error) {
      console.error('Error deleting organization:', error)
    }
  }

  
  const handlePasswordChange = (userId) => {
    setSelectedUserId(userId)
    setShowPasswordModal(true)
  }

  return (
    <div className="flex-1 bg-gray-50 overflow-auto p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Super Admin</h1>
            <p className="text-sm text-gray-500 mt-1">Manage organizations, users, and system settings</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Back to POS
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('organizations')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'organizations'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Organizations
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'users'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Users
            </button>
            <button
              onClick={() => setActiveTab('access')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'access'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Access
            </button>
          </div>

          {/* Organizations Tab Content */}
          {activeTab === 'organizations' && (
            <div className="p-4">
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
                          updateOrganization={updateOrganization}
                          orgRefreshTrigger={orgRefreshTrigger}
                          setOrgRefreshTrigger={setOrgRefreshTrigger}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Users Tab Content */}
          {activeTab === 'users' && (
            <div className="p-4">
              <UnifiedUserManager />
            </div>
          )}

          {/* Access Tab Content */}
          {activeTab === 'access' && (
            <div className="p-4">
              <AccessManagement />
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
      </div>
    </div>
  )
}

function OrgRow({ org, onDelete, onPasswordChange, refreshTrigger, updateOrganization, orgRefreshTrigger, setOrgRefreshTrigger }) {
  const [showUsers, setShowUsers] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [editForm, setEditForm] = useState({ name: org.name, description: org.description || '' })
  const [editing, setEditing] = useState(false)
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

  const handleUpdateOrg = async (e) => {
    e.preventDefault()
    if (!editForm.name.trim()) return
    
    setEditing(true)
    try {
      await updateOrganization(org.id, {
        name: editForm.name.trim(),
        description: editForm.description.trim()
      })
      
      // Log organization update
      try {
        await logUserAction(
          LOG_TYPES.ORG_UPDATE,
          `Updated organization ${org.id}: name="${editForm.name.trim()}", description="${editForm.description.trim()}"`,
          { id: 'system', displayName: 'System' },
          org.id,
          {
            orgId: org.id,
            oldName: org.name,
            newName: editForm.name.trim(),
            oldDescription: org.description || '',
            newDescription: editForm.description.trim(),
            timestamp: new Date().toISOString()
          }
        )
      } catch (logError) {
        console.error('Failed to log organization update:', logError)
      }
      
      // Trigger organization refresh to update the list
      setOrgRefreshTrigger(prev => prev + 1)
      
      setShowEditForm(false)
      setEditForm({ name: org.name, description: org.description || '' })
    } catch (error) {
      console.error('Error updating organization:', error)
    } finally {
      setEditing(false)
    }
  }

  const handleCancelEdit = () => {
    setShowEditForm(false)
    setEditForm({ name: org.name, description: org.description || '' })
  }

  return (
    <>
      <tr className="hover:bg-gray-50">
        <td className="px-4 py-3 font-mono text-sm">{org.id}</td>
        <td className="px-4 py-3 font-medium">{org.name}</td>
        <td className="px-4 py-3 text-sm text-gray-500">{org.description || '-'}</td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowEditForm(!showEditForm)}
              className="text-xs text-blue-500 hover:text-blue-700"
            >
              {showEditForm ? 'Cancel' : 'Edit'}
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
      {showEditForm && (
        <tr>
          <td colSpan={4} className="bg-blue-50 px-4 py-4">
            <form onSubmit={handleUpdateOrg} className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Edit Organization: {org.id}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Organization Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Organization name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    value={editForm.description}
                    onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Optional description"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={editing}
                  className="px-3 py-1.5 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {editing ? 'Updating...' : 'Update'}
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </td>
        </tr>
      )}
    </>
  )
}
