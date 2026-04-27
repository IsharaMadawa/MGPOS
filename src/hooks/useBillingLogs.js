import { useState, useEffect } from 'react'
import { collection, addDoc, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'

export function useBillingLogs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const { userProfile } = useAuth()

  // Fetch recent billing logs for the organization
  useEffect(() => {
    if (!userProfile?.orgId) {
      setLogs([])
      setLoading(false)
      return
    }

    const logsRef = collection(db, 'organizations', userProfile.orgId, 'billing_logs')
    const q = query(logsRef, orderBy('createdAt', 'desc'), limit(50))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logsArray = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setLogs(logsArray)
      setLoading(false)
    }, (error) => {
      console.error('Error fetching billing logs:', error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [userProfile?.orgId])

  const createBillingLog = async (saleData) => {
    if (!userProfile?.orgId) return

    const logEntry = {
      ...saleData,
      cashierId: userProfile.id,
      cashierName: userProfile.displayName,
      createdAt: new Date().toISOString(),
    }

    const logsRef = collection(db, 'organizations', userProfile.orgId, 'billing_logs')
    const docRef = await addDoc(logsRef, logEntry)
    return { id: docRef.id, ...logEntry }
  }

  return { logs, loading, createBillingLog }
}

// Helper to get billing log for a specific receipt
export function useReceiptLog(receiptNo) {
  const [receipt, setReceipt] = useState(null)
  const [loading, setLoading] = useState(true)
  const { userProfile } = useAuth()

  useEffect(() => {
    if (!userProfile?.orgId || !receiptNo) {
      setLoading(false)
      return
    }

    const logsRef = collection(db, 'organizations', userProfile.orgId, 'billing_logs')
    const q = query(logsRef, where('receiptNo', '==', receiptNo))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setReceipt({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() })
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [userProfile?.orgId, receiptNo])

  return { receipt, loading }
}