import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'

export const OrgContext = createContext(null)

export function useOrg() {
  return useContext(OrgContext)
}

export function OrgProvider({ children }) {
  const { userProfile } = useAuth()
  const [selectedOrgId, setSelectedOrgId] = useState(() => {
    // Load from localStorage on mount
    return localStorage.getItem('pos_selected_org')
  })

  // Auto-select primary organization when user profile loads or changes
  useEffect(() => {
    if (userProfile && !selectedOrgId) {
      // For super admins, don't auto-select any organization
      if (userProfile.role === 'super_admin') {
        return
      }
      
      // For multi-org users, use primary organization
      if (userProfile.organizations && userProfile.organizations.length > 0) {
        const primaryOrgId = userProfile.primaryOrgId || userProfile.organizations[0].orgId
        setSelectedOrgId(primaryOrgId)
      }
      // For backward compatibility, use single orgId
      else if (userProfile.orgId) {
        setSelectedOrgId(userProfile.orgId)
      }
    }
  }, [userProfile, selectedOrgId])

  // Persist selection
  useEffect(() => {
    if (selectedOrgId) {
      localStorage.setItem('pos_selected_org', selectedOrgId)
    } else {
      localStorage.removeItem('pos_selected_org')
    }
  }, [selectedOrgId])

  // Get current organization info from user profile
  const getCurrentOrganization = () => {
    if (!userProfile || !selectedOrgId) return null
    
    // For multi-org users
    if (userProfile.organizations) {
      return userProfile.organizations.find(org => org.orgId === selectedOrgId)
    }
    
    // For backward compatibility
    if (userProfile.orgId === selectedOrgId) {
      return {
        orgId: userProfile.orgId,
        role: userProfile.role
      }
    }
    
    return null
  }

  // Get all accessible organizations for the user
  const getAccessibleOrganizations = () => {
    if (!userProfile) return []
    
    // For multi-org users
    if (userProfile.organizations) {
      return userProfile.organizations
    }
    
    // For backward compatibility
    if (userProfile.orgId) {
      return [{
        orgId: userProfile.orgId,
        role: userProfile.role
      }]
    }
    
    return []
  }

  // Check if user has access to a specific organization
  const hasAccessToOrganization = (orgId) => {
    if (!userProfile || !orgId) return false
    
    // For multi-org users
    if (userProfile.organizations) {
      return userProfile.organizations.some(org => org.orgId === orgId)
    }
    
    // For backward compatibility
    return userProfile.orgId === orgId
  }

  // Get user's role in a specific organization
  const getRoleInOrganization = (orgId) => {
    if (!userProfile || !orgId) return null
    
    // For multi-org users
    if (userProfile.organizations) {
      const org = userProfile.organizations.find(org => org.orgId === orgId)
      return org?.role || null
    }
    
    // For backward compatibility
    if (userProfile.orgId === orgId) {
      return userProfile.role
    }
    
    return null
  }

  // Check if user has admin access to a specific organization
  const hasAdminAccessToOrganization = (orgId) => {
    if (!userProfile || !orgId) return false
    
    // Super admins have access to all organizations
    if (userProfile.role === 'super_admin') return true
    
    const role = getRoleInOrganization(orgId)
    return role === 'admin' || role === 'super_admin'
  }

  // Get all organizations where user has admin access
  const getAdminOrganizations = () => {
    if (!userProfile) return []
    
    // Super admins have access to all organizations (return empty to be handled elsewhere)
    if (userProfile.role === 'super_admin') return []
    
    // For multi-org users
    if (userProfile.organizations) {
      return userProfile.organizations.filter(org => 
        org.role === 'admin' || org.role === 'super_admin'
      )
    }
    
    // For backward compatibility
    if (userProfile.orgId && (userProfile.role === 'admin' || userProfile.role === 'super_admin')) {
      return [{
        orgId: userProfile.orgId,
        role: userProfile.role
      }]
    }
    
    return []
  }

  const value = {
    selectedOrgId,
    setSelectedOrgId,
    clearSelectedOrg: () => setSelectedOrgId(null),
    getCurrentOrganization,
    getAccessibleOrganizations,
    hasAccessToOrganization,
    getRoleInOrganization,
    hasAdminAccessToOrganization,
    getAdminOrganizations,
  }

  return (
    <OrgContext.Provider value={value}>
      {children}
    </OrgContext.Provider>
  )
}