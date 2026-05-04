import { useState, useEffect } from 'react'
import { useCustomers } from '../hooks/useCustomers'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from './ToastContainer'

export default function CustomerSearchModal({ isOpen, onClose, onSelectCustomer, requireSelection = false }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  })

  const { customers, createCustomer, searchCustomers } = useCustomers()
  const { userProfile } = useAuth()
  const { addToast } = useToast()

  // Filter customers based on search term
  useEffect(() => {
    if (!searchTerm) {
      setSearchResults(customers.slice(0, 10)) // Show first 10 customers
      return
    }

    const filtered = customers.filter(customer => 
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.includes(searchTerm) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 10)

    setSearchResults(filtered)
  }, [searchTerm, customers])

  // Search customers from Firebase
  const handleSearch = async () => {
    if (!searchTerm.trim()) return
    
    setLoading(true)
    try {
      const results = await searchCustomers(searchTerm)
      setSearchResults(results)
    } catch (error) {
      console.error('Error searching customers:', error)
      addToast('Error searching customers', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Handle customer selection
  const handleSelectCustomer = (customer) => {
    onSelectCustomer(customer)
    onClose()
    setSearchTerm('')
    setSearchResults([])
  }

  // Handle creating new customer
  const handleCreateCustomer = async (e) => {
    e.preventDefault()
    
    if (!newCustomer.name.trim()) {
      addToast('Customer name is required', 'error')
      return
    }

    try {
      setLoading(true)
      const createdCustomer = await createCustomer(newCustomer)
      addToast('Customer created successfully', 'success')
      handleSelectCustomer(createdCustomer)
    } catch (error) {
      console.error('Error creating customer:', error)
      addToast(error.message || 'Error creating customer', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Reset form when modal closes
  const handleClose = () => {
    setSearchTerm('')
    setSearchResults([])
    setShowCreateForm(false)
    setNewCustomer({ name: '', phone: '', email: '', address: '' })
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[80vh] overflow-hidden shadow-xl">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Select Customer</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {requireSelection && (
            <p className="text-sm text-amber-600 mt-1">Customer selection required for credit purchases</p>
          )}
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search by name, phone, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              autoFocus
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {!showCreateForm ? (
            <>
              {/* Search Results */}
              <div className="max-h-60 overflow-y-auto">
                {searchResults.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {searchResults.map((customer) => (
                      <button
                        key={customer.id}
                        onClick={() => handleSelectCustomer(customer)}
                        className="w-full p-3 text-left hover:bg-gray-50 transition-colors flex items-center justify-between"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{customer.name}</p>
                          {customer.phone && (
                            <p className="text-sm text-gray-500">{customer.phone}</p>
                          )}
                          {customer.email && (
                            <p className="text-xs text-gray-400 truncate">{customer.email}</p>
                          )}
                        </div>
                        {customer.creditBalance !== 0 && (
                          <div className={`text-sm font-medium px-2 py-1 rounded ${
                            customer.creditBalance > 0 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {customer.creditBalance > 0 ? '+' : ''}${Math.abs(customer.creditBalance).toFixed(2)}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                ) : searchTerm ? (
                  <div className="p-8 text-center">
                    <svg className="w-10 h-10 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <p className="text-gray-500 text-sm">No customers found</p>
                    <p className="text-gray-400 text-xs mt-1">Try a different search term or create a new customer</p>
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <svg className="w-10 h-10 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p className="text-gray-500 text-sm">Search for a customer</p>
                    <p className="text-gray-400 text-xs mt-1">Type a name, phone number, or email</p>
                  </div>
                )}
              </div>

              {/* Create Customer Button */}
              <div className="p-4 border-t border-gray-200">
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="w-full py-2 border border-emerald-600 text-emerald-600 font-medium rounded-xl hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create New Customer
                </button>
              </div>
            </>
          ) : (
            /* Create Customer Form */
            <div className="p-4">
              <form onSubmit={handleCreateCustomer} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    required
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    placeholder="Customer name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    placeholder="Phone number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    placeholder="Email address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <textarea
                    value={newCustomer.address}
                    onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    rows={2}
                    placeholder="Address"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 py-2 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Creating...' : 'Create Customer'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
