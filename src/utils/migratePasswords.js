// Password migration utility
// Converts existing plaintext passwords to secure hashed passwords

import { collection, getDocs, doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { hashPassword } from './passwordUtils'

/**
 * Migrates all plaintext passwords to hashed passwords
 * This should be run once to upgrade existing users
 */
export async function migrateAllPasswords() {
  console.log('Starting password migration...')
  
  try {
    const usersRef = collection(db, 'users')
    const snapshot = await getDocs(usersRef)
    
    let migratedCount = 0
    let skippedCount = 0
    
    for (const userDoc of snapshot.docs) {
      const userData = userDoc.data()
      const userId = userDoc.id
      
      // Skip if already has salt (already migrated)
      if (userData.salt) {
        skippedCount++
        continue
      }
      
      // Hash the existing plaintext password
      const { hash, salt } = await hashPassword(userData.password)
      
      // Update user document with hashed password and salt
      await updateDoc(doc(db, 'users', userId), {
        password: hash,
        salt: salt
      })
      
      migratedCount++
      console.log(`Migrated user: ${userData.username}`)
    }
    
    console.log(`Migration complete!`)
    console.log(`Migrated: ${migratedCount} users`)
    console.log(`Skipped: ${skippedCount} users (already migrated)`)
    
    return { migratedCount, skippedCount }
  } catch (error) {
    console.error('Migration failed:', error)
    throw error
  }
}

/**
 * Migrates a single user's password
 * Useful for on-the-fly migration during login
 */
export async function migrateUserPassword(userId, plaintextPassword) {
  try {
    const { hash, salt } = await hashPassword(plaintextPassword)
    
    await updateDoc(doc(db, 'users', userId), {
      password: hash,
      salt: salt
    })
    
    console.log(`Migrated user: ${userId}`)
    return true
  } catch (error) {
    console.error(`Failed to migrate user ${userId}:`, error)
    return false
  }
}

/**
 * Enhanced password verification that migrates legacy passwords
 * This should be used in the login process
 */
export async function verifyAndMigratePassword(password, storedPassword, storedSalt, userId) {
  // If salt exists, verify normally (already migrated)
  if (storedSalt) {
    const { hash } = await hashPassword(password, storedSalt)
    return hash === storedPassword
  }
  
  // No salt means it's a plaintext password - verify and migrate
  if (password === storedPassword) {
    // Password is correct, migrate it now
    await migrateUserPassword(userId, storedPassword)
    console.log(`Auto-migrated password for user: ${userId}`)
    return true
  }
  
  return false
}
