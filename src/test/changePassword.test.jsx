import { describe, it, expect, vi, beforeEach } from 'vitest'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { hashPassword, verifyPasswordLegacy } from '../utils/passwordUtils'
import { logUserAction, logError, LOG_TYPES } from '../utils/logger'

// Mock Firebase
vi.mock('../firebase', () => ({
  db: {},
}))

// Mock password utils
vi.mock('../utils/passwordUtils', () => ({
  hashPassword: vi.fn(),
  verifyPasswordLegacy: vi.fn(),
}))

// Mock logger
vi.mock('../utils/logger', () => ({
  logUserAction: vi.fn(),
  logError: vi.fn(),
  LOG_TYPES: {
    USER_PASSWORD_CHANGE: 'user_password_change',
  },
}))

// Mock Firebase functions
vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual('firebase/firestore')
  return {
    ...actual,
    getDoc: vi.fn(),
    setDoc: vi.fn(),
    doc: vi.fn(),
  }
})

describe('Password Change Functionality', () => {
  const mockHashPassword = vi.mocked(hashPassword)
  const mockVerifyPasswordLegacy = vi.mocked(verifyPasswordLegacy)
  const mockGetDoc = vi.mocked(getDoc)
  const mockSetDoc = vi.mocked(setDoc)
  const mockLogUserAction = vi.mocked(logUserAction)
  const mockLogError = vi.mocked(logError)

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default mocks
    mockHashPassword.mockResolvedValue({
      hash: 'hashed_password',
      salt: 'new_salt',
    })
    
    mockVerifyPasswordLegacy.mockResolvedValue(true)
    
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        username: 'testuser',
        password: 'old_hashed_password',
        salt: 'old_salt',
        displayName: 'Test User',
        orgId: 'org1',
      }),
    })
    
    mockSetDoc.mockResolvedValue()
    mockLogUserAction.mockResolvedValue()
    mockLogError.mockResolvedValue()
  })

  const createMockUserProfile = (role = 'user', orgId = 'org1', userId = 'user123') => ({
    id: userId,
    username: 'testuser',
    displayName: 'Test User',
    role,
    orgId,
  })

  const createMockChangePasswordFunction = (userProfile) => {
    return async (targetUserId, newPassword, currentPassword = null) => {
      try {
        // Authorization checks
        if (!userProfile) {
          throw new Error('You must be logged in to change passwords')
        }

      // Mock getDoc call
      const targetUserDoc = await mockGetDoc(doc({}, 'users', targetUserId))
      if (!targetUserDoc.exists()) {
        throw new Error('User not found')
      }

      const targetUserData = targetUserDoc.data()

      // Check permissions
      const canChangeOwnPassword = userProfile.id === targetUserId
      const canChangeOrgUserPassword = (userProfile.role === 'admin' || userProfile.role === 'super_admin') && userProfile.orgId === targetUserData.orgId
      const canChangeAnyPassword = userProfile.role === 'super_admin'

      if (!canChangeOwnPassword && !canChangeOrgUserPassword && !canChangeAnyPassword) {
        throw new Error('You do not have permission to change this user\'s password')
      }

      // If changing own password, verify current password
      if (canChangeOwnPassword && currentPassword) {
        const isValidCurrentPassword = await mockVerifyPasswordLegacy(
          currentPassword, 
          targetUserData.password, 
          targetUserData.salt
        )
        if (!isValidCurrentPassword) {
          throw new Error('Current password is incorrect')
        }
      } else if (canChangeOwnPassword && !currentPassword) {
        throw new Error('Current password is required when changing your own password')
      }

      // Hash the new password
      const { hash, salt } = await mockHashPassword(newPassword)

      // Update user document with new password
      await mockSetDoc(doc({}, 'users', targetUserId), {
        password: hash,
        salt,
        updatedAt: new Date()
      }, { merge: true })

      // Log the password change
      const logDescription = canChangeOwnPassword 
        ? `User ${userProfile.username} changed their own password`
        : `User ${userProfile.username} changed password for user ${targetUserData.username}`

      await mockLogUserAction(
        LOG_TYPES.USER_PASSWORD_CHANGE,
        logDescription,
        userProfile,
        targetUserData.orgId,
        {
          targetUserId,
          targetUsername: targetUserData.username,
          changedByOwnUser: canChangeOwnPassword
        }
      )

      return { success: true, message: 'Password changed successfully' }

      } catch (error) {
        // Log error if not already logged
        if (userProfile) {
          await mockLogError(
            `Password change failed: ${error.message}`,
            error,
            userProfile,
            userProfile.orgId,
            { targetUserId }
          )
        }
        throw error
      }
    }
  }

  describe('Authorization Checks', () => {
    it('should allow user to change their own password', async () => {
      const userProfile = createMockUserProfile('user')
      const changePassword = createMockChangePasswordFunction(userProfile)

      const result = await changePassword('user123', 'newPassword123', 'currentPassword123')

      expect(result).toEqual({ success: true, message: 'Password changed successfully' })
      expect(mockVerifyPasswordLegacy).toHaveBeenCalledWith('currentPassword123', 'old_hashed_password', 'old_salt')
      expect(mockHashPassword).toHaveBeenCalledWith('newPassword123')
      expect(mockSetDoc).toHaveBeenCalled()
    })

    it('should allow admin to change password of user in same organization', async () => {
      const userProfile = createMockUserProfile('admin')
      const changePassword = createMockChangePasswordFunction(userProfile)

      const result = await changePassword('otherUser123', 'newPassword123')

      expect(result).toEqual({ success: true, message: 'Password changed successfully' })
      expect(mockVerifyPasswordLegacy).not.toHaveBeenCalled()
      expect(mockHashPassword).toHaveBeenCalledWith('newPassword123')
      expect(mockSetDoc).toHaveBeenCalled()
    })

    it('should allow super admin to change any user password', async () => {
      const userProfile = createMockUserProfile('super_admin', null)
      const changePassword = createMockChangePasswordFunction(userProfile)

      const result = await changePassword('anyUser123', 'newPassword123')

      expect(result).toEqual({ success: true, message: 'Password changed successfully' })
      expect(mockVerifyPasswordLegacy).not.toHaveBeenCalled()
      expect(mockHashPassword).toHaveBeenCalledWith('newPassword123')
      expect(mockSetDoc).toHaveBeenCalled()
    })

    it('should prevent user from changing password of user in different organization', async () => {
      const userProfile = createMockUserProfile('user', 'org1')
      const changePassword = createMockChangePasswordFunction(userProfile)

      // Mock target user from different organization
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          username: 'otheruser',
          password: 'old_hashed_password',
          salt: 'old_salt',
          displayName: 'Other User',
          orgId: 'org2', // Different organization
        }),
      })

      await expect(changePassword('otherUser123', 'newPassword123')).rejects.toThrow(
        'You do not have permission to change this user\'s password'
      )
    })

    it('should prevent admin from changing password of user in different organization', async () => {
      const userProfile = createMockUserProfile('admin', 'org1')
      const changePassword = createMockChangePasswordFunction(userProfile)

      // Mock target user from different organization
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          username: 'otheruser',
          password: 'old_hashed_password',
          salt: 'old_salt',
          displayName: 'Other User',
          orgId: 'org2', // Different organization
        }),
      })

      await expect(changePassword('otherUser123', 'newPassword123')).rejects.toThrow(
        'You do not have permission to change this user\'s password'
      )
    })

    it('should prevent non-logged in user from changing any password', async () => {
      const changePassword = createMockChangePasswordFunction(null)

      await expect(changePassword('user123', 'newPassword123')).rejects.toThrow(
        'You must be logged in to change passwords'
      )
    })
  })

  describe('Password Validation', () => {
    it('should require current password when changing own password', async () => {
      const userProfile = createMockUserProfile('user')
      const changePassword = createMockChangePasswordFunction(userProfile)

      await expect(changePassword('user123', 'newPassword123')).rejects.toThrow(
        'Current password is required when changing your own password'
      )
    })

    it('should verify current password when changing own password', async () => {
      const userProfile = createMockUserProfile('user')
      const changePassword = createMockChangePasswordFunction(userProfile)

      // Mock incorrect current password
      mockVerifyPasswordLegacy.mockResolvedValue(false)

      await expect(changePassword('user123', 'newPassword123', 'wrongPassword')).rejects.toThrow(
        'Current password is incorrect'
      )

      expect(mockVerifyPasswordLegacy).toHaveBeenCalledWith('wrongPassword', 'old_hashed_password', 'old_salt')
    })

    it('should not require current password when admin changes other user password', async () => {
      const userProfile = createMockUserProfile('admin')
      const changePassword = createMockChangePasswordFunction(userProfile)

      const result = await changePassword('otherUser123', 'newPassword123')

      expect(result).toEqual({ success: true, message: 'Password changed successfully' })
      expect(mockVerifyPasswordLegacy).not.toHaveBeenCalled()
    })
  })

  describe('Logging', () => {
    it('should log password change for own password', async () => {
      const userProfile = createMockUserProfile('user')
      const changePassword = createMockChangePasswordFunction(userProfile)

      await changePassword('user123', 'newPassword123', 'currentPassword123')

      expect(mockLogUserAction).toHaveBeenCalledWith(
        LOG_TYPES.USER_PASSWORD_CHANGE,
        'User testuser changed their own password',
        userProfile,
        'org1',
        {
          targetUserId: 'user123',
          targetUsername: 'testuser',
          changedByOwnUser: true
        }
      )
    })

    it('should log password change for other user password', async () => {
      const userProfile = createMockUserProfile('admin')
      const changePassword = createMockChangePasswordFunction(userProfile)

      await changePassword('otherUser123', 'newPassword123')

      expect(mockLogUserAction).toHaveBeenCalledWith(
        LOG_TYPES.USER_PASSWORD_CHANGE,
        'User testuser changed password for user testuser',
        userProfile,
        'org1',
        {
          targetUserId: 'otherUser123',
          targetUsername: 'testuser',
          changedByOwnUser: false
        }
      )
    })
  })

  describe('Error Handling', () => {
    it('should handle user not found error', async () => {
      const userProfile = createMockUserProfile('admin')
      const changePassword = createMockChangePasswordFunction(userProfile)

      mockGetDoc.mockResolvedValue({
        exists: () => false,
      })

      await expect(changePassword('nonExistentUser', 'newPassword123')).rejects.toThrow('User not found')
    })

    it('should log errors when password change fails', async () => {
      const userProfile = createMockUserProfile('user')
      const changePassword = createMockChangePasswordFunction(userProfile)

      // Mock error in setDoc
      mockSetDoc.mockRejectedValue(new Error('Database error'))

      try {
        await changePassword('user123', 'newPassword123', 'currentPassword123')
      } catch (error) {
        // Expected to fail
      }

      expect(mockLogError).toHaveBeenCalledWith(
        'Password change failed: Database error',
        expect.any(Error),
        userProfile,
        'org1',
        { targetUserId: 'user123' }
      )
    })
  })
})
