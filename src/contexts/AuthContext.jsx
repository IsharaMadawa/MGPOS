import { createContext, useContext, useState, useEffect } from 'react'
import { collection, query, where, getDocs, doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { hashPassword, verifyPasswordLegacy } from '../utils/passwordUtils'
import { verifyAndMigratePassword } from '../utils/migratePasswords'
import { logUserAction, logError, LOG_TYPES } from '../utils/logger'

export const AuthContext = createContext(null)

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [initializing, setInitializing] = useState(true)

  // Check for stored session on mount
  useEffect(() => {
    const storedUserId = localStorage.getItem('pos_user_id')
    const storedUserData = localStorage.getItem('pos_user_data')

    if (storedUserId && storedUserData) {
      try {
        const parsed = JSON.parse(storedUserData)
        setUser({ uid: storedUserId })
        setUserProfile(parsed)
      } catch (e) {
        localStorage.removeItem('pos_user_id')
        localStorage.removeItem('pos_user_data')
      }
    }
    setLoading(false)
    setInitializing(false)
  }, [])

  const login = async (username, password, selectedOrgId = null) => {
    // Find user with this username in Firestore (usernames are now unique)
    const usersRef = collection(db, 'users')
    const q = query(usersRef, where('username', '==', username))
    const snapshot = await getDocs(q)

    if (snapshot.empty) {
      throw new Error('Invalid username or password')
    }

    // Since usernames are unique, there should be exactly one user
    const userData = {
      id: snapshot.docs[0].id,
      ...snapshot.docs[0].data()
    }

    // Verify password with automatic migration for legacy accounts
    const isValidPassword = await verifyAndMigratePassword(password, userData.password, userData.salt, userData.id)
    if (!isValidPassword) {
      throw new Error('Invalid username or password')
    }

    const userObj = { uid: userData.id, username: userData.username }
    
    // Handle multi-organization structure
    let organizations = userData.organizations || []
    let primaryOrgId = userData.primaryOrgId
    
    // For backward compatibility, handle single orgId structure
    if (userData.orgId && !organizations.length) {
      organizations = [{ orgId: userData.orgId, role: userData.role || 'user' }]
      primaryOrgId = userData.orgId
    }
    
    // If selectedOrgId is provided, ensure user has access to it
    if (selectedOrgId && !organizations.find(org => org.orgId === selectedOrgId)) {
      throw new Error('Access denied to this organization')
    }
    
    // Use selectedOrgId if provided, otherwise use primaryOrgId
    const activeOrgId = selectedOrgId || primaryOrgId || (organizations[0]?.orgId)
    const activeOrg = organizations.find(org => org.orgId === activeOrgId)
    
    // Store only non-sensitive profile data
    const safeProfile = { 
      id: userData.id, 
      username: userData.username, 
      displayName: userData.displayName,
      email: userData.email,
      role: activeOrg?.role || userData.role || 'user',
      orgId: activeOrgId,
      organizations: organizations,
      primaryOrgId: primaryOrgId
    }

    // Store session with minimal data
    localStorage.setItem('pos_user_id', userData.id)
    localStorage.setItem('pos_user_data', JSON.stringify(safeProfile))

    setUser(userObj)
    setUserProfile(safeProfile)

    // Log successful login
    try {
      await logUserAction('user_login', `User ${username} logged in`, safeProfile, activeOrgId)
    } catch (error) {
      console.error('Failed to log login:', error)
    }

    return userObj
  }

  const signup = async (username, password, displayName, email = null, role = 'user', orgId = null) => {
    // Check if username already exists
    const usersRef = collection(db, 'users')
    const q = query(usersRef, where('username', '==', username))
    const snapshot = await getDocs(q)

    if (!snapshot.empty) {
      throw new Error('This username is already taken. Please choose a different username.')
    }

    // Create user document with custom ID
    const userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    
    // Hash the password before storing
    const { hash, salt } = await hashPassword(password)
    
    // Handle multi-organization structure
    let organizations = []
    let primaryOrgId = null
    
    if (orgId) {
      organizations = [{ orgId, role }]
      primaryOrgId = orgId
    }
    
    const userProfile = {
      username,
      password: hash, // Store hashed password
      salt, // Store salt for verification
      displayName: displayName || username,
      email,
      organizations,
      primaryOrgId,
      // Keep orgId for backward compatibility
      orgId,
      createdAt: serverTimestamp(),
    }

    await setDoc(doc(db, 'users', userId), userProfile)

    // Auto-login after signup with safe profile data
    const userObj = { uid: userId, username }
    const safeProfile = {
      id: userId,
      username,
      displayName: displayName || username,
      email,
      role,
      orgId,
      organizations,
      primaryOrgId
    }
    
    localStorage.setItem('pos_user_id', userId)
    localStorage.setItem('pos_user_data', JSON.stringify(safeProfile))

    setUser(userObj)
    setUserProfile(safeProfile)

    // Log signup
    try {
      await logUserAction('user_signup', `User ${safeProfile.username} signed up`, safeProfile, safeProfile.orgId)
    } catch (error) {
      console.error('Failed to log signup:', error)
    }

    return userObj
  }

  const logout = async () => {
    const currentUserProfile = { ...userProfile }
    
    localStorage.removeItem('pos_user_id')
    localStorage.removeItem('pos_user_data')
    setUser(null)
    setUserProfile(null)
    
    // Log logout
    if (currentUserProfile) {
      try {
        await logUserAction('user_logout', `User ${currentUserProfile.username} logged out`, currentUserProfile, currentUserProfile.orgId)
      } catch (error) {
        console.error('Failed to log logout:', error)
      }
    }
  }

  const createSuperAdmin = async (username, password, displayName = null, email = null) => {
    // Check if username already exists
    const usersRef = collection(db, 'users')
    const q = query(usersRef, where('username', '==', username))
    const snapshot = await getDocs(q)

    if (!snapshot.empty) {
      throw new Error('This username is already taken. Please choose a different username.')
    }

    // Create super admin document with custom ID
    const userId = 'super_admin_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    
    // Hash the password before storing
    const { hash, salt } = await hashPassword(password)
    
    const superAdminProfile = {
      username,
      password: hash, // Store hashed password
      salt, // Store salt for verification
      displayName: displayName || 'Super Admin',
      email,
      role: 'super_admin',
      orgId: null, // Super admins are not tied to specific organizations
      createdAt: serverTimestamp(),
    }

    await setDoc(doc(db, 'users', userId), superAdminProfile)

    return {
      id: userId,
      username,
      displayName: superAdminProfile.displayName,
      role: 'super_admin'
    }
  }

  const changePassword = async (targetUserId, newPassword, currentPassword = null) => {
    try {
      // Authorization checks
      if (!userProfile) {
        throw new Error('You must be logged in to change passwords')
      }

      // Get target user data
      const targetUserDoc = await getDoc(doc(db, 'users', targetUserId))
      if (!targetUserDoc.exists()) {
        throw new Error('User not found')
      }

      const targetUserData = targetUserDoc.data()

      // Check permissions
      const canChangeOwnPassword = userProfile.id === targetUserId
      const canChangeOrgUserPassword = isAdmin && userProfile.orgId === targetUserData.orgId
      const canChangeAnyPassword = isSuperAdmin

      if (!canChangeOwnPassword && !canChangeOrgUserPassword && !canChangeAnyPassword) {
        throw new Error('You do not have permission to change this user\'s password')
      }

      // If changing own password, verify current password
      if (canChangeOwnPassword && currentPassword) {
        const isValidCurrentPassword = await verifyPasswordLegacy(
          currentPassword, 
          targetUserData.password, 
          targetUserData.salt
        )
        if (!isValidCurrentPassword) {
          throw new Error('Current password is incorrect')
        }
      } else if (canChangeOwnPassword && !currentPassword) {
        throw new Error('Current password is required when changing your own password')
      }

      // Hash the new password
      const { hash, salt } = await hashPassword(newPassword)

      // Update user document with new password
      await setDoc(doc(db, 'users', targetUserId), {
        password: hash,
        salt,
        updatedAt: serverTimestamp()
      }, { merge: true })

      // Log the password change
      const logDescription = canChangeOwnPassword 
        ? `User ${userProfile.username} changed their own password`
        : `User ${userProfile.username} changed password for user ${targetUserData.username}`

      await logUserAction(
        LOG_TYPES.USER_PASSWORD_CHANGE,
        logDescription,
        userProfile,
        targetUserData.orgId,
        {
          targetUserId,
          targetUsername: targetUserData.username,
          changedByOwnUser: canChangeOwnPassword
        }
      )

      return { success: true, message: 'Password changed successfully' }

    } catch (error) {
      // Log error if not already logged
      if (userProfile) {
        await logError(
          `Password change failed: ${error.message}`,
          error,
          userProfile,
          userProfile.orgId,
          { targetUserId }
        ).catch(console.error)
      }
      throw error
    }
  }

  // Check if user has admin access
  const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'super_admin'
  
  // Check if user is super admin
  const isSuperAdmin = userProfile?.role === 'super_admin'

  // Add user to organization
  const addUserToOrganization = async (userId, orgId, role = 'user') => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId))
      if (!userDoc.exists()) {
        throw new Error('User not found')
      }

      const userData = userDoc.data()
      let organizations = userData.organizations || []
      
      // For backward compatibility, handle single orgId structure
      if (userData.orgId && !organizations.length) {
        organizations = [{ orgId: userData.orgId, role: userData.role || 'user' }]
      }

      // Check if user is already in this organization
      if (organizations.find(org => org.orgId === orgId)) {
        throw new Error('User already has access to this organization')
      }

      // Add organization to user's organizations
      organizations.push({ orgId, role })
      
      // If this is the first organization, set it as primary
      const primaryOrgId = userData.primaryOrgId || orgId

      await setDoc(doc(db, 'users', userId), {
        organizations,
        primaryOrgId,
        updatedAt: serverTimestamp()
      }, { merge: true })

      // Update local profile if this is the current user
      if (userProfile?.id === userId) {
        const updatedProfile = {
          ...userProfile,
          organizations,
          primaryOrgId
        }
        setUserProfile(updatedProfile)
        localStorage.setItem('pos_user_data', JSON.stringify(updatedProfile))
      }

      // Log organization addition
      try {
        await logUserAction(
          'user_org_add',
          `Added user ${userData.username} to organization ${orgId} with role: ${role}`,
          userProfile,
          orgId,
          {
            userId,
            username: userData.username,
            orgId,
            role,
            organizations,
            primaryOrgId
          }
        )
      } catch (logError) {
        console.error('Failed to log organization addition:', logError)
      }

      return { success: true }
    } catch (error) {
      console.error('Error adding user to organization:', error)
      throw error
    }
  }

  // Remove user from organization
  const removeUserFromOrganization = async (userId, orgId) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId))
      if (!userDoc.exists()) {
        throw new Error('User not found')
      }

      const userData = userDoc.data()
      let organizations = userData.organizations || []
      
      // For backward compatibility, handle single orgId structure
      if (userData.orgId && !organizations.length) {
        organizations = [{ orgId: userData.orgId, role: userData.role || 'user' }]
      }

      // Remove organization from user's organizations
      organizations = organizations.filter(org => org.orgId !== orgId)
      
      // Update primary organization if it was the removed one
      let primaryOrgId = userData.primaryOrgId
      if (primaryOrgId === orgId && organizations.length > 0) {
        primaryOrgId = organizations[0].orgId
      } else if (primaryOrgId === orgId && organizations.length === 0) {
        primaryOrgId = null
      }

      await setDoc(doc(db, 'users', userId), {
        organizations,
        primaryOrgId,
        updatedAt: serverTimestamp()
      }, { merge: true })

      // Update local profile if this is the current user
      if (userProfile?.id === userId) {
        const updatedProfile = {
          ...userProfile,
          organizations,
          primaryOrgId,
          orgId: primaryOrgId
        }
        setUserProfile(updatedProfile)
        localStorage.setItem('pos_user_data', JSON.stringify(updatedProfile))
      }

      // Log organization removal
      try {
        await logUserAction(
          'user_org_remove',
          `Removed user ${userData.username} from organization ${orgId}`,
          userProfile,
          orgId,
          {
            userId,
            username: userData.username,
            orgId,
            organizations,
            primaryOrgId
          }
        )
      } catch (logError) {
        console.error('Failed to log organization removal:', logError)
      }

      return { success: true }
    } catch (error) {
      console.error('Error removing user from organization:', error)
      throw error
    }
  }

  // Set primary organization for user
  const setPrimaryOrganization = async (userId, orgId) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId))
      if (!userDoc.exists()) {
        throw new Error('User not found')
      }

      const userData = userDoc.data()
      let organizations = userData.organizations || []
      
      // For backward compatibility, handle single orgId structure
      if (userData.orgId && !organizations.length) {
        organizations = [{ orgId: userData.orgId, role: userData.role || 'user' }]
      }

      // Check if user has access to this organization
      if (!organizations.find(org => org.orgId === orgId)) {
        throw new Error('User does not have access to this organization')
      }

      await setDoc(doc(db, 'users', userId), {
        primaryOrgId: orgId,
        updatedAt: serverTimestamp()
      }, { merge: true })

      // Update local profile if this is the current user
      if (userProfile?.id === userId) {
        const updatedProfile = {
          ...userProfile,
          primaryOrgId: orgId,
          orgId: orgId,
          role: organizations.find(org => org.orgId === orgId)?.role || 'user'
        }
        setUserProfile(updatedProfile)
        localStorage.setItem('pos_user_data', JSON.stringify(updatedProfile))
      }

      // Log primary organization change
      try {
        await logUserAction(
          'user_primary_org_change',
          `Set primary organization for user ${userData.username} to ${orgId}`,
          userProfile,
          orgId,
          {
            userId,
            username: userData.username,
            orgId,
            previousPrimaryOrgId: userData.primaryOrgId,
            newPrimaryOrgId: orgId
          }
        )
      } catch (logError) {
        console.error('Failed to log primary organization change:', logError)
      }

      return { success: true }
    } catch (error) {
      console.error('Error setting primary organization:', error)
      throw error
    }
  }

  const value = {
    user,
    userProfile,
    loading,
    initializing,
    login,
    signup,
    logout,
    createSuperAdmin,
    changePassword,
    isAdmin,
    isSuperAdmin,
    addUserToOrganization,
    removeUserFromOrganization,
    setPrimaryOrganization,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}