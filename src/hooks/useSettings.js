import { useState, useEffect } from 'react'
import { doc, setDoc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { useOrg } from '../contexts/OrgContext'

export const CURRENCIES = [
  { code: 'USD', symbol: '$',   name: 'US Dollar' },
  { code: 'EUR', symbol: '€',   name: 'Euro' },
  { code: 'GBP', symbol: '£',   name: 'British Pound' },
  { code: 'JPY', symbol: '¥',   name: 'Japanese Yen' },
  { code: 'INR', symbol: '₹',   name: 'Indian Rupee' },
  { code: 'LKR', symbol: 'Rs',  name: 'Sri Lankan Rupee' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$',  name: 'Australian Dollar' },
  { code: 'SGD', symbol: 'S$',  name: 'Singapore Dollar' },
  { code: 'MYR', symbol: 'RM',  name: 'Malaysian Ringgit' },
]

export const DEFAULT_SETTINGS = {
  taxEnabled: false,
  taxRate: 10,
  discountMode: 'global',
  globalDiscount: 0,
  categoryDiscounts: {},
  cartDiscountEnabled: false,
  currency: 'USD',
  storeInfo: {
    name: '',
    address: '',
    phone: '',
    footer: 'Thank you for your purchase!',
  },
  miscEnabled: true,
  reprintEnabled: false,
  defaultQuantities: [
    { id: '1', value: 0.25 },
    { id: '2', value: 0.5 },
    { id: '3', value: 1 },
    { id: '4', value: 1.5 },
    { id: '5', value: 2 },
  ],
}

export function useSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const { userProfile, isSuperAdmin } = useAuth()
  const { selectedOrgId, hasAdminAccessToOrganization } = useOrg()

  // Determine which orgId to use and validate admin access
  const orgId = isSuperAdmin ? selectedOrgId : (selectedOrgId || userProfile?.orgId)
  const hasAdminAccess = orgId && hasAdminAccessToOrganization(orgId)

  // Listen for real-time updates from Firebase - per organization
  useEffect(() => {
    if (!orgId) {
      setLoading(false)
      return
    }

    const docRef = doc(db, 'organizations', orgId, 'settings', 'config')
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const saved = docSnap.data()
        setSettings({
          ...DEFAULT_SETTINGS,
          ...saved,
          storeInfo: { ...DEFAULT_SETTINGS.storeInfo, ...(saved.storeInfo || {}) },
        })
      } else {
        setDoc(docRef, DEFAULT_SETTINGS)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [orgId])

  const updateSettings = async (updates) => {
    if (!orgId) {
      console.error('No organization selected')
      return
    }
    
    if (!hasAdminAccess) {
      console.error('User does not have admin access to update settings for this organization')
      throw new Error('You do not have admin access to update settings for this organization')
    }
    
    const updated = { ...settings, ...updates }
    const docRef = doc(db, 'organizations', orgId, 'settings', 'config')
    
    try {
      await setDoc(docRef, updated)
      
      // Log settings update
      try {
        const { logUserAction } = await import('../utils/logger')
        await logUserAction(
          'settings_update',
          `Updated organization settings: ${Object.keys(updates).join(', ')}`,
          userProfile,
          orgId,
          { updates, previousSettings: settings }
        )
      } catch (logError) {
        console.error('Failed to log settings update:', logError)
      }
    } catch (error) {
      console.error('Error updating settings:', error)
      throw error
    }
  }

  const currencySymbol = CURRENCIES.find(c => c.code === settings.currency)?.symbol || '$'

  return { settings, updateSettings, currencySymbol, loading }
}