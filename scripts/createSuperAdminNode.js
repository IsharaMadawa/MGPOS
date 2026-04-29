// Node.js compatible Super Admin Creation Script
// Uses Node.js crypto module with PBKDF2 (same as browser version)

import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../src/firebase.js'
import { pbkdf2Sync, randomBytes } from 'crypto'

const SALT_LENGTH = 32
const ITERATIONS = 100000
const HASH_LENGTH = 32

/**
 * Generate a random salt for password hashing
 */
function generateSalt() {
  return randomBytes(SALT_LENGTH).toString('hex')
}

/**
 * Hash a password with PBKDF2 using Node.js crypto (matches browser implementation)
 */
function hashPassword(password, salt = null) {
  if (!salt) {
    salt = generateSalt()
  }

  const hash = pbkdf2Sync(password, salt, ITERATIONS, HASH_LENGTH, 'sha256')
  
  return { 
    hash: hash.toString('hex'), 
    salt 
  }
}

/**
 * Creates a super admin user
 */
export async function createSuperAdmin(username, password, displayName = null, email = null) {
  try {
    console.log('Creating super admin user...')
    
    // Hash the password
    const { hash, salt } = hashPassword(password)
    
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

// Configuration - modify these values
const SUPER_ADMIN_CONFIG = {
  username: 'sa',           // Change this to your desired username
  password: 'Admin123',       // Change this to a secure password
  displayName: 'System Administrator', // Change this if needed
  email: 'dev.madawa@gmail.com'     // Change this to your email (optional)
}

// Create the super admin
createSuperAdmin(
  SUPER_ADMIN_CONFIG.username,
  SUPER_ADMIN_CONFIG.password,
  SUPER_ADMIN_CONFIG.displayName,
  SUPER_ADMIN_CONFIG.email
)
  .then((result) => {
    console.log('\n🎉 Super admin creation completed!')
    console.log('You can now log in with these credentials:')
    console.log(`Username: ${SUPER_ADMIN_CONFIG.username}`)
    console.log(`Password: ${SUPER_ADMIN_CONFIG.password}`)
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Failed to create super admin:', error.message)
    process.exit(1)
  })
