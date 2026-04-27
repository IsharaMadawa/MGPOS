import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate, Navigate } from 'react-router-dom'

export default function LoginPage() {
  const { login, signup, user, loading, initializing } = useAuth()
  const navigate = useNavigate()
  
  const [isSignup, setIsSignup] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [orgCode, setOrgCode] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Redirect if already logged in
  if (!loading && !initializing && user) {
    return <Navigate to="/" replace />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      if (isSignup) {
        if (!orgCode.trim()) {
          setError('Organization code is required')
          setSubmitting(false)
          return
        }
        await signup(username, password, displayName || username, email || null, 'user', orgCode.trim())
      } else {
        await login(username, password)
      }
      navigate('/')
    } catch (err) {
      console.error('Auth error:', err)
      setError(err.message || 'Authentication failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <div className="flex items-center justify-center w-12 h-12 bg-emerald-100 rounded-full mx-auto mb-4">
          <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        
        <h2 className="text-xl font-semibold text-gray-900 mb-1 text-center">
          {isSignup ? 'Create Account' : 'Sign In'}
        </h2>
        <p className="text-sm text-gray-500 text-center mb-6">
          {isSignup ? 'Enter your details to get started' : 'Enter your credentials to continue'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignup && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Your name"
                required={isSignup}
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Enter your username"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          {isSignup && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-gray-400 font-normal">(optional)</span></label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="you@example.com"
              />
            </div>
          )}

          {isSignup && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Organization Code</label>
              <input
                type="text"
                value={orgCode}
                onChange={e => setOrgCode(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Enter org code to join"
              />
            </div>
          )}

          {error && (
            <div className="bg-rose-50 text-rose-600 text-sm p-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-emerald-600 text-white py-2.5 rounded-xl font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Please wait...' : (isSignup ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => { setIsSignup(!isSignup); setError('') }}
            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
          >
            {isSignup ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  )
}