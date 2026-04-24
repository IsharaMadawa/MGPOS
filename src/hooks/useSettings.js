import { useState } from 'react'

const STORAGE_KEY = 'pos_settings'

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
  globalDiscountEnabled: false,
  globalDiscount: 0,
  currency: 'USD',
  storeInfo: {
    name: '',
    address: '',
    phone: '',
    footer: 'Thank you for your purchase!',
  },
  miscEnabled: true,
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SETTINGS
    const saved = JSON.parse(raw)
    return {
      ...DEFAULT_SETTINGS,
      ...saved,
      storeInfo: { ...DEFAULT_SETTINGS.storeInfo, ...(saved.storeInfo || {}) },
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function useSettings() {
  const [settings, setSettings] = useState(loadSettings)

  const updateSettings = (updates) => {
    const updated = { ...settings, ...updates }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    setSettings(updated)
  }

  const currencySymbol = CURRENCIES.find(c => c.code === settings.currency)?.symbol || '$'

  return { settings, updateSettings, currencySymbol }
}
