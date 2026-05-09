import { useState } from 'react'
import { useCustomers } from '../hooks/useCustomers'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from './ToastContainer'
import { useSettings } from '../hooks/useSettings'
import CreditHistoryModal from './CreditHistoryModal'

export default function CustomerManagement() {
  const [searchTerm, setSearchTerm] = useState('')
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [showCreditModal, setShowCreditModal] = useState(false)
  const [showCreditHistoryModal, setShowCreditHistoryModal] = useState(false)
  const [creditAmount, setCreditAmount] = useState('')
  const [creditDescription, setCreditDescription] = useState('')
  const [loading, setLoading] = useState(false)

  const { customers, loading: customersLoading, createCustomer, updateCustomer, deleteCustomer, updateCreditBalance } = useCustomers()
  const { userProfile } = useAuth()
  const { addToast } = useToast()
  const { currencySymbol } = useSettings()

  // Filter customers based on search term
  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.includes(searchTerm) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Handle customer creation/update
  const handleSaveCustomer = async (customerData) => {
    try {
      setLoading(true)
      if (editingCustomer?.id) {
        await updateCustomer(editingCustomer.id, customerData)
        addToast('Customer updated successfully', 'success')
      } else {
        await createCustomer(customerData)
        addToast('Customer created successfully', 'success')
      }
      setEditingCustomer(null)
    } catch (error) {
      console.error('Error saving customer:', error)
      addToast(error.message || 'Error saving customer', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Handle customer deletion
  const handleDeleteCustomer = async (customerId) => {
    const customer = customers.find(c => c.id === customerId)
    if (!customer) return

    if (window.confirm(`Are you sure you want to delete ${customer.name}? This action cannot be undone.`)) {
      try {
        await deleteCustomer(customerId)
        addToast('Customer deleted successfully', 'success')
      } catch (error) {
        console.error('Error deleting customer:', error)
        addToast(error.message || 'Error deleting customer', 'error')
      }
    }
  }

  // Handle credit balance update
  const handleUpdateCredit = async () => {
    if (!creditAmount || isNaN(parseFloat(creditAmount))) {
      addToast('Please enter a valid amount', 'error')
      return
    }

    try {
      setLoading(true)
      const amount = parseFloat(creditAmount)
      await updateCreditBalance(editingCustomer.id, amount, creditDescription)
      addToast(`Credit balance updated by ${amount > 0 ? '+' : ''}${currencySymbol}${amount.toFixed(2)}`, 'success')
      setShowCreditModal(false)
      setCreditAmount('')
      setCreditDescription('')
      setEditingCustomer(null)
    } catch (error) {
      console.error('Error updating credit balance:', error)
      addToast(error.message || 'Error updating credit balance', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Customer Management</h2>
        <button
          onClick={() => setEditingCustomer({})}
          className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Customer
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl p-4 border border-gray-200">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search customers by name, phone, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
        </div>
      </div>

      {/* Customers List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {customersLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-gray-500 text-sm mt-2">Loading customers...</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-8 text-center">
            <svg className="w-10 h-10 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-gray-500 text-sm">
              {searchTerm ? 'No customers found matching your search' : 'No customers yet'}
            </p>
            <p className="text-gray-400 text-xs mt-1">
              {searchTerm ? 'Try a different search term' : 'Add your first customer to get started'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredCustomers.map((customer) => (
              <div key={customer.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-gray-900 truncate">{customer.name}</h3>
                      {customer.creditBalance !== undefined && customer.creditBalance !== null && customer.creditBalance !== 0 && (
                        <span className={`text-xs font-medium px-2 py-1 rounded ${
                          customer.creditBalance > 0 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          Credit: {currencySymbol}{Math.abs(customer.creditBalance).toFixed(2)}
                        </span>
                      )}
                    </div>
                    {customer.phone && (
                      <p className="text-sm text-gray-500 mb-1">📞 {customer.phone}</p>
                    )}
                    {customer.email && (
                      <p className="text-sm text-gray-500 mb-1">✉️ {customer.email}</p>
                    )}
                    {customer.address && (
                      <p className="text-sm text-gray-500 mb-2">📍 {customer.address}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span title="Customer created date">📅 {new Date(customer.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-4">
                    <button
                      onClick={() => {
                        setEditingCustomer(customer)
                        setShowCreditHistoryModal(true)
                      }}
                      className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      title="View credit history"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </button>
                    <button
                      onClick={() => {
                        setEditingCustomer(customer)
                        setShowCreditModal(true)
                      }}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Update credit balance"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setEditingCustomer(customer)}
                      className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Edit customer"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteCustomer(customer.id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete customer"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m0 0h14m-7 0v6m-7 0h14" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Customer Form Modal */}
      {editingCustomer !== null && !showCreditModal && (
        <CustomerFormModal
          customer={editingCustomer}
          onSave={handleSaveCustomer}
          onClose={() => setEditingCustomer(null)}
          loading={loading}
          addToast={addToast}
        />
      )}

      {/* Credit Balance Modal */}
      {showCreditModal && editingCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl">
            <h3 className="font-semibold text-gray-900 mb-4">Update Credit Balance</h3>
            <p className="text-sm text-gray-600 mb-4">
              Customer: <span className="font-medium">{editingCustomer.name}</span>
              <br />
              Current balance: <span className={`font-medium ${editingCustomer.creditBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {currencySymbol}{(editingCustomer.creditBalance || 0).toFixed(2)}
              </span>
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  placeholder="Enter amount (positive to add, negative to subtract)"
                />
                <p className="text-xs text-gray-500 mt-1">Use positive numbers to add credit, negative to subtract</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                <textarea
                  value={creditDescription}
                  onChange={(e) => setCreditDescription(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  rows={2}
                  placeholder="Reason for credit adjustment"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreditModal(false)
                  setEditingCustomer(null)
                  setCreditAmount('')
                  setCreditDescription('')
                }}
                className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateCredit}
                disabled={loading}
                className="flex-1 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Update Balance'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Credit History Modal */}
      {showCreditHistoryModal && editingCustomer && (
        <CreditHistoryModal
          isOpen={showCreditHistoryModal}
          onClose={() => {
            setShowCreditHistoryModal(false)
            setEditingCustomer(null)
          }}
          customer={editingCustomer}
        />
      )}
    </div>
  )
}

// Customer Form Modal Component
function CustomerFormModal({ customer, onSave, onClose, loading, addToast }) {
  const [formData, setFormData] = useState({
    name: customer.name || '',
    phone: customer.phone || '',
    email: customer.email || '',
    address: customer.address || ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      addToast('Customer name is required', 'error')
      return
    }
    onSave(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
        <h3 className="font-semibold text-gray-900 mb-4">
          {customer.id ? 'Edit Customer' : 'Add New Customer'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              placeholder="Customer name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              placeholder="Phone number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              placeholder="Email address"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              rows={3}
              placeholder="Address"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50"
            >
              {loading ? 'Saving...' : (customer.id ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
