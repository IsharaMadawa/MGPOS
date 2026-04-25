import { useState, useEffect } from 'react'
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'

//const STORAGE_KEY = 'pos_settings'
const SETTINGS_DOC_ID = 'global_settings'

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

const DEFAULT_SETTINGS = {
  taxEnabled: false,
  taxRate: 10,
  discountMode: 'global', // 'global' | 'category' | 'item'
  globalDiscount: 0,
  categoryDiscounts: {}, // { 'Category Name': { enabled: boolean, type: 'percentage'|'fixed', value: number } }
  currency: 'USD',
  storeInfo: {
    name: '',
    address: '',
    phone: '',
    footer: 'Thank you for your purchase!',
  },
  miscEnabled: true,
  defaultQuantities: [
    { id: '1', value: 0.25 },
    { id: '2', value: 0.5 },
    { id: '3', value: 1 },
    { id: '4', value: 1.5 },
    { id: '5', value: 2 },
  ],
}

// function loadSettings() {
//   try {  
//     const raw = localStorage.getItem(STORAGE_KEY)
//     if (!raw) return DEFAULT_SETTINGS
//     const saved = JSON.parse(raw)
//     return {
//       ...DEFAULT_SETTINGS,
//       ...saved,
//       storeInfo: { ...DEFAULT_SETTINGS.storeInfo, ...(saved.storeInfo || {}) },
//     }
//   } catch {
//     return DEFAULT_SETTINGS
//   }
// }

// export function useSettings() {
//   const [settings, setSettings] = useState(loadSettings)

//   const updateSettings = (updates) => {
//     const updated = { ...settings, ...updates }
//     localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
//     setSettings(updated)
//   }

//   const currencySymbol = CURRENCIES.find(c => c.code === settings.currency)?.symbol || '$'

//   return { settings, updateSettings, currencySymbol }
// }

export function useSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)

  // Listen for real-time updates from Firebase
  useEffect(() => {
    const docRef = doc(db, "pos_data", SETTINGS_DOC_ID)
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const saved = docSnap.data()
        setSettings({
          ...DEFAULT_SETTINGS,
          ...saved,
          storeInfo: { ...DEFAULT_SETTINGS.storeInfo, ...(saved.storeInfo || {}) },
        })
      } else {
        // If no settings exist in cloud, initialize them
        setDoc(docRef, DEFAULT_SETTINGS)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const updateSettings = async (updates) => {
    const updated = { ...settings, ...updates }
    const docRef = doc(db, "pos_data", SETTINGS_DOC_ID)
    
    try {
      await setDoc(docRef, updated)
      // No need to setSettings manually; onSnapshot will trigger the update
    } catch (error) {
      console.error("Error updating settings:", error)
    }
  }

  const currencySymbol = CURRENCIES.find(c => c.code === settings.currency)?.symbol || '$'

  return { settings, updateSettings, currencySymbol, loading }
}