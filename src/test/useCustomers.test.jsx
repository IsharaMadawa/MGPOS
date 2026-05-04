import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useCustomers, useCustomer } from '../hooks/useCustomers'
import { AuthProvider } from '../contexts/AuthContext'
import { OrgProvider } from '../contexts/OrgContext'
import { doc, collection, addDoc, updateDoc, deleteDoc, getDoc, getDocs, onSnapshot, query, where, orderBy, limit } from 'firebase/firestore'

// Mock Firebase
vi.mock('../firebase', () => ({
  db: {}
}))

// Mock Firebase Firestore functions
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  collection: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  onSnapshot: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  serverTimestamp: vi.fn(() => new Date())
}))

// Mock logger
vi.mock('../utils/logger', () => ({
  logUserAction: vi.fn(),
  logCrudOperation: vi.fn(),
  logError: vi.fn()
}))

describe('useCustomers', () => {
  const mockUser = {
    uid: 'test-user-id',
    displayName: 'Test User',
    role: 'admin',
    orgId: 'test-org-id'
  }

  const wrapper = ({ children }) => (
    <AuthProvider>
      <OrgProvider>
        {children}
      </OrgProvider>
    </AuthProvider>
  )

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock auth context
    vi.mock('../contexts/AuthContext', () => ({
      useAuth: () => ({
        userProfile: mockUser,
        isSuperAdmin: false
      })
    }))

    // Mock org context
    vi.mock('../contexts/OrgContext', () => ({
      useOrg: () => ({
        selectedOrgId: 'test-org-id',
        hasAdminAccessToOrganization: () => true
      })
    }))
  })

  it('should initialize with empty customers array', () => {
    // Mock onSnapshot to return empty array
    onSnapshot.mockImplementation((query, callback) => {
      callback({ docs: [] })
      return vi.fn()
    })

    const { result } = renderHook(() => useCustomers(), { wrapper })

    expect(result.current.customers).toEqual([])
    expect(result.current.loading).toBe(true)
  })

  it('should fetch customers when orgId is available', async () => {
    const mockCustomers = [
      { id: '1', name: 'John Doe', phone: '123-456-7890', orgId: 'test-org-id' },
      { id: '2', name: 'Jane Smith', phone: '098-765-4321', orgId: 'test-org-id' }
    ]

    // Mock onSnapshot to return customers
    onSnapshot.mockImplementation((query, callback) => {
      callback({ 
        docs: mockCustomers.map(customer => ({
          id: customer.id,
          data: () => customer
        }))
      })
      return vi.fn()
    })

    const { result } = renderHook(() => useCustomers(), { wrapper })

    await waitFor(() => {
      expect(result.current.customers).toHaveLength(2)
      expect(result.current.customers[0].name).toBe('John Doe')
      expect(result.current.loading).toBe(false)
    })
  })

  it('should create customer successfully', async () => {
    const mockCustomer = {
      name: 'New Customer',
      phone: '555-123-4567',
      email: 'customer@example.com',
      address: '123 Main St'
    }

    const mockCreatedCustomer = {
      id: 'new-customer-id',
      ...mockCustomer,
      orgId: 'test-org-id',
      creditBalance: 0,
      totalPurchases: 0,
      purchaseCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    addDoc.mockResolvedValue({ id: 'new-customer-id' })

    // Mock onSnapshot
    onSnapshot.mockImplementation((query, callback) => {
      callback({ docs: [] })
      return vi.fn()
    })

    const { result } = renderHook(() => useCustomers(), { wrapper })

    const createdCustomer = await result.current.createCustomer(mockCustomer)

    expect(addDoc).toHaveBeenCalled()
    expect(createdCustomer.id).toBe('new-customer-id')
    expect(createdCustomer.name).toBe('New Customer')
    expect(createdCustomer.creditBalance).toBe(0)
  })

  it('should update customer successfully', async () => {
    const mockCustomer = {
      id: 'existing-customer-id',
      name: 'Updated Customer',
      phone: '555-987-6543'
    }

    updateDoc.mockResolvedValue()

    // Mock onSnapshot
    onSnapshot.mockImplementation((query, callback) => {
      callback({ docs: [] })
      return vi.fn()
    })

    const { result } = renderHook(() => useCustomers(), { wrapper })

    const updateResult = await result.current.updateCustomer('existing-customer-id', mockCustomer)

    expect(updateDoc).toHaveBeenCalled()
    expect(updateResult.success).toBe(true)
  })

  it('should delete customer successfully', async () => {
    const mockCustomerData = {
      name: 'Customer to Delete',
      creditBalance: 0
    }

    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => mockCustomerData
    })

    deleteDoc.mockResolvedValue()

    // Mock onSnapshot
    onSnapshot.mockImplementation((query, callback) => {
      callback({ docs: [] })
      return vi.fn()
    })

    const { result } = renderHook(() => useCustomers(), { wrapper })

    const deleteResult = await result.current.deleteCustomer('customer-to-delete-id')

    expect(deleteDoc).toHaveBeenCalled()
    expect(deleteResult.success).toBe(true)
  })

  it('should not delete customer with outstanding credit balance', async () => {
    const mockCustomerData = {
      name: 'Customer with Credit',
      creditBalance: 100
    }

    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => mockCustomerData
    })

    // Mock onSnapshot
    onSnapshot.mockImplementation((query, callback) => {
      callback({ docs: [] })
      return vi.fn()
    })

    const { result } = renderHook(() => useCustomers(), { wrapper })

    await expect(result.current.deleteCustomer('customer-with-credit-id')).rejects.toThrow(
      'Cannot delete customer with outstanding credit balance'
    )
  })

  it('should update credit balance successfully', async () => {
    const mockCustomerData = {
      name: 'Customer',
      creditBalance: 50
    }

    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => mockCustomerData
    })

    updateDoc.mockResolvedValue()

    // Mock onSnapshot
    onSnapshot.mockImplementation((query, callback) => {
      callback({ docs: [] })
      return vi.fn()
    })

    const { result } = renderHook(() => useCustomers(), { wrapper })

    const updateResult = await result.current.updateCreditBalance('customer-id', 25, 'Payment received')

    expect(updateDoc).toHaveBeenCalled()
    expect(updateResult.success).toBe(true)
    expect(updateResult.newBalance).toBe(75) // 50 + 25
  })

  it('should search customers by name and phone', async () => {
    const mockSearchResults = [
      { id: '1', name: 'John Doe', phone: '123-456-7890' },
      { id: '2', name: 'John Smith', phone: '123-456-7890' }
    ]

    // Mock getDocs for both name and phone queries
    getDocs.mockResolvedValue({
      docs: mockSearchResults.map(customer => ({
        id: customer.id,
        data: () => customer
      }))
    })

    // Mock onSnapshot
    onSnapshot.mockImplementation((query, callback) => {
      callback({ docs: [] })
      return vi.fn()
    })

    const { result } = renderHook(() => useCustomers(), { wrapper })

    const searchResults = await result.current.searchCustomers('John')

    expect(searchResults).toHaveLength(2)
    expect(searchResults[0].name).toBe('John Doe')
  })
})

