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
  // Default master data - empty categories, comprehensive units
  masterCategories: [],
  unitsOfMeasure: [
    // Weight units
    { id: 'kg', name: 'Kilogram', abbreviation: 'kg', type: 'weight', isStandard: true },
    { id: 'g', name: 'Gram', abbreviation: 'g', type: 'weight', isStandard: true },
    { id: 'mg', name: 'Milligram', abbreviation: 'mg', type: 'weight', isStandard: true },
    { id: 'lb', name: 'Pound', abbreviation: 'lb', type: 'weight', isStandard: true },
    { id: 'oz', name: 'Ounce', abbreviation: 'oz', type: 'weight', isStandard: true },
    { id: 't', name: 'Ton', abbreviation: 't', type: 'weight', isStandard: true },
    
    // Volume units
    { id: 'l', name: 'Liter', abbreviation: 'L', type: 'volume', isStandard: true },
    { id: 'ml', name: 'Milliliter', abbreviation: 'mL', type: 'volume', isStandard: true },
    { id: 'gal', name: 'Gallon', abbreviation: 'gal', type: 'volume', isStandard: true },
    { id: 'qt', name: 'Quart', abbreviation: 'qt', type: 'volume', isStandard: true },
    { id: 'pt', name: 'Pint', abbreviation: 'pt', type: 'volume', isStandard: true },
    { id: 'fl_oz', name: 'Fluid Ounce', abbreviation: 'fl oz', type: 'volume', isStandard: true },
    
    // Length units
    { id: 'm', name: 'Meter', abbreviation: 'm', type: 'length', isStandard: true },
    { id: 'cm', name: 'Centimeter', abbreviation: 'cm', type: 'length', isStandard: true },
    { id: 'mm', name: 'Millimeter', abbreviation: 'mm', type: 'length', isStandard: true },
    { id: 'km', name: 'Kilometer', abbreviation: 'km', type: 'length', isStandard: true },
    { id: 'in', name: 'Inch', abbreviation: 'in', type: 'length', isStandard: true },
    { id: 'ft', name: 'Foot', abbreviation: 'ft', type: 'length', isStandard: true },
    { id: 'yd', name: 'Yard', abbreviation: 'yd', type: 'length', isStandard: true },
    { id: 'mi', name: 'Mile', abbreviation: 'mi', type: 'length', isStandard: true },
    
    // Area units
    { id: 'sq_m', name: 'Square Meter', abbreviation: 'm²', type: 'area', isStandard: true },
    { id: 'sq_cm', name: 'Square Centimeter', abbreviation: 'cm²', type: 'area', isStandard: true },
    { id: 'sq_ft', name: 'Square Foot', abbreviation: 'ft²', type: 'area', isStandard: true },
    { id: 'sq_in', name: 'Square Inch', abbreviation: 'in²', type: 'area', isStandard: true },
    { id: 'acre', name: 'Acre', abbreviation: 'acre', type: 'area', isStandard: true },
    { id: 'ha', name: 'Hectare', abbreviation: 'ha', type: 'area', isStandard: true },
    
    // Unit/Count units
    { id: 'pcs', name: 'Pieces', abbreviation: 'pcs', type: 'unit', isStandard: true },
    { id: 'unit', name: 'Unit', abbreviation: 'unit', type: 'unit', isStandard: true },
    { id: 'box', name: 'Box', abbreviation: 'box', type: 'unit', isStandard: true },
    { id: 'pkg', name: 'Package', abbreviation: 'pkg', type: 'unit', isStandard: true },
    { id: 'set', name: 'Set', abbreviation: 'set', type: 'unit', isStandard: true },
    { id: 'pair', name: 'Pair', abbreviation: 'pair', type: 'unit', isStandard: true },
    { id: 'dozen', name: 'Dozen', abbreviation: 'doz', type: 'unit', isStandard: true },
    { id: 'bottle', name: 'Bottle', abbreviation: 'bottle', type: 'unit', isStandard: true },
    { id: 'bag', name: 'Bag', abbreviation: 'bag', type: 'unit', isStandard: true },
    { id: 'carton', name: 'Carton', abbreviation: 'carton', type: 'unit', isStandard: true },
    
    // Time units
    { id: 'sec', name: 'Second', abbreviation: 's', type: 'time', isStandard: true },
    { id: 'min', name: 'Minute', abbreviation: 'min', type: 'time', isStandard: true },
    { id: 'hr', name: 'Hour', abbreviation: 'h', type: 'time', isStandard: true },
    { id: 'day', name: 'Day', abbreviation: 'day', type: 'time', isStandard: true },
    { id: 'week', name: 'Week', abbreviation: 'week', type: 'time', isStandard: true },
    { id: 'month', name: 'Month', abbreviation: 'month', type: 'time', isStandard: true },
    { id: 'year', name: 'Year', abbreviation: 'year', type: 'time', isStandard: true },
    
    // Temperature units
    { id: 'c', name: 'Celsius', abbreviation: '°C', type: 'temperature', isStandard: true },
    { id: 'f', name: 'Fahrenheit', abbreviation: '°F', type: 'temperature', isStandard: true },
    { id: 'k', name: 'Kelvin', abbreviation: 'K', type: 'temperature', isStandard: true },
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