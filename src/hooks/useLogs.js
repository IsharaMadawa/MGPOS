import { useState, useEffect } from 'react'
import { collection, query, orderBy, limit, onSnapshot, where, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { useOrg } from '../contexts/OrgContext'
import { LOG_LEVELS, LOG_TYPES } from '../utils/logger'

export function useLogs(options = {}) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { userProfile, isSuperAdmin } = useAuth()
  const { selectedOrgId } = useOrg()

  const {
    limit: logLimit = 100,
    level = null,
    type = null,
    startDate = null,
    endDate = null,
    userId = null
  } = options

  // Get the orgId to use - for super admin use selectedOrgId, otherwise use userProfile.orgId
  const orgId = isSuperAdmin ? selectedOrgId : userProfile?.orgId

  useEffect(() => {
    if (!orgId && !isSuperAdmin) {
      setLogs([])
      setLoading(false)
      return
    }

    let logsRef
    let q

    if (isSuperAdmin && !orgId) {
      // Super admin viewing all logs
      logsRef = collection(db, 'system_logs')
      q = query(logsRef, orderBy('createdAt', 'desc'), limit(logLimit))
    } else if (orgId) {
      // Organization-specific logs
      logsRef = collection(db, 'organizations', orgId, 'logs')
      q = query(logsRef, orderBy('createdAt', 'desc'), limit(logLimit))
    } else {
      setLogs([])
      setLoading(false)
      return
    }

    // Add filters if provided
    const constraints = []
    if (level) {
      constraints.push(where('level', '==', level))
    }
    if (type) {
      constraints.push(where('type', '==', type))
    }
    if (userId) {
      constraints.push(where('userId', '==', userId))
    }
    if (startDate) {
      constraints.push(where('createdAt', '>=', startDate))
    }
    if (endDate) {
      constraints.push(where('createdAt', '<=', endDate))
    }

    if (constraints.length > 0) {
      q = query(logsRef, ...constraints, orderBy('createdAt', 'desc'), limit(logLimit))
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logsArray = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setLogs(logsArray)
      setLoading(false)
      setError(null)
    }, (error) => {
      console.error('Error fetching logs:', error)
      setError(error.message)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [orgId, isSuperAdmin, logLimit, level, type, userId, startDate, endDate])

  return { logs, loading, error }
}

export function useAllLogs(options = {}) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { isSuperAdmin } = useAuth()

  const {
    limit: logLimit = 200,
    level = null,
    type = null,
    orgId = null,
    startDate = null,
    endDate = null,
    userId = null
  } = options

  useEffect(() => {
    if (!isSuperAdmin) {
      setLogs([])
      setLoading(false)
      setError('Unauthorized: Super admin access required')
      return
    }

    const logsRef = collection(db, 'system_logs')
    let q = query(logsRef, orderBy('createdAt', 'desc'), limit(logLimit))

    // Add filters if provided
    const constraints = []
    if (level) {
      constraints.push(where('level', '==', level))
    }
    if (type) {
      constraints.push(where('type', '==', type))
    }
    if (orgId) {
      constraints.push(where('orgId', '==', orgId))
    }
    if (userId) {
      constraints.push(where('userId', '==', userId))
    }
    if (startDate) {
      constraints.push(where('createdAt', '>=', startDate))
    }
    if (endDate) {
      constraints.push(where('createdAt', '<=', endDate))
    }

    if (constraints.length > 0) {
      q = query(logsRef, ...constraints, orderBy('createdAt', 'desc'), limit(logLimit))
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logsArray = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setLogs(logsArray)
      setLoading(false)
      setError(null)
    }, (error) => {
      console.error('Error fetching all logs:', error)
      setError(error.message)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [isSuperAdmin, logLimit, level, type, orgId, userId, startDate, endDate])

  return { logs, loading, error }
}

export function useLogStats() {
  const [stats, setStats] = useState({
    total: 0,
    byLevel: {},
    byType: {},
    recentActivity: []
  })
  const [loading, setLoading] = useState(true)
  const { userProfile, isSuperAdmin } = useAuth()
  const { selectedOrgId } = useOrg()

  const orgId = isSuperAdmin ? selectedOrgId : userProfile?.orgId

  useEffect(() => {
    if (!orgId && !isSuperAdmin) {
      setStats({
        total: 0,
        byLevel: {},
        byType: {},
        recentActivity: []
      })
      setLoading(false)
      return
    }

    const fetchStats = async () => {
      try {
        let logsRef
        
        if (isSuperAdmin && !orgId) {
          logsRef = collection(db, 'system_logs')
        } else if (orgId) {
          logsRef = collection(db, 'organizations', orgId, 'logs')
        } else {
          return
        }

        // Get recent logs for stats
        const q = query(logsRef, orderBy('createdAt', 'desc'), limit(1000))
        const snapshot = await getDocs(q)
        const logsArray = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))

        // Calculate stats
        const byLevel = {}
        const byType = {}
        
        logsArray.forEach(log => {
          // Count by level
          byLevel[log.level] = (byLevel[log.level] || 0) + 1
          
          // Count by type
          byType[log.type] = (byType[log.type] || 0) + 1
        })

        setStats({
          total: logsArray.length,
          byLevel,
          byType,
          recentActivity: logsArray.slice(0, 10)
        })
        setLoading(false)
      } catch (error) {
        console.error('Error fetching log stats:', error)
        setLoading(false)
      }
    }

    fetchStats()
  }, [orgId, isSuperAdmin])

  return { stats, loading }
}

// Helper function to get human-readable log type name
export const getLogTypeName = (type) => {
  const typeNames = {
    [LOG_TYPES.USER_LOGIN]: 'User Login',
    [LOG_TYPES.USER_LOGOUT]: 'User Logout',
    [LOG_TYPES.USER_SIGNUP]: 'User Signup',
    [LOG_TYPES.PRODUCT_CREATE]: 'Product Created',
    [LOG_TYPES.PRODUCT_UPDATE]: 'Product Updated',
    [LOG_TYPES.PRODUCT_DELETE]: 'Product Deleted',
    [LOG_TYPES.CATEGORY_CREATE]: 'Category Created',
    [LOG_TYPES.CATEGORY_UPDATE]: 'Category Updated',
    [LOG_TYPES.CATEGORY_DELETE]: 'Category Deleted',
    [LOG_TYPES.SALE_CREATE]: 'Sale Created',
    [LOG_TYPES.SALE_UPDATE]: 'Sale Updated',
    [LOG_TYPES.SALE_DELETE]: 'Sale Deleted',
    [LOG_TYPES.SALE_VOID]: 'Sale Voided',
    [LOG_TYPES.ORG_CREATE]: 'Organization Created',
    [LOG_TYPES.ORG_UPDATE]: 'Organization Updated',
    [LOG_TYPES.ORG_DELETE]: 'Organization Deleted',
    [LOG_TYPES.SETTINGS_UPDATE]: 'Settings Updated',
    [LOG_TYPES.SYSTEM_ERROR]: 'System Error',
    [LOG_TYPES.SYSTEM_WARNING]: 'System Warning',
    [LOG_TYPES.DATA_IMPORT]: 'Data Import',
    [LOG_TYPES.DATA_EXPORT]: 'Data Export'
  }
  
  return typeNames[type] || type
}

// Helper function to get log level color
export const getLogLevelColor = (level) => {
  const colors = {
    [LOG_LEVELS.INFO]: 'blue',
    [LOG_LEVELS.WARNING]: 'yellow',
    [LOG_LEVELS.ERROR]: 'red',
    [LOG_LEVELS.SUCCESS]: 'green'
  }
  
  return colors[level] || 'gray'
}
