import { useState, useEffect } from 'react'
import { collection, query, where, orderBy, limit, onSnapshot, addDoc, doc, updateDoc, deleteDoc, getDoc, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { useOrg } from '../contexts/OrgContext'
import { logUserAction, logCrudOperation, logError } from '../utils/logger'

export function useCustomers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const { userProfile, isSuperAdmin } = useAuth()
  const { selectedOrgId, hasAdminAccessToOrganization } = useOrg()

  // Get the orgId to use - prioritize selectedOrgId for all users including multi-org users
  const orgId = selectedOrgId || (isSuperAdmin ? null : userProfile?.orgId)

  // Fetch customers for the organization
  useEffect(() => {
    if (!orgId) {
      setCustomers([])
      setLoading(false)
      return
    }

    const customersRef = collection(db, 'organizations', orgId, 'customers')
    const q = query(customersRef, orderBy('name', 'asc'))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const customersArray = snapshot.docs.map(doc => ({
        id: doc.id,
        orgId: orgId,
        ...doc.data()
      }))
      setCustomers(customersArray)
      setLoading(false)
    }, (error) => {
      console.error('Error fetching customers:', error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [orgId])

  const createCustomer = async (customerData) => {
    if (!orgId) {
      console.error('Cannot create customer: no organization selected')
      throw new Error('No organization selected')
    }

    try {
      const customer = {
        ...customerData,
        orgId: orgId,
        creditBalance: 0, // Initialize credit balance to 0
        totalPurchases: 0, // Initialize total purchases
        purchaseCount: 0, // Initialize purchase count
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: userProfile?.id,
        createdByName: userProfile?.displayName
      }

      const customersRef = collection(db, 'organizations', orgId, 'customers')
      const docRef = await addDoc(customersRef, customer)
      
      // Log customer creation
      await logCrudOperation('create', 'customer', { 
        id: docRef.id, 
        name: customer.name,
        phone: customer.phone 
      }, userProfile, orgId)
      
      await logUserAction(
        'customer_create',
        `Created customer: ${customer.name}`,
        userProfile,
        orgId,
        { customerId: docRef.id, customerName: customer.name }
      )
      
      return { id: docRef.id, ...customer }
    } catch (error) {
      await logError(
        `Failed to create customer: ${error.message}`,
        error,
        userProfile,
        orgId,
        { customerData }
      )
      throw error
    }
  }

  const updateCustomer = async (customerId, updates) => {
    if (!orgId) {
      console.error('Cannot update customer: no organization selected')
      throw new Error('No organization selected')
    }

    try {
      const customerRef = doc(db, 'organizations', orgId, 'customers', customerId)
      
      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString(),
        updatedBy: userProfile?.id,
        updatedByName: userProfile?.displayName
      }

      await updateDoc(customerRef, updateData)
      
      // Log customer update
      await logCrudOperation('update', 'customer', { 
        id: customerId, 
        updates: Object.keys(updates) 
      }, userProfile, orgId)
      
      await logUserAction(
        'customer_update',
        `Updated customer: ${updates.name || 'unknown'}`,
        userProfile,
        orgId,
        { customerId, updates }
      )
      
      return { success: true }
    } catch (error) {
      await logError(
        `Failed to update customer: ${error.message}`,
        error,
        userProfile,
        orgId,
        { customerId, updates }
      )
      throw error
    }
  }

  const deleteCustomer = async (customerId) => {
    if (!orgId) {
      console.error('Cannot delete customer: no organization selected')
      throw new Error('No organization selected')
    }

    try {
      // Get customer data before deletion for logging
      const customerRef = doc(db, 'organizations', orgId, 'customers', customerId)
      const customerSnap = await getDoc(customerRef)
      
      if (!customerSnap.exists()) {
        throw new Error('Customer not found')
      }
      
      const customerData = customerSnap.data()

      // Check if customer has outstanding credit balance
      if (customerData.creditBalance !== 0) {
        throw new Error('Cannot delete customer with outstanding credit balance')
      }

      await deleteDoc(customerRef)
      
      // Log customer deletion
      await logCrudOperation('delete', 'customer', { 
        id: customerId, 
        name: customerData.name 
      }, userProfile, orgId)
      
      await logUserAction(
        'customer_delete',
        `Deleted customer: ${customerData.name}`,
        userProfile,
        orgId,
        { customerId, customerName: customerData.name }
      )
      
      return { success: true }
    } catch (error) {
      await logError(
        `Failed to delete customer: ${error.message}`,
        error,
        userProfile,
        orgId,
        { customerId }
      )
      throw error
    }
  }

  const updateCreditBalance = async (customerId, amountChange, description = '') => {
    if (!orgId) {
      console.error('Cannot update credit balance: no organization selected')
      throw new Error('No organization selected')
    }

    try {
      const customerRef = doc(db, 'organizations', orgId, 'customers', customerId)
      const customerSnap = await getDoc(customerRef)
      
      if (!customerSnap.exists()) {
        throw new Error('Customer not found')
      }
      
      const customerData = customerSnap.data()
      const newBalance = customerData.creditBalance + amountChange
      
      await updateDoc(customerRef, {
        creditBalance: newBalance,
        updatedAt: new Date().toISOString(),
        updatedBy: userProfile?.id,
        updatedByName: userProfile?.displayName
      })
      
      // Log credit balance update
      await logUserAction(
        'credit_balance_update',
        `Updated credit balance for ${customerData.name}: ${amountChange > 0 ? '+' : ''}${amountChange}`,
        userProfile,
        orgId,
        { 
          customerId, 
          customerName: customerData.name,
          amountChange, 
          newBalance,
          description 
        }
      )
      
      return { success: true, newBalance }
    } catch (error) {
      await logError(
        `Failed to update credit balance: ${error.message}`,
        error,
        userProfile,
        orgId,
        { customerId, amountChange }
      )
      throw error
    }
  }

  const searchCustomers = async (searchTerm) => {
    if (!orgId || !searchTerm) {
      return []
    }

    try {
      const customersRef = collection(db, 'organizations', orgId, 'customers')
      
      // Search by name or phone
      const nameQuery = query(
        customersRef,
        where('name', '>=', searchTerm),
        where('name', '<=', searchTerm + '\uf8ff'),
        orderBy('name'),
        limit(20)
      )
      
      const phoneQuery = query(
        customersRef,
        where('phone', '>=', searchTerm),
        where('phone', '<=', searchTerm + '\uf8ff'),
        orderBy('phone'),
        limit(20)
      )
      
      const [nameSnapshot, phoneSnapshot] = await Promise.all([
        getDocs(nameQuery),
        getDocs(phoneQuery)
      ])
      
      // Combine results and remove duplicates
      const results = new Map()
      
      nameSnapshot.docs.forEach(doc => {
        results.set(doc.id, { id: doc.id, ...doc.data() })
      })
      
      phoneSnapshot.docs.forEach(doc => {
        results.set(doc.id, { id: doc.id, ...doc.data() })
      })
      
      return Array.from(results.values())
    } catch (error) {
      console.error('Error searching customers:', error)
      return []
    }
  }

  return { 
    customers, 
    loading, 
    createCustomer, 
    updateCustomer, 
    deleteCustomer, 
    updateCreditBalance,
    searchCustomers 
  }
}

// Helper hook to get a single customer by ID
export function useCustomer(customerId) {
  const [customer, setCustomer] = useState(null)
  const [loading, setLoading] = useState(true)
  const { userProfile, isSuperAdmin } = useAuth()
  const { selectedOrgId } = useOrg()

  // Get the orgId to use - prioritize selectedOrgId for all users including multi-org users
  const orgId = selectedOrgId || (isSuperAdmin ? null : userProfile?.orgId)

  useEffect(() => {
    if (!orgId || !customerId) {
      setCustomer(null)
      setLoading(false)
      return
    }

    const customerRef = doc(db, 'organizations', orgId, 'customers', customerId)
    
    const unsubscribe = onSnapshot(customerRef, (docSnap) => {
      if (docSnap.exists()) {
        setCustomer({ id: docSnap.id, ...docSnap.data() })
      } else {
        setCustomer(null)
      }
      setLoading(false)
    }, (error) => {
      console.error('Error fetching customer:', error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [orgId, customerId])

  return { customer, loading }
}
