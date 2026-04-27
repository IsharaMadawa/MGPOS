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
      } else if (userProfile?.orgId) {
        // Other users see their assigned organization
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
  }, [isSuperAdmin, userProfile?.orgId])

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
      const q = query(usersRef, where('orgId', '==', orgCode))
      const snapshot = await getDocs(q)
      const userList = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
      setUsers(userList)
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