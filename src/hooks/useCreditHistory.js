import { useState, useEffect } from 'react'
import { collection, query, where, orderBy, onSnapshot, addDoc, doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase.js'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useOrg } from '../contexts/OrgContext.jsx'
import { logUserAction, logCrudOperation, logError } from '../utils/logger'

export const CreditTransactionType = {
  PURCHASE: 'purchase',
  PAYMENT: 'payment',
  ADJUSTMENT: 'adjustment'
}

export function useCreditHistory(customerId) {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const { userProfile, isSuperAdmin } = useAuth()
  const { selectedOrgId } = useOrg()

  // Get the orgId to use - prioritize selectedOrgId for all users including multi-org users
  const orgId = selectedOrgId || (isSuperAdmin ? null : userProfile?.orgId)

  // Fetch credit history for the customer
  useEffect(() => {
    if (!orgId || !customerId) {
      setTransactions([])
      setLoading(false)
      return
    }

    const creditHistoryRef = collection(db, 'organizations', orgId, 'customers', customerId, 'creditHistory')
    const q = query(creditHistoryRef, orderBy('createdAt', 'desc'))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const transactionsArray = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setTransactions(transactionsArray)
      setLoading(false)
    }, (error) => {
      console.error('Error fetching credit history:', error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [orgId, customerId])

  const addCreditTransaction = async (transactionData) => {
    if (!orgId || !customerId) {
      console.error('Cannot add credit transaction: no organization or customer specified')
      throw new Error('Organization or customer not specified')
    }

    try {
      const transaction = {
        ...transactionData,
        orgId: orgId,
        customerId: customerId,
        createdAt: new Date().toISOString(),
        createdBy: userProfile?.id,
        createdByName: userProfile?.displayName
      }

      const creditHistoryRef = collection(db, 'organizations', orgId, 'customers', customerId, 'creditHistory')
      const docRef = await addDoc(creditHistoryRef, transaction)
      
      // Log credit transaction creation
      await logCrudOperation('create', 'creditTransaction', { 
        id: docRef.id, 
        customerId,
        type: transaction.type,
        amount: transaction.amount
      }, userProfile, orgId)
      
      await logUserAction(
        'credit_transaction_create',
        `Created credit transaction for customer: ${transaction.customerName || 'Unknown'}`,
        userProfile,
        orgId,
        { 
          transactionId: docRef.id, 
          customerId, 
          type: transaction.type,
          amount: transaction.amount 
        }
      )
      
      return { id: docRef.id, ...transaction }
    } catch (error) {
      await logError(
        `Failed to create credit transaction: ${error.message}`,
        error,
        userProfile,
        orgId,
        { transactionData }
      )
      throw error
    }
  }

  const calculateRunningBalance = () => {
    let balance = 0
    const transactionsWithBalance = transactions.slice().reverse().map(transaction => {
      if (transaction.type === CreditTransactionType.PURCHASE) {
        balance -= transaction.amount
      } else if (transaction.type === CreditTransactionType.PAYMENT) {
        balance += transaction.amount
      } else if (transaction.type === CreditTransactionType.ADJUSTMENT) {
        balance += transaction.amount
      }
      
      return {
        ...transaction,
        runningBalance: balance
      }
    }).reverse() // Reverse back to chronological order (newest first)
    
    return transactionsWithBalance
  }

  return { 
    transactions: calculateRunningBalance(), 
    loading, 
    addCreditTransaction 
  }
}

// Helper hook to get credit summary for a customer
export function useCreditSummary(customerId) {
  const [summary, setSummary] = useState({
    totalCredit: 0,
    totalPurchases: 0,
    totalPayments: 0,
    totalAdjustments: 0,
    transactionCount: 0
  })
  const [loading, setLoading] = useState(true)
  const { transactions, loading: transactionsLoading } = useCreditHistory(customerId)

  useEffect(() => {
    if (!transactionsLoading) {
      const totals = transactions.reduce((acc, transaction) => {
        acc.transactionCount++
        
        if (transaction.type === CreditTransactionType.PURCHASE) {
          acc.totalPurchases += transaction.amount
        } else if (transaction.type === CreditTransactionType.PAYMENT) {
          acc.totalPayments += transaction.amount
        } else if (transaction.type === CreditTransactionType.ADJUSTMENT) {
          acc.totalAdjustments += transaction.amount
        }
        
        return acc
      }, {
        totalCredit: 0,
        totalPurchases: 0,
        totalPayments: 0,
        totalAdjustments: 0,
        transactionCount: 0
      })

      totals.totalCredit = totals.totalPayments + totals.totalAdjustments - totals.totalPurchases
      
      setSummary(totals)
      setLoading(false)
    }
  }, [transactions, transactionsLoading])

  return { summary, loading }
}
