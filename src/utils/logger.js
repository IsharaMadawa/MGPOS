import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

// Log levels and types
export const LOG_LEVELS = {
  INFO: 'info',
  WARNING: 'warning', 
  ERROR: 'error',
  SUCCESS: 'success'
}

export const LOG_TYPES = {
  // User actions
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  USER_SIGNUP: 'user_signup',
  USER_PASSWORD_CHANGE: 'user_password_change',
  USER_CREATE: 'user_create',
  USER_UPDATE: 'user_update',
  USER_DELETE: 'user_delete',
  USER_ROLE_CHANGE: 'user_role_change',
  
  // Product operations
  PRODUCT_CREATE: 'product_create',
  PRODUCT_UPDATE: 'product_update',
  PRODUCT_DELETE: 'product_delete',
  
  // Category operations
  CATEGORY_CREATE: 'category_create',
  CATEGORY_UPDATE: 'category_update',
  CATEGORY_DELETE: 'category_delete',
  
  // Billing/Sales operations
  SALE_CREATE: 'sale_create',
  SALE_UPDATE: 'sale_update',
  SALE_DELETE: 'sale_delete',
  SALE_VOID: 'sale_void',
  BILL_REPRINT: 'bill_reprint',
  
  // Organization operations
  ORG_CREATE: 'org_create',
  ORG_UPDATE: 'org_update',
  ORG_DELETE: 'org_delete',
  
  // Settings operations
  SETTINGS_UPDATE: 'settings_update',
  
  // System operations
  SYSTEM_ERROR: 'system_error',
  SYSTEM_WARNING: 'system_warning',
  DATA_IMPORT: 'data_import',
  DATA_EXPORT: 'data_export',
  
  // UI operations
  TOAST_NOTIFICATION: 'toast_notification',
  UI_REFRESH: 'ui_refresh',
  
  // Reporting operations
  REPORT_GENERATE: 'report_generate',
  REPORT_PRINT: 'report_print',
  REPORT_VIEW: 'report_view'
}

/**
 * Create a log entry in the system logs collection
 * @param {Object} logData - Log entry data
 * @param {string} logData.type - Type of log (from LOG_TYPES)
 * @param {string} logData.level - Log level (from LOG_LEVELS)
 * @param {string} logData.description - Human readable description
 * @param {string} logData.userId - User who performed the action
 * @param {string} logData.userName - Name of the user
 * @param {string} logData.orgId - Organization ID
 * @param {Object} logData.metadata - Additional data about the log entry
 * @returns {Promise<Object>} - Created log entry
 */
export const createLog = async (logData) => {
  try {
    const {
      type,
      level = LOG_LEVELS.INFO,
      description,
      userId,
      userName,
      orgId,
      metadata = {}
    } = logData

    if (!type || !description || !userId || !userName) {
      throw new Error('Missing required log fields: type, description, userId, userName')
    }

    const logEntry = {
      type,
      level,
      description,
      userId,
      userName,
      orgId: orgId || null,
      metadata,
      createdAt: serverTimestamp(),
      timestamp: new Date().toISOString()
    }

    // Store in global logs collection for super admin access
    const logsRef = collection(db, 'system_logs')
    const docRef = await addDoc(logsRef, logEntry)
    
    return { id: docRef.id, ...logEntry }
  } catch (error) {
    console.error('Error creating log entry:', error)
    throw error
  }
}

/**
 * Create a log entry specific to an organization
 * @param {Object} logData - Log entry data
 * @returns {Promise<Object>} - Created log entry
 */
export const createOrgLog = async (logData) => {
  try {
    const { orgId, ...restOfLogData } = logData
    
    if (!orgId) {
      throw new Error('Organization ID is required for organization logs')
    }

    // Create log in organization-specific subcollection
    const orgLogsRef = collection(db, 'organizations', orgId, 'logs')
    const logEntry = {
      ...restOfLogData,
      createdAt: serverTimestamp(),
      timestamp: new Date().toISOString()
    }
    
    const docRef = await addDoc(orgLogsRef, logEntry)
    return { id: docRef.id, ...logEntry }
  } catch (error) {
    console.error('Error creating organization log entry:', error)
    throw error
  }
}

/**
 * Convenience function to log user actions
 * @param {string} actionType - Type of action (from LOG_TYPES)
 * @param {string} description - Description of the action
 * @param {Object} user - User object
 * @param {string} orgId - Organization ID
 * @param {Object} metadata - Additional metadata
 */
export const logUserAction = async (actionType, description, user, orgId, metadata = {}) => {
  return createLog({
    type: actionType,
    level: LOG_LEVELS.INFO,
    description,
    userId: user.id,
    userName: user.displayName || user.username,
    orgId,
    metadata
  })
}

/**
 * Convenience function to log CRUD operations
 * @param {string} operation - Type of operation (create, update, delete)
 * @param {string} entityType - Type of entity (product, category, etc.)
 * @param {Object} entityData - Data about the entity
 * @param {Object} user - User object
 * @param {string} orgId - Organization ID
 */
export const logCrudOperation = async (operation, entityType, entityData, user, orgId) => {
  const actionMap = {
    create: LOG_TYPES[`${entityType.toUpperCase()}_CREATE`],
    update: LOG_TYPES[`${entityType.toUpperCase()}_UPDATE`],
    delete: LOG_TYPES[`${entityType.toUpperCase()}_DELETE`]
  }
  
  const logType = actionMap[operation]
  if (!logType) {
    throw new Error(`Invalid operation: ${operation} for entity: ${entityType}`)
  }
  
  const description = `${operation.charAt(0).toUpperCase() + operation.slice(1)}d ${entityType}: ${entityData.name || entityData.id || 'Unknown'}`
  
  return createLog({
    type: logType,
    level: LOG_LEVELS.INFO,
    description,
    userId: user.id,
    userName: user.displayName || user.username,
    orgId,
    metadata: {
      operation,
      entityType,
      entityId: entityData.id,
      entityData: entityData
    }
  })
}

/**
 * Convenience function to log errors
 * @param {string} description - Error description
 * @param {Error} error - Error object
 * @param {Object} user - User object
 * @param {string} orgId - Organization ID
 * @param {Object} metadata - Additional metadata
 */
export const logError = async (description, error, user, orgId, metadata = {}) => {
  return createLog({
    type: LOG_TYPES.SYSTEM_ERROR,
    level: LOG_LEVELS.ERROR,
    description,
    userId: user?.id,
    userName: user?.displayName || user?.username || 'System',
    orgId,
    metadata: {
      errorMessage: error.message,
      errorStack: error.stack,
      ...metadata
    }
  })
}

/**
 * Convenience function to log warnings
 * @param {string} description - Warning description
 * @param {Object} user - User object
 * @param {string} orgId - Organization ID
 * @param {Object} metadata - Additional metadata
 */
export const logWarning = async (description, user, orgId, metadata = {}) => {
  return createLog({
    type: LOG_TYPES.SYSTEM_WARNING,
    level: LOG_LEVELS.WARNING,
    description,
    userId: user?.id,
    userName: user?.displayName || user?.username || 'System',
    orgId,
    metadata
  })
}
