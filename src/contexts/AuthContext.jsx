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
    // Find all users with this username in Firestore
    const usersRef = collection(db, 'users')
    const q = query(usersRef, where('username', '==', username))
    const snapshot = await getDocs(q)

    if (snapshot.empty) {
      throw new Error('Invalid username or password')
    }

    // Get all users with this username
    const matchingUsers = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    // Filter by orgId if provided
    let userData = matchingUsers.find(u => u.orgId === selectedOrgId) || null
    
    // If no org filter or no match, check for single unique user
    if (!userData) {
      if (matchingUsers.length === 1) {
        // Single user with this username - use it
        userData = matchingUsers[0]
      } else {
        // Multiple users with same username - always require org selection
        throw new Error(`Multiple accounts found with username "${username}". Please specify your organization code.`)
      }
    }

    // Verify password with automatic migration for legacy accounts
    const isValidPassword = await verifyAndMigratePassword(password, userData.password, userData.salt, userData.id)
    if (!isValidPassword) {
      throw new Error('Invalid username or password')
    }

    const userObj = { uid: userData.id, username: userData.username }
    // Store only non-sensitive profile data
    const safeProfile = { 
      id: userData.id, 
      username: userData.username, 
      displayName: userData.displayName,
      email: userData.email,
      role: userData.role,
      orgId: userData.orgId
    }

    // Store session with minimal data
    localStorage.setItem('pos_user_id', userData.id)
    localStorage.setItem('pos_user_data', JSON.stringify(safeProfile))

    setUser(userObj)
    setUserProfile(safeProfile)

    // Log successful login
    try {
      await logUserAction('user_login', `User ${username} logged in`, safeProfile, userData.orgId)
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
    
    const userProfile = {
      username,
      password: hash, // Store hashed password
      salt, // Store salt for verification
      displayName: displayName || username,
      email,
      role,
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
      orgId
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
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}