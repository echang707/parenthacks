import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

export default function AuthPage() {
  const navigate = useNavigate()
  const { signIn, signUp } = useAuth()
  
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isSignUp) {
        if (!username) {
          setError('Please enter a username')
          return
        }
        await signUp(email, password, username)
        alert('Account created! Please check your email to verify.')
      } else {
        await signIn(email, password)
        navigate('/')
      }
    } catch (err: any) {
      setError(err.message || 'Authentication error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto space-y-8">
      {/* Back Button */}
      <Link 
        to="/" 
        className="inline-flex items-center text-textMuted hover:text-primary transition-colors group"
      >
        <svg className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to home
      </Link>

      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-textPrimary">
          {isSignUp ? 'Create Account' : 'Welcome Back'}
        </h1>
        <p className="text-textMuted">
          {isSignUp 
            ? 'Join the parent hacks community' 
            : 'Sign in to save and upvote hacks'
          }
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-8 border-2 border-accent space-y-5">
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-red-700 text-sm">
            {error}
          </div>
        )}

        {isSignUp && (
          <div>
            <label className="block text-sm font-semibold text-textPrimary mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Choose a username"
              className="w-full px-4 py-3 rounded-xl border-2 border-accent focus:border-primary focus:outline-none transition-colors"
              required
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-textPrimary mb-2">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full px-4 py-3 rounded-xl border-2 border-accent focus:border-primary focus:outline-none transition-colors"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-textPrimary mb-2">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-4 py-3 rounded-xl border-2 border-accent focus:border-primary focus:outline-none transition-colors"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-6 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-all disabled:opacity-50"
        >
          {loading ? 'Loading...' : isSignUp ? 'Create Account' : 'Sign In'}
        </button>
      </form>

      {/* Toggle */}
      <div className="text-center">
        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-textMuted hover:text-primary transition-colors"
        >
          {isSignUp 
            ? 'Already have an account? Sign in' 
            : "Don't have an account? Sign up"
          }
        </button>
      </div>
    </div>
  )
}
