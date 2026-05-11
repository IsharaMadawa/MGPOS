import { useState } from 'react'
import { useCreditHistory, useCreditSummary, CreditTransactionType } from '../hooks/useCreditHistory'
import { useSettings } from '../hooks/useSettings'
import { useToast } from './ToastContainer'

function fmt(amount, sym) {
  return `${sym}${Number(amount).toFixed(2)}`
}

function fmtDate(ts) {
  return new Date(ts).toLocaleDateString()
}

function fmtTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function CreditHistoryModal({ isOpen, onClose, customer }) {
  const { transactions, loading } = useCreditHistory(customer?.id)
  const { summary, loading: summaryLoading } = useCreditSummary(customer?.id)
  const { currencySymbol } = useSettings()
  const { addToast } = useToast()

  if (!isOpen || !customer) return null

  const currentBalance = customer.creditBalance || 0

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Credit History</h2>
              <p className="text-sm text-gray-600 mt-1">
                {customer.name} {customer.phone && `(${customer.phone})`}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-blue-600 font-medium">Current Balance</p>
                  <p className={`text-lg font-bold ${currentBalance >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                    {fmt(currentBalance, currencySymbol)}
                  </p>
                </div>
                <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-green-600 font-medium">Total Payments</p>
                  <p className="text-lg font-bold text-green-700">
                    {fmt(summary.totalPayments, currencySymbol)}
                  </p>
                </div>
                <div className="w-8 h-8 bg-green-200 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-red-600 font-medium">Total Purchases</p>
                  <p className="text-lg font-bold text-red-700">
                    {fmt(summary.totalPurchases, currencySymbol)}
                  </p>
                </div>
                <div className="w-8 h-8 bg-red-200 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-red-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M3 9h14l1 12H4L3 9z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-purple-600 font-medium">Transactions</p>
                  <p className="text-lg font-bold text-purple-700">
                    {summary.transactionCount}
                  </p>
                </div>
                <div className="w-8 h-8 bg-purple-200 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-purple-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Transactions List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
              <p className="text-gray-500 text-sm mt-2">Loading credit history...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-8 text-center">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-gray-500 text-sm">No credit transactions found</p>
              <p className="text-gray-400 text-xs mt-1">Credit transactions will appear here</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          transaction.type === CreditTransactionType.PURCHASE
                            ? 'bg-red-100 text-red-700'
                            : transaction.type === CreditTransactionType.PAYMENT
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {transaction.type === CreditTransactionType.PURCHASE ? (
                            <>
                              <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M3 9h14l1 12H4L3 9z" />
                              </svg>
                              Purchase
                            </>
                          ) : transaction.type === CreditTransactionType.PAYMENT ? (
                            <>
                              <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                              </svg>
                              Payment
                            </>
                          ) : (
                            <>
                              <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                              </svg>
                              Adjustment
                            </>
                          )}
                        </span>
                        <span className="text-sm text-gray-500">
                          {fmtDate(transaction.createdAt)} at {fmtTime(transaction.createdAt)}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-900 font-medium mb-1">
                        {transaction.description}
                      </p>
                      
                      {transaction.createdByName && (
                        <p className="text-xs text-gray-500">
                          by {transaction.createdByName}
                        </p>
                      )}
                    </div>
                    
                    <div className="text-right ml-4">
                      <div className={`text-lg font-bold ${
                        transaction.type === CreditTransactionType.PURCHASE
                          ? 'text-red-600'
                          : 'text-green-600'
                      }`}>
                        {transaction.type === CreditTransactionType.PURCHASE ? '-' : '+'}
                        {fmt(transaction.amount, currencySymbol)}
                      </div>
                      
                      {transaction.runningBalance !== undefined && (
                        <div className="text-xs text-gray-500 mt-1">
                          Balance: {fmt(transaction.runningBalance, currencySymbol)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white font-medium rounded-xl hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
