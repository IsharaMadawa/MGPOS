import { describe, it, expect, vi, beforeEach } from 'vitest'

// Test localStorage mock behavior
describe('localStorage Mock', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should store and retrieve values', () => {
    localStorage.setItem('test-key', 'test-value')
    expect(localStorage.getItem('test-key')).toBe('test-value')
  })

  it('should remove values', () => {
    localStorage.setItem('test-key', 'test-value')
    localStorage.removeItem('test-key')
    expect(localStorage.getItem('test-key')).toBeNull()
  })

  it('should clear all values', () => {
    localStorage.setItem('key1', 'value1')
    localStorage.setItem('key2', 'value2')
    localStorage.clear()
    expect(localStorage.getItem('key1')).toBeNull()
    expect(localStorage.getItem('key2')).toBeNull()
  })
})

// Test role calculation logic (extracted from AuthContext)
describe('Role Calculations', () => {
  const calculateRoles = (userProfile) => {
    const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'super_admin'
    const isSuperAdmin = userProfile?.role === 'super_admin'
    return { isAdmin, isSuperAdmin }
  }

  it('should identify regular user', () => {
    const { isAdmin, isSuperAdmin } = calculateRoles({ role: 'user', orgId: 'org-1' })
    expect(isAdmin).toBe(false)
    expect(isSuperAdmin).toBe(false)
  })

  it('should identify admin', () => {
    const { isAdmin, isSuperAdmin } = calculateRoles({ role: 'admin', orgId: 'org-1' })
    expect(isAdmin).toBe(true)
    expect(isSuperAdmin).toBe(false)
  })

  it('should identify super_admin', () => {
    const { isAdmin, isSuperAdmin } = calculateRoles({ role: 'super_admin', orgId: null })
    expect(isAdmin).toBe(true)
    expect(isSuperAdmin).toBe(true)
  })

  it('should handle null userProfile', () => {
    const { isAdmin, isSuperAdmin } = calculateRoles(null)
    expect(isAdmin).toBe(false)
    expect(isSuperAdmin).toBe(false)
  })

  it('should handle undefined role', () => {
    const { isAdmin, isSuperAdmin } = calculateRoles({})
    expect(isAdmin).toBe(false)
    expect(isSuperAdmin).toBe(false)
  })
})

// Test session storage logic
describe('Session Storage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should save user session', () => {
    const userProfile = { id: 'user-1', username: 'testuser', displayName: 'Test User', role: 'user' }
    localStorage.setItem('pos_user_id', 'user-1')
    localStorage.setItem('pos_user_data', JSON.stringify(userProfile))
    
    expect(localStorage.getItem('pos_user_id')).toBe('user-1')
    expect(JSON.parse(localStorage.getItem('pos_user_data'))).toEqual(userProfile)
  })

  it('should clear user session', () => {
    localStorage.setItem('pos_user_id', 'user-1')
    localStorage.setItem('pos_user_data', JSON.stringify({ id: 'user-1' }))
    
    localStorage.removeItem('pos_user_id')
    localStorage.removeItem('pos_user_data')
    
    expect(localStorage.getItem('pos_user_id')).toBeNull()
    expect(localStorage.getItem('pos_user_data')).toBeNull()
  })

  it('should handle invalid JSON in session', () => {
    localStorage.setItem('pos_user_id', 'some-id')
    localStorage.setItem('pos_user_data', 'invalid-json')
    
    let parsed = null
    try {
      parsed = JSON.parse('invalid-json')
    } catch (e) {
      parsed = null
    }
    
    expect(parsed).toBeNull()
  })
})

// Test unique username login logic (updated after removing org selection)
describe('Unique Username Login', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should handle unique username lookup', () => {
    // Simulate the simplified login logic - usernames are now unique
    const mockUsers = [
      { id: 'user-1', username: 'testuser', orgId: 'org-1' },
      { id: 'user-2', username: 'admin', orgId: 'org-2' }
    ]
    
    // Find user by username (should return exactly one since usernames are unique)
    const findUserByUsername = (username) => {
      return mockUsers.find(u => u.username === username)
    }
    
    expect(findUserByUsername('testuser')).toEqual({ id: 'user-1', username: 'testuser', orgId: 'org-1' })
    expect(findUserByUsername('admin')).toEqual({ id: 'user-2', username: 'admin', orgId: 'org-2' })
    expect(findUserByUsername('nonexistent')).toBeUndefined()
  })

  it('should get orgId from user profile (no selection needed)', () => {
    // Since org selection is removed from login, orgId comes from user profile
    const getOrgIdFromProfile = (userProfile) => userProfile?.orgId ?? null
    
    expect(getOrgIdFromProfile({ orgId: 'org-123' })).toBe('org-123')
    expect(getOrgIdFromProfile({ orgId: null })).toBeNull()
    expect(getOrgIdFromProfile(null)).toBeNull()
  })

  it('should handle super admin orgId (null)', () => {
    // Super admins have orgId: null
    const superAdminProfile = { id: 'super-admin-1', username: 'superadmin', orgId: null, role: 'super_admin' }
    expect(superAdminProfile.orgId).toBeNull()
  })
})

