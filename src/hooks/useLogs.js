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

  // Debug logging
  console.log('useLogs Debug:', {
    isSuperAdmin,
    userProfile,
    selectedOrgId,
    orgId,
    userRole: userProfile?.role
  })

  useEffect(() => {
    if (!orgId && !isSuperAdmin) {
      console.error('Organization admin missing orgId:', { userProfile, isSuperAdmin })
      setLogs([])
      setLoading(false)
      setError(`No organization found. User role: ${userProfile?.role || 'unknown'}. Please ensure you are assigned to an organization.`)
      return
    }

    let logsRef
    
    if (isSuperAdmin && !orgId) {
      // Super admin viewing all logs from system_logs
      logsRef = collection(db, 'system_logs')
    } else if (orgId) {
      // Organization-specific logs - use system_logs with orgId filter
      logsRef = collection(db, 'system_logs')
      console.log('Organization admin accessing logs for orgId:', orgId)
    } else {
      setLogs([])
      setLoading(false)
      setError('No organization specified')
      return
    }

    // Build query without composite index - fetch all and filter client-side
    let q = query(
      logsRef, 
      orderBy('createdAt', 'desc'),
      limit(orgId ? logLimit * 2 : logLimit) // Fetch more if we need to filter
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('Logs query successful, found:', snapshot.docs.length, 'logs')
      let logsArray = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      
      // Filter by orgId on client side if needed
      if (orgId) {
        logsArray = logsArray.filter(log => log.orgId === orgId)
        console.log('Filtered logs for orgId', orgId, ':', logsArray.length, 'logs')
      }
      
      // If no logs found in system_logs and this is an organization admin, try organization-specific logs
      if (logsArray.length === 0 && !isSuperAdmin && orgId) {
        console.log('No logs in system_logs, trying organization-specific logs for orgId:', orgId)
        const orgLogsRef = collection(db, 'organizations', orgId, 'logs')
        const orgQuery = query(orgLogsRef, orderBy('createdAt', 'desc'), limit(logLimit))
        
        // Fetch organization-specific logs
        getDocs(orgQuery).then((orgSnapshot) => {
          const orgLogsArray = orgSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          console.log('Organization-specific logs found:', orgLogsArray.length)
          setLogs(orgLogsArray)
          setLoading(false)
          setError(null)
        }).catch((orgError) => {
          console.error('Error fetching organization logs:', orgError)
          setLogs([])
          setLoading(false)
          setError(null) // Don't show error if no logs found
        })
      } else {
        setLogs(logsArray)
        setLoading(false)
        setError(null)
      }
    }, (error) => {
      console.error('Error fetching logs:', error)
      console.error('Query details:', { orgId, isSuperAdmin })
      setError(`Failed to fetch logs: ${error.message}`)
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
    
    // Build query without composite index - fetch all and filter client-side
    let q = query(
      logsRef, 
      orderBy('createdAt', 'desc'),
      limit(orgId ? logLimit * 2 : logLimit) // Fetch more if we need to filter
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let logsArray = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      
      // Filter by orgId on client side if needed
      if (orgId) {
        logsArray = logsArray.filter(log => log.orgId === orgId)
        console.log('Filtered all logs for orgId', orgId, ':', logsArray.length, 'logs')
      }
      
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
          // Super admin viewing all logs
          logsRef = collection(db, 'system_logs')
        } else if (orgId) {
          // Organization-specific logs - use system_logs with orgId filter
          logsRef = collection(db, 'system_logs')
        } else {
          return
        }

        // Build query without composite index - fetch all and filter client-side
        let q = query(
          logsRef, 
          orderBy('createdAt', 'desc'),
          limit(orgId ? 2000 : 1000) // Fetch more if we need to filter
        )
        const snapshot = await getDocs(q)
        let logsArray = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))

        // Filter by orgId on client side if needed
        if (orgId) {
          logsArray = logsArray.filter(log => log.orgId === orgId)
          console.log('Filtered stats for orgId', orgId, ':', logsArray.length, 'logs')
        }

        // If no logs found in system_logs and this is an organization admin, try organization-specific logs
        if (logsArray.length === 0 && !isSuperAdmin && orgId) {
          console.log('No stats in system_logs, trying organization-specific logs for orgId:', orgId)
          try {
            const orgLogsRef = collection(db, 'organizations', orgId, 'logs')
            const orgQuery = query(orgLogsRef, orderBy('createdAt', 'desc'), limit(1000))
            const orgSnapshot = await getDocs(orgQuery)
            const orgLogsArray = orgSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }))
            console.log('Organization-specific stats found:', orgLogsArray.length)
            logsArray = orgLogsArray
          } catch (orgError) {
            console.error('Error fetching organization stats:', orgError)
            logsArray = []
          }
        }

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
