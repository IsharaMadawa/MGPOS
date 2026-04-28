// Create Super Admin User Script
// Run this script to create a super admin user for your MGPOS application

import { hashPassword } from '../src/utils/passwordUtils.js'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../src/firebase.js'

/**
 * Creates a super admin user
 * @param {string} username - Username for the super admin
 * @param {string} password - Password for the super admin
 * @param {string} displayName - Display name (optional)
 * @param {string} email - Email (optional)
 */
export async function createSuperAdmin(username, password, displayName = null, email = null) {
  try {
    console.log('Creating super admin user...')
    
    // Hash the password
    const { hash, salt } = await hashPassword(password)
    
    // Create user document with custom ID
    const userId = 'super_admin_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    
    const superAdminProfile = {
      username,
      password: hash,
      salt,
      displayName: displayName || 'Super Admin',
      email,
      role: 'super_admin',
      orgId: null, // Super admins are not tied to specific organizations
      createdAt: serverTimestamp(),
    }
    
    // Save to Firestore
    await setDoc(doc(db, 'users', userId), superAdminProfile)
    
    console.log('✅ Super admin created successfully!')
    console.log(`📝 Username: ${username}`)
    console.log(`👤 Display Name: ${superAdminProfile.displayName}`)
    console.log(`🆔 User ID: ${userId}`)
    console.log(`🔐 Role: super_admin`)
    console.log(`📧 Email: ${email || 'Not provided'}`)
    
    return {
      success: true,
      userId,
      username,
      role: 'super_admin'
    }
    
  } catch (error) {
    console.error('❌ Failed to create super admin:', error)
    throw error
  }
}

// Example usage - uncomment and modify to run
// createSuperAdmin('admin', 'your-secure-password', 'System Administrator', 'admin@yourcompany.com')

// Export for use in other scripts
export default createSuperAdmin