describe('useCustomer', () => {
  const mockUser = {
    uid: 'test-user-id',
    displayName: 'Test User',
    role: 'admin',
    orgId: 'test-org-id'
  }

  const wrapper = ({ children }) => (
    <AuthProvider>
      <OrgProvider>
        {children}
      </OrgProvider>
    </AuthProvider>
  )

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock auth context
    vi.mock('../contexts/AuthContext', () => ({
      useAuth: () => ({
        userProfile: mockUser,
        isSuperAdmin: false
      })
    }))

    // Mock org context
    vi.mock('../contexts/OrgContext', () => ({
      useOrg: () => ({
        selectedOrgId: 'test-org-id',
        hasAdminAccessToOrganization: () => true
      })
    }))
  })

  it('should fetch single customer by ID', async () => {
    const mockCustomer = {
      id: 'customer-1',
      name: 'John Doe',
      phone: '123-456-7890',
      orgId: 'test-org-id'
    }

    // Mock onSnapshot for single document
    onSnapshot.mockImplementation((docRef, callback) => {
      callback({
        exists: () => true,
        id: mockCustomer.id,
        data: () => mockCustomer
      })
      return vi.fn()
    })

    const { result } = renderHook(() => useCustomer('customer-1'), { wrapper })

    await waitFor(() => {
      expect(result.current.customer).not.toBeNull()
      expect(result.current.customer.name).toBe('John Doe')
      expect(result.current.loading).toBe(false)
    })
  })

  it('should handle customer not found', async () => {
    // Mock onSnapshot for non-existent document
    onSnapshot.mockImplementation((docRef, callback) => {
      callback({ exists: () => false })
      return vi.fn()
    })

    const { result } = renderHook(() => useCustomer('non-existent-id'), { wrapper })

    await waitFor(() => {
      expect(result.current.customer).toBeNull()
      expect(result.current.loading).toBe(false)
    })
  })

  it('should return null when no customerId provided', () => {
    const { result } = renderHook(() => useCustomer(null), { wrapper })

    expect(result.current.customer).toBeNull()
    expect(result.current.loading).toBe(false)
  })
})