// Test multi-organization functionality
describe('Multi-Organization Functionality', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should handle backward compatibility for single orgId structure', () => {
    // Test conversion from old single orgId to new multi-org structure
    const oldUserProfile = {
      id: 'user-1',
      username: 'testuser',
      orgId: 'org-1',
      role: 'admin'
    }

    // Simulate the conversion logic in AuthContext
    const convertToMultiOrg = (userProfile) => {
      let organizations = userProfile.organizations || []
      let primaryOrgId = userProfile.primaryOrgId
      
      // For backward compatibility, handle single orgId structure
      if (userProfile.orgId && !organizations.length) {
        organizations = [{ orgId: userProfile.orgId, role: userProfile.role || 'user' }]
        primaryOrgId = userProfile.orgId
      }
      
      return { organizations, primaryOrgId }
    }

    const result = convertToMultiOrg(oldUserProfile)
    expect(result.organizations).toEqual([{ orgId: 'org-1', role: 'admin' }])
    expect(result.primaryOrgId).toBe('org-1')
  })

  it('should handle multi-org user profile', () => {
    const multiOrgUserProfile = {
      id: 'user-1',
      username: 'testuser',
      organizations: [
        { orgId: 'org-1', role: 'admin' },
        { orgId: 'org-2', role: 'user' }
      ],
      primaryOrgId: 'org-1'
    }

    // Test organization access logic
    const hasAccessToOrganization = (userProfile, orgId) => {
      if (userProfile.organizations) {
        return userProfile.organizations.some(org => org.orgId === orgId)
      }
      return userProfile.orgId === orgId
    }

    expect(hasAccessToOrganization(multiOrgUserProfile, 'org-1')).toBe(true)
    expect(hasAccessToOrganization(multiOrgUserProfile, 'org-2')).toBe(true)
    expect(hasAccessToOrganization(multiOrgUserProfile, 'org-3')).toBe(false)
  })

  it('should get user role in specific organization', () => {
    const multiOrgUserProfile = {
      id: 'user-1',
      username: 'testuser',
      organizations: [
        { orgId: 'org-1', role: 'admin' },
        { orgId: 'org-2', role: 'user' }
      ],
      primaryOrgId: 'org-1'
    }

    const getRoleInOrganization = (userProfile, orgId) => {
      if (userProfile.organizations) {
        const org = userProfile.organizations.find(org => org.orgId === orgId)
        return org?.role || null
      }
      return userProfile.orgId === orgId ? userProfile.role : null
    }

    expect(getRoleInOrganization(multiOrgUserProfile, 'org-1')).toBe('admin')
    expect(getRoleInOrganization(multiOrgUserProfile, 'org-2')).toBe('user')
    expect(getRoleInOrganization(multiOrgUserProfile, 'org-3')).toBeNull()
  })

  it('should handle primary organization selection', () => {
    const userProfile = {
      id: 'user-1',
      username: 'testuser',
      organizations: [
        { orgId: 'org-1', role: 'admin' },
        { orgId: 'org-2', role: 'user' },
        { orgId: 'org-3', role: 'user' }
      ],
      primaryOrgId: 'org-2'
    }

    // Test primary organization logic
    const getActiveOrganization = (userProfile, selectedOrgId) => {
      const activeOrgId = selectedOrgId || userProfile.primaryOrgId || userProfile.organizations[0]?.orgId
      return userProfile.organizations.find(org => org.orgId === activeOrgId)
    }

    // Test with no selected org (should use primary)
    const activeOrg1 = getActiveOrganization(userProfile, null)
    expect(activeOrg1).toEqual({ orgId: 'org-2', role: 'user' })

    // Test with selected org
    const activeOrg2 = getActiveOrganization(userProfile, 'org-1')
    expect(activeOrg2).toEqual({ orgId: 'org-1', role: 'admin' })
  })

  it('should validate organization access during login', () => {
    const userProfile = {
      id: 'user-1',
      username: 'testuser',
      organizations: [
        { orgId: 'org-1', role: 'admin' },
        { orgId: 'org-2', role: 'user' }
      ],
      primaryOrgId: 'org-1'
    }

    // Test organization access validation
    const validateOrgAccess = (userProfile, selectedOrgId) => {
      if (selectedOrgId && userProfile.organizations) {
        return userProfile.organizations.some(org => org.orgId === selectedOrgId)
      }
      return true // No validation needed if no selected org
    }

    expect(validateOrgAccess(userProfile, 'org-1')).toBe(true)
    expect(validateOrgAccess(userProfile, 'org-2')).toBe(true)
    expect(validateOrgAccess(userProfile, 'org-3')).toBe(false)
    expect(validateOrgAccess(userProfile, null)).toBe(true)
  })
})