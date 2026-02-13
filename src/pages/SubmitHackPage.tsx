import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../lib/AuthContext'
import type { Question } from '../types/database.types'

export default function SubmitHackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  
  const [questions, setQuestions] = useState<Question[]>([])
  const [selectedQuestionId, setSelectedQuestionId] = useState(searchParams.get('question') || '')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [whyItWorks, setWhyItWorks] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchQuestions()
  }, [])

  async function fetchQuestions() {
    const { data } = await supabase
      .from('questions')
      .select('*')
      .order('category')
    
    setQuestions(data || [])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!user) {
      alert('Please sign in to submit a hack')
      return
    }

    if (!selectedQuestionId || !title || !description) {
      setError('Please fill in all required fields')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { error: submitError } = await supabase
        .from('hack_submissions')
        .insert({
          user_id: user.id,
          question_id: selectedQuestionId,
          title,
          description,
          why_it_works: whyItWorks || null,
          status: 'pending'
        })

      if (submitError) throw submitError

      alert('Hack submitted! It will be reviewed and published soon.')
      navigate(`/question/${selectedQuestionId}`)
    } catch (err) {
      console.error('Error submitting hack:', err)
      setError('Error submitting hack. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-card rounded-2xl p-12 text-center border-2 border-accent">
          <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🔒</span>
          </div>
          <h2 className="text-2xl font-bold text-textPrimary mb-2">Sign in required</h2>
          <p className="text-textMuted mb-6">
            You need to be signed in to submit a hack.
          </p>
          <Link
            to="/auth"
            className="inline-block px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-all"
          >
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  const groupedQuestions = questions.reduce((acc, q) => {
    if (!acc[q.category]) acc[q.category] = []
    acc[q.category].push(q)
    return acc
  }, {} as Record<string, Question[]>)

  return (
    <div className="max-w-3xl mx-auto space-y-8">
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
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-bold text-textPrimary">Submit a Hack</h1>
        <p className="text-lg text-textMuted">
          Share your parenting solution with the community
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-8 border-2 border-accent space-y-6">
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-red-700">
            {error}
          </div>
        )}

        {/* Question Selection */}
        <div>
          <label className="block text-sm font-semibold text-textPrimary mb-2">
            Question <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedQuestionId}
            onChange={(e) => setSelectedQuestionId(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border-2 border-accent focus:border-primary focus:outline-none transition-colors"
            required
          >
            <option value="">Select a question...</option>
            {Object.entries(groupedQuestions).map(([category, qs]) => (
              <optgroup key={category} label={category}>
                {qs.map(q => (
                  <option key={q.id} value={q.id}>{q.title}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-semibold text-textPrimary mb-2">
            Hack Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Use a music playlist for bedtime routine"
            className="w-full px-4 py-3 rounded-xl border-2 border-accent focus:border-primary focus:outline-none transition-colors"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-textPrimary mb-2">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your hack in detail..."
            rows={5}
            className="w-full px-4 py-3 rounded-xl border-2 border-accent focus:border-primary focus:outline-none transition-colors resize-none"
            required
          />
        </div>

        {/* Why It Works */}
        <div>
          <label className="block text-sm font-semibold text-textPrimary mb-2">
            Why It Works
          </label>
          <textarea
            value={whyItWorks}
            onChange={(e) => setWhyItWorks(e.target.value)}
            placeholder="Explain the psychology or reasoning behind why this hack is effective..."
            rows={3}
            className="w-full px-4 py-3 rounded-xl border-2 border-accent focus:border-primary focus:outline-none transition-colors resize-none"
          />
        </div>

        {/* Submit Button */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 px-6 py-3 rounded-xl border-2 border-accent text-textPrimary font-medium hover:bg-accent transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-all disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit Hack'}
          </button>
        </div>
      </form>

      {/* Info Box */}
      <div className="bg-accent/30 rounded-2xl p-6 border border-accent">
        <h3 className="font-semibold text-textPrimary mb-2">📝 Submission Guidelines</h3>
        <ul className="text-sm text-textMuted space-y-1">
          <li>• Be specific and detailed in your description</li>
          <li>• Share what actually worked for you</li>
          <li>• Your hack will be reviewed before being published</li>
          <li>• You'll be notified when it goes live</li>
        </ul>
      </div>
    </div>
  )
}
