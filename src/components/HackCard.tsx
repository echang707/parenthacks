import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../lib/AuthContext'
import type { Hack } from '../types/database.types'

type Props = {
  hack: Hack
  onUpdate?: () => void
}

export default function HackCard({ hack, onUpdate }: Props) {
  const { user } = useAuth()
  const [upvotes, setUpvotes] = useState(hack.upvotes || 0)
  const [hasVoted, setHasVoted] = useState(hack.user_has_voted || false)

  async function handleUpvote(e: React.MouseEvent) {
    e.preventDefault() // Don't trigger the card link
    e.stopPropagation()

    if (user && hasVoted) {
      const previousUpvotes = upvotes
      
      try {
        setUpvotes(upvotes - 1)
        setHasVoted(false)

        await Promise.all([
          supabase
            .from('hack_votes')
            .delete()
            .eq('hack_id', hack.id)
            .eq('user_id', user.id),
          supabase
            .from('hacks')
            .update({ upvotes: upvotes - 1 })
            .eq('id', hack.id)
        ])
      } catch (error) {
        console.error('Error removing vote:', error)
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
          supabase
            .from('hack_votes')
            .insert({ hack_id: hack.id, user_id: user.id }),
          supabase
            .from('hacks')
            .update({ upvotes: upvotes + 1 })
            .eq('id', hack.id)
        ])
      } catch (error) {
        console.error('Error adding vote:', error)
        setUpvotes(previousUpvotes)
        setHasVoted(false)
      }
      return
    }

    if (!user) {
      alert('Sign in to upvote hacks!')
      return
    }
  }

  return (
    <Link 
      to={`/hack/${hack.id}`}
      className="block bg-card rounded-2xl border-2 border-accent hover:border-primary transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1 group"
    >
      <div className="p-6">
        <div className="flex gap-4">
          {/* Upvote Section */}
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            <button
              onClick={handleUpvote}
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 ${
                hasVoted
                  ? 'bg-gradient-to-br from-primary to-primary/70 text-white shadow-lg'
                  : 'bg-accent hover:bg-primary/10 text-textMuted hover:text-primary hover:scale-110'
              } hover:shadow-md active:scale-95`}
              title={hasVoted ? 'Remove upvote' : 'Upvote this hack'}
            >
              <svg 
                className={`w-6 h-6 transition-transform ${hasVoted ? 'scale-110' : ''}`} 
                fill={hasVoted ? 'currentColor' : 'none'} 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <span className={`text-base font-bold transition-colors ${hasVoted ? 'text-primary' : 'text-textMuted'}`}>
              {upvotes}
            </span>
          </div>

          {/* Content - Simplified */}
          <div className="flex-1 min-w-0">
            {/* Question */}
            {hack.question && (
              <div className="mb-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-primary/10 to-primary/5 text-primary rounded-lg text-xs font-medium mb-2">
                  <span>{hack.question.category}</span>
                </div>
                <h3 className="text-lg font-bold text-textPrimary group-hover:text-primary transition-colors line-clamp-2">
                  {hack.question.title}
                </h3>
              </div>
            )}

            {/* Hack Title */}
            <div className="flex items-start gap-2 mb-3">
              <span className="text-xl flex-shrink-0">💡</span>
              <h4 className="text-base font-semibold text-textPrimary line-clamp-2">
                {hack.title}
              </h4>
            </div>

            {/* Preview snippet */}
            <p className="text-sm text-textMuted line-clamp-2 mb-3">
              {hack.description}
            </p>

            {/* Metadata tags - compact */}
            <div className="flex flex-wrap gap-2">
              {hack.age_range && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 rounded-full text-xs text-blue-700">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                  </svg>
                  {hack.age_range}
                </span>
              )}
              {hack.time_cost && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 rounded-full text-xs text-purple-700">
                  ⏱️ {hack.time_cost}
                </span>
              )}
              
              {/* View details indicator */}
              <span className="ml-auto inline-flex items-center gap-1 text-primary text-xs font-medium group-hover:gap-2 transition-all">
                View details
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
