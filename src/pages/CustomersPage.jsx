import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import CustomerManagement from '../components/CustomerManagement'

export default function CustomersPage() {
  const { userProfile, isAdmin, isSuperAdmin, loading: authLoading } = useAuth()

  if (authLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  if (!isAdmin && !isSuperAdmin) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <CustomerManagement />
      </div>
    </div>
  )
}
