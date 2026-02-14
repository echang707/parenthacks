import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../lib/AuthContext'
import type { Hack, Question } from '../types/database.types'

type Comment = {
  id: string
  hack_id: string
  user_id: string
  content: string
  created_at: string
  profiles?: {
    username: string | null
  }
}

export default function HackDetailPage() {
  const { id } = useParams()
  const { user, profile } = useAuth()
  const [hack, setHack] = useState<Hack | null>(null)
  const [question, setQuestion] = useState<Question | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [upvotes, setUpvotes] = useState(0)
  const [hasVoted, setHasVoted] = useState(false)
  const [hasSaved, setHasSaved] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (id) fetchData()
  }, [id, user])

  async function fetchData() {
    setLoading(true)

    const { data: hackData } = await supabase
      .from('hacks')
      .select('*')
      .eq('id', id)
      .single()

    if (!hackData) {
      setLoading(false)
      return
    }

    setHack(hackData)
    setUpvotes(hackData.upvotes || 0)

    const { data: questionData } = await supabase
      .from('questions')
      .select('*')
      .eq('id', hackData.question_id)
      .single()

    setQuestion(questionData)

    if (user) {
      const [voteData, saveData] = await Promise.all([
        supabase.from('hack_votes').select('*').eq('hack_id', id).eq('user_id', user.id).single(),
        supabase.from('saved_hacks').select('*').eq('hack_id', id).eq('user_id', user.id).single()
      ])

      setHasVoted(!!voteData.data)
      setHasSaved(!!saveData.data)
    }

    const { data: commentsData, error: commentsError } = await supabase
      .from('hack_comments')
      .select(`
        *,
        profiles (
          username
        )
      `)
      .eq('hack_id', id)
      .order('created_at', { ascending: false })

    if (!commentsError) {
      setComments(commentsData || [])
    }

    setLoading(false)
  }

  async function handleUpvote() {
    if (user && hasVoted) {
      const previousUpvotes = upvotes
      
      try {
        setUpvotes(upvotes - 1)
        setHasVoted(false)

        await Promise.all([
          supabase.from('hack_votes').delete().eq('hack_id', id).eq('user_id', user.id),
          supabase.from('hacks').update({ upvotes: upvotes - 1 }).eq('id', id)
        ])
      } catch (error) {
        setUpvotes(previousUpvotes)
        setHasVoted(true)
      }
      return
    }

    if (user && !hasVoted) {
      const previousUpvotes = upvotes
      
      try {
        setUpvotes(upvotes + 1)
        setHasVoted(true)

        await Promise.all([
          supabase.from('hack_votes').insert({ hack_id: id, user_id: user.id }),
          supabase.from('hacks').update({ upvotes: upvotes + 1 }).eq('id', id)
        ])
      } catch (error) {
        setUpvotes(previousUpvotes)
        setHasVoted(false)
      }
      return
    }

    if (!user) {
      alert('Sign in to upvote!')
    }
  }

  async function handleSave() {
    if (!user) {
      alert('Sign in to save hacks!')
      return
    }

    try {
      if (hasSaved) {
        await supabase.from('saved_hacks').delete().eq('hack_id', id).eq('user_id', user.id)
        setHasSaved(false)
      } else {
        await supabase.from('saved_hacks').insert({ hack_id: id, user_id: user.id })
        setHasSaved(true)
      }
    } catch (error) {
      console.error('Error saving:', error)
    }
  }

  async function handleCommentSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!user) {
      alert('Sign in to comment!')
      return
    }

    if (!newComment.trim()) return

    setIsSubmitting(true)

    try {
      const { data, error } = await supabase
        .from('hack_comments')
        .insert({
          hack_id: id,
          user_id: user.id,
          content: newComment.trim()
        })
        .select(`
          *,
          profiles (
            username
          )
        `)
        .single()

      if (error) {
        alert('Error posting comment. Please try again.')
      } else if (data) {
        setComments([data, ...comments])
        setNewComment('')
      }
    } catch (error) {
      alert('Error posting comment. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-textMuted">Loading hack...</p>
        </div>
      </div>
    )
  }

  if (!hack) {
    return (
      <div className="text-center py-12">
        <p className="text-textMuted text-lg">Hack not found</p>
        <Link to="/" className="text-primary hover:underline mt-4 inline-block">Go home</Link>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back button */}
      <Link 
        to={question ? `/question/${question.id}` : '/'}
        className="inline-flex items-center text-textMuted hover:text-primary transition-colors group"
      >
        <svg className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </Link>

      {/* Main Content */}
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        {/* Question Header */}
        {question && (
          <div className="bg-gradient-to-br from-accent/30 to-accent/10 px-8 py-6 border-b border-accent/30">
            <Link to={`/question/${question.id}`}>
              <span className="inline-block px-3 py-1 bg-white/80 backdrop-blur-sm text-primary rounded-full text-xs font-semibold mb-3 hover:bg-white transition-colors">
                {question.category}
              </span>
              <h2 className="text-2xl font-bold text-textPrimary hover:text-primary transition-colors">
                {question.title}
              </h2>
            </Link>
          </div>
        )}

        {/* Hack Content */}
        <div className="p-8">
          {/* Title & Actions */}
          <div className="flex gap-6 mb-8">
            {/* Upvote/Save Column */}
            <div className="flex flex-col items-center gap-3 pt-2">
              <button
                onClick={handleUpvote}
                className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all ${
                  hasVoted
                    ? 'bg-primary text-white shadow-lg'
                    : 'bg-gray-50 hover:bg-gray-100 text-gray-600'
                }`}
              >
                <svg className="w-6 h-6" fill={hasVoted ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
                </svg>
                <span className="text-sm font-bold">{upvotes}</span>
              </button>

              <button
                onClick={handleSave}
                className={`p-3 rounded-2xl transition-all ${
                  hasSaved
                    ? 'bg-primary/10 text-primary'
                    : 'bg-gray-50 hover:bg-gray-100 text-gray-600'
                }`}
              >
                <svg className="w-6 h-6" fill={hasSaved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </button>
            </div>

            {/* Title */}
            <div className="flex-1">
              <div className="flex items-start gap-3">
                <span className="text-5xl">💡</span>
                <h1 className="text-3xl font-bold text-gray-900 leading-tight">
                  {hack.title}
                </h1>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mb-8">
            <p className="text-lg text-gray-700 leading-relaxed">
              {hack.description}
            </p>
          </div>

          {/* Why it works */}
          {hack.why_it_works && (
            <div className="mb-8 bg-gradient-to-br from-accent/20 to-accent/5 rounded-2xl p-6 border border-accent/30">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">💭</span>
                <h3 className="text-lg font-bold text-gray-900">Why it works</h3>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {hack.why_it_works}
              </p>
            </div>
          )}

          {/* Metadata Pills */}
          {(hack.age_range || hack.time_cost || hack.money_cost || hack.intensity) && (
            <div className="flex flex-wrap gap-3 mb-8">
              {hack.time_cost && (
                <div className="bg-purple-50 px-4 py-2 rounded-xl border border-purple-200">
                  <div className="text-xs text-purple-600 font-semibold mb-0.5">Time</div>
                  <div className="text-sm font-bold text-purple-900">{hack.time_cost}</div>
                </div>
              )}
              {hack.money_cost && (
                <div className="bg-green-50 px-4 py-2 rounded-xl border border-green-200">
                  <div className="text-xs text-green-600 font-semibold mb-0.5">Cost</div>
                  <div className="text-sm font-bold text-green-900">{hack.money_cost}</div>
                </div>
              )}
              {hack.intensity && (
                <div className="bg-orange-50 px-4 py-2 rounded-xl border border-orange-200">
                  <div className="text-xs text-orange-600 font-semibold mb-0.5">Effort</div>
                  <div className="text-sm font-bold text-orange-900">{hack.intensity}</div>
                </div>
              )}
              {hack.age_range && (
                <div className="bg-blue-50 px-4 py-2 rounded-xl border border-blue-200">
                  <div className="text-xs text-blue-600 font-semibold mb-0.5">Age</div>
                  <div className="text-sm font-bold text-blue-900">{hack.age_range}</div>
                </div>
              )}
            </div>
          )}

          {/* When to use / avoid */}
          {(hack.use_when || hack.avoid_when) && (
            <div className="grid md:grid-cols-2 gap-4">
              {hack.use_when && (
                <div className="bg-green-50 rounded-2xl p-5 border border-green-200">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">✅</span>
                    <h3 className="font-bold text-green-900">When to use</h3>
                  </div>
                  <p className="text-sm text-green-700 leading-relaxed">{hack.use_when}</p>
                </div>
              )}
              {hack.avoid_when && (
                <div className="bg-red-50 rounded-2xl p-5 border border-red-200">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">⚠️</span>
                    <h3 className="font-bold text-red-900">When to avoid</h3>
                  </div>
                  <p className="text-sm text-red-700 leading-relaxed">{hack.avoid_when}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Comments Section */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Discussion ({comments.length})
        </h2>

        {/* Comment form */}
        {user ? (
          <form onSubmit={handleCommentSubmit} className="mb-8">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your experience with this hack..."
              className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-primary focus:outline-none resize-none text-gray-900 placeholder-gray-400"
              rows={3}
            />
            <button
              type="submit"
              disabled={isSubmitting || !newComment.trim()}
              className="mt-3 px-6 py-2.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Posting...' : 'Post Comment'}
            </button>
          </form>
        ) : (
          <div className="mb-8 p-6 bg-gray-50 rounded-2xl text-center border border-gray-200">
            <p className="text-gray-600 mb-3">Sign in to join the discussion</p>
            <Link to="/auth" className="inline-block px-6 py-2.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-all">
              Sign In
            </Link>
          </div>
        )}

        {/* Comments list */}
        {comments.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p>No comments yet. Start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map(comment => (
              <div key={comment.id} className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center text-white font-bold">
                    {comment.profiles?.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {comment.profiles?.username || 'Anonymous'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(comment.created_at).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                  </div>
                </div>
                <p className="text-gray-700 leading-relaxed pl-13">
                  {comment.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
