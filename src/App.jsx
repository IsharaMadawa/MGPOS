import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { OrgProvider } from './contexts/OrgContext'
import { ToastProvider } from './components/ToastContainer'
import Navbar from './components/Navbar'
import POSPage from './pages/POSPage'
import SettingsPage from './pages/SettingsPage'
import LoginPage from './pages/LoginPage'
import SuperAdminPage from './pages/SuperAdminPage'
import ReportsPage from './pages/ReportsPage'
import LogsPage from './pages/LogsPage'
import BillingLogsPage from './pages/BillingLogsPage'

// Protected route wrapper
function ProtectedRoute({ children }) {
  const { user, loading, initializing } = useAuth()

  if (loading || initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

// Admin-only route wrapper
function AdminRoute({ children }) {
  const { user, loading, initializing, isAdmin } = useAuth()

  if (loading || initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  return children
}

// Super Admin route wrapper
function SuperAdminRoute({ children }) {
  const { user, loading, initializing, isSuperAdmin } = useAuth()

  if (loading || initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!isSuperAdmin) {
    return <Navigate to="/" replace />
  }

  return children
}

// Main app content with auth
function AppContent() {
  const { user, loading, initializing } = useAuth()

  if (loading || initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Routes>
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="/" element={<ProtectedRoute><POSPage /></ProtectedRoute>} />
          <Route path="/settings" element={<AdminRoute><SettingsPage /></AdminRoute>} />
          <Route path="/reports" element={<AdminRoute><ReportsPage /></AdminRoute>} />
          <Route path="/logs" element={<AdminRoute><LogsPage /></AdminRoute>} />
          <Route path="/billing-logs" element={<AdminRoute><BillingLogsPage /></AdminRoute>} />
          <Route path="/super-admin" element={<SuperAdminRoute><SuperAdminPage /></SuperAdminRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <OrgProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/*" element={<AppContent />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </OrgProvider>
    </AuthProvider>
  )
}