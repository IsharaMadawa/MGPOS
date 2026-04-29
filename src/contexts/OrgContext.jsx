import { createContext, useContext, useState, useEffect } from 'react'

export const OrgContext = createContext(null)

export function useOrg() {
  return useContext(OrgContext)
}

export function OrgProvider({ children }) {
  const [selectedOrgId, setSelectedOrgId] = useState(() => {
    // Load from localStorage on mount
    return localStorage.getItem('pos_selected_org')
  })

  // Persist selection
  useEffect(() => {
    if (selectedOrgId) {
      localStorage.setItem('pos_selected_org', selectedOrgId)
    } else {
      localStorage.removeItem('pos_selected_org')
    }
  }, [selectedOrgId])

  const value = {
    selectedOrgId,
    setSelectedOrgId,
    clearSelectedOrg: () => setSelectedOrgId(null),
  }

  return (
    <OrgContext.Provider value={value}>
      {children}
    </OrgContext.Provider>
  )
}