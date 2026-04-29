import { useState, useEffect } from 'react'
import { collection, query, where, getDocs, doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'

export function useOrganizations() {
  const [organizations, setOrganizations] = useState([])
  const [loading, setLoading] = useState(true)
  const { userProfile, isSuperAdmin } = useAuth()

  const fetchOrganizations = async () => {
    try {
      const orgsRef = collection(db, 'organizations')
      
      if (isSuperAdmin) {
        // Super admin sees all organizations
        const snapshot = await getDocs(orgsRef)
        const orgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
        setOrganizations(orgs)
      } else if (userProfile?.organizations && userProfile.organizations.length > 0) {
        // Multi-org users: fetch all their accessible organizations
        const orgIds = userProfile.organizations.map(org => org.orgId)
        const orgPromises = orgIds.map(async (orgId) => {
          const orgDoc = await getDoc(doc(db, 'organizations', orgId))
          return orgDoc.exists() ? { id: orgDoc.id, ...orgDoc.data() } : null
        })
        const orgResults = await Promise.all(orgPromises)
        const validOrgs = orgResults.filter(org => org !== null)
        setOrganizations(validOrgs)
      } else if (userProfile?.orgId) {
        // Backward compatibility: single orgId structure
        const orgDoc = await getDoc(doc(db, 'organizations', userProfile.orgId))
        if (orgDoc.exists()) {
          setOrganizations([{ id: orgDoc.id, ...orgDoc.data() }])
        } else {
          setOrganizations([])
        }
      } else {
        setOrganizations([])
      }
    } catch (error) {
      console.error('Error fetching organizations:', error)
      setOrganizations([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrganizations()
  }, [isSuperAdmin, userProfile?.organizations, userProfile?.orgId])

  const createOrganization = async (orgData) => {
    const orgRef = doc(db, 'organizations', orgData.code)
    await setDoc(orgRef, {
      ...orgData,
      createdAt: serverTimestamp(),
      active: true,
    })
    await fetchOrganizations()
    return orgData.code
  }

  const updateOrganization = async (code, data) => {
    const orgRef = doc(db, 'organizations', code)
    await setDoc(orgRef, data, { merge: true })
    await fetchOrganizations()
  }

  const deleteOrganization = async (code) => {
    await deleteDoc(doc(db, 'organizations', code))
    await fetchOrganizations()
  }

  return {
    organizations,
    loading,
    createOrganization,
    updateOrganization,
    deleteOrganization,
    refetch: fetchOrganizations,
  }
}

export function useOrgUsers(orgCode) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchUsers = async () => {
    if (!orgCode) {
      setLoading(false)
      return
    }
    
    try {
      const usersRef = collection(db, 'users')
      
      // Fetch users with single orgId (backward compatibility)
      const q1 = query(usersRef, where('orgId', '==', orgCode))
      const snapshot1 = await getDocs(q1)
      
      // Fetch users with multi-org structure
      const allUsersSnapshot = await getDocs(usersRef)
      const multiOrgUsers = allUsersSnapshot.docs
        .filter(doc => {
          const userData = doc.data()
          return userData.organizations && userData.organizations.some(org => org.orgId === orgCode)
        })
        .map(doc => ({ id: doc.id, ...doc.data() }))
      
      // Combine both sets of users, removing duplicates
      const singleOrgUsers = snapshot1.docs.map(d => ({ id: d.id, ...d.data() }))
      const allUsers = [...singleOrgUsers]
      
      // Add multi-org users that aren't already in the list
      multiOrgUsers.forEach(multiOrgUser => {
        if (!allUsers.find(user => user.id === multiOrgUser.id)) {
          // Set the user's role for this specific organization
          const orgMembership = multiOrgUser.organizations.find(org => org.orgId === orgCode)
          allUsers.push({
            ...multiOrgUser,
            role: orgMembership?.role || 'user'
          })
        }
      })
      
      setUsers(allUsers)
    } catch (error) {
      console.error('Error fetching org users:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [orgCode])

  const updateUserRole = async (userId, newRole) => {
    const userRef = doc(db, 'users', userId)
    await setDoc(userRef, { role: newRole }, { merge: true })
    await fetchUsers()
  }

  const removeUser = async (userId) => {
    await deleteDoc(doc(db, 'users', userId))
    await fetchUsers()
  }

  return {
    users,
    loading,
    refetch: fetchUsers,
    updateUserRole,
    removeUser,
  }
}

export function useUsers(orgId = null) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const { isSuperAdmin, userProfile } = useAuth()

  const fetchUsers = async () => {
    try {
      const usersRef = collection(db, 'users')
      let users = []

      if (isSuperAdmin && orgId) {
        // Super admin filtering by specific organization
        // Fetch users with single orgId
        const q1 = query(usersRef, where('orgId', '==', orgId))
        const snapshot1 = await getDocs(q1)
        const singleOrgUsers = snapshot1.docs.map(d => ({ id: d.id, ...d.data() }))
        
        // Fetch users with multi-org structure
        const allUsersSnapshot = await getDocs(usersRef)
        const multiOrgUsers = allUsersSnapshot.docs
          .filter(doc => {
            const userData = doc.data()
            return userData.organizations && userData.organizations.some(org => org.orgId === orgId)
          })
          .map(doc => {
            const userData = doc.data()
            const orgMembership = userData.organizations.find(org => org.orgId === orgId)
            return {
              id: doc.id,
              ...userData,
              role: orgMembership?.role || 'user'
            }
          })
        
        users = [...singleOrgUsers]
        // Add multi-org users that aren't already in the list
        multiOrgUsers.forEach(multiOrgUser => {
          if (!users.find(user => user.id === multiOrgUser.id)) {
            users.push(multiOrgUser)
          }
        })
      } else if (isSuperAdmin) {
        // Super admin sees all users
        const snapshot = await getDocs(usersRef)
        users = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
      } else if (userProfile?.organizations && userProfile.organizations.length > 0) {
        // Multi-org admin sees users from all their organizations
        const orgIds = userProfile.organizations.map(org => org.orgId)
        const allUsersSnapshot = await getDocs(usersRef)
        
        users = allUsersSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(user => {
            // Include users with single orgId that matches one of admin's orgs
            if (user.orgId && orgIds.includes(user.orgId)) return true
            // Include users with multi-org structure that have access to any of admin's orgs
            if (user.organizations) {
              return user.organizations.some(org => orgIds.includes(org.orgId))
            }
            return false
          })
      } else if (userProfile?.orgId) {
        // Backward compatibility: single org admin
        const q = query(usersRef, where('orgId', '==', userProfile.orgId))
        const snapshot = await getDocs(q)
        users = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
      } else {
        // No access, return empty
        setUsers([])
        setLoading(false)
        return
      }

      setUsers(users)
    } catch (error) {
      console.error('Error fetching users:', error)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [isSuperAdmin, userProfile?.organizations, userProfile?.orgId, orgId])

  const getUserById = (userId) => {
    return users.find(user => user.id === userId)
  }

  return {
    users,
    loading,
    refetch: fetchUsers,
    getUserById,
  }
}