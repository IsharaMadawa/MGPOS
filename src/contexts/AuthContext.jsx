import { createContext, useContext, useState, useEffect } from 'react'
import { collection, query, where, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

const AuthContext = createContext(null)

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

  const login = async (username, password) => {
    // Find user by username in Firestore
    const usersRef = collection(db, 'users')
    const q = query(usersRef, where('username', '==', username))
    const snapshot = await getDocs(q)

    if (snapshot.empty) {
      throw new Error('Invalid username or password')
    }

    const userDoc = snapshot.docs[0]
    const userData = userDoc.data()

    // Verify password
    if (userData.password !== password) {
      throw new Error('Invalid username or password')
    }

    const userObj = { uid: userDoc.id, username: userData.username }
    const profile = { id: userDoc.id, ...userData }

    // Store session
    localStorage.setItem('pos_user_id', userDoc.id)
    localStorage.setItem('pos_user_data', JSON.stringify(profile))

    setUser(userObj)
    setUserProfile(profile)

    return userObj
  }

  const signup = async (username, password, displayName, email = null, role = 'user', orgId = null) => {
    // Check if username already exists
    const usersRef = collection(db, 'users')
    const q = query(usersRef, where('username', '==', username))
    const snapshot = await getDocs(q)

    if (!snapshot.empty) {
      throw new Error('An account with this username already exists')
    }

    // Create user document with custom ID
    const userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    
    const userProfile = {
      username,
      password,
      displayName: displayName || username,
      email,
      role,
      orgId,
      createdAt: serverTimestamp(),
    }

    await setDoc(doc(db, 'users', userId), userProfile)

    // Auto-login after signup
    const userObj = { uid: userId, username }
    localStorage.setItem('pos_user_id', userId)
    localStorage.setItem('pos_user_data', JSON.stringify({ id: userId, ...userProfile }))

    setUser(userObj)
    setUserProfile({ id: userId, ...userProfile })

    return userObj
  }

  const logout = async () => {
    localStorage.removeItem('pos_user_id')
    localStorage.removeItem('pos_user_data')
    setUser(null)
    setUserProfile(null)
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
    isAdmin,
    isSuperAdmin,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}