// Password migration runner
// Run this script once to migrate all existing plaintext passwords to secure hashed passwords

import { migrateAllPasswords } from '../src/utils/migratePasswords.js'

// Run the migration
migrateAllPasswords()
  .then((result) => {
    console.log('Migration completed successfully:', result)
    process.exit(0)
  })
  .catch((error) => {
    console.error('Migration failed:', error)
    process.exit(1)
  })
