// Super Admin Creation Runner
// Run this script to create a super admin user

import { createSuperAdmin } from './createSuperAdmin.js'

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
