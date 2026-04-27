import { useState, useEffect } from 'react'
import { collection, query, where, getDocs, doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'

export function useOrganizations() {
  const [organizations, setOrganizations] = useState([])
  const [loading, setLoading] = useState(true)
  const { isSuperAdmin } = useAuth()

  const fetchOrganizations = async () => {
    if (!isSuperAdmin) {
      setLoading(false)
      return
    }
    
    try {
      const orgsRef = collection(db, 'organizations')
      const snapshot = await getDocs(orgsRef)
      const orgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
      setOrganizations(orgs)
    } catch (error) {
      console.error('Error fetching organizations:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrganizations()
  }, [isSuperAdmin])

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