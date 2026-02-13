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
  const [hasSaved, setHasSaved] = useState(hack.user_has_saved || false)
  const [isVoting, setIsVoting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  async function handleUpvote() {
    // No login required for upvoting
    setIsVoting(true)

    try {
      if (user) {
        // Logged in user - track their vote
        if (hasVoted) {
          await supabase
            .from('hack_votes')
            .delete()
            .eq('hack_id', hack.id)
            .eq('user_id', user.id)

          await supabase
            .from('hacks')
            .update({ upvotes: upvotes - 1 })
            .eq('id', hack.id)

          setUpvotes(upvotes - 1)
          setHasVoted(false)
        } else {
          await supabase
            .from('hack_votes')
            .insert({ hack_id: hack.id, user_id: user.id })

          await supabase
            .from('hacks')
            .update({ upvotes: upvotes + 1 })
            .eq('id', hack.id)

          setUpvotes(upvotes + 1)
          setHasVoted(true)
        }
      } else {
        // Not logged in - just increment upvote count
        await supabase
          .from('hacks')
          .update({ upvotes: upvotes + 1 })
          .eq('id', hack.id)

        setUpvotes(upvotes + 1)
      }
      
      onUpdate?.()
    } catch (error) {
      console.error('Error voting:', error)
      alert('Error voting. Please try again.')
    } finally {
      setIsVoting(false)
    }
  }

  async function handleSave() {
    if (!user) {
      alert('Please sign in to save hacks')
      return
    }

    setIsSaving(true)

    try {
      if (hasSaved) {
        await supabase
          .from('saved_hacks')
          .delete()
          .eq('hack_id', hack.id)
          .eq('user_id', user.id)

        setHasSaved(false)
      } else {
        await supabase
          .from('saved_hacks')
          .insert({ hack_id: hack.id, user_id: user.id })

        setHasSaved(true)
      }
    } catch (error) {
      console.error('Error saving:', error)
      alert('Error saving. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="bg-card rounded-2xl border-2 border-accent hover:border-primary transition-all duration-200 shadow-sm hover:shadow-md">
      <div className="p-6">
        <div className="flex gap-4">
          {/* Upvote Section */}
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            <button
              onClick={handleUpvote}
              disabled={isVoting}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                hasVoted
                  ? 'bg-primary text-white'
                  : 'bg-accent hover:bg-primary/10 text-textMuted hover:text-primary'
              } ${isVoting ? 'opacity-50' : ''}`}
            >
              <svg className="w-5 h-5" fill={hasVoted ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <span className={`text-sm font-semibold ${hasVoted ? 'text-primary' : 'text-textMuted'}`}>
              {upvotes}
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Question - Make it BIGGER and more prominent */}
            {hack.question && (
              <Link
                to={`/question/${hack.question.id}`}
                className="block mb-3 group"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors mb-2">
                  <span>{hack.question.category}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-textPrimary group-hover:text-primary transition-colors mb-3">
                  {hack.question.title}
                </h3>
              </Link>
            )}

            {/* Hack Title and Content */}
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-textPrimary mb-2">
                  💡 {hack.title}
                </h4>
              </div>

              {/* Save Button */}
              <button
                onClick={handleSave}
                disabled={isSaving}
                className={`flex-shrink-0 p-2 rounded-xl transition-all ${
                  hasSaved
                    ? 'text-primary bg-primary/10'
                    : 'text-textMuted hover:text-primary hover:bg-primary/10'
                } ${isSaving ? 'opacity-50' : ''}`}
                title={hasSaved ? 'Unsave' : 'Save'}
              >
                <svg className="w-5 h-5" fill={hasSaved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </button>
            </div>

            <p className="text-textPrimary leading-relaxed mb-4">
              {hack.description}
            </p>

            {hack.why_it_works && (
              <div className="bg-accent/50 rounded-xl p-4 border border-accent mb-4">
                <p className="text-sm text-textMuted">
                  <span className="font-semibold text-primary">Why it works: </span>
                  {hack.why_it_works}
                </p>
              </div>
            )}

            {/* Metadata */}
            {(hack.age_range || hack.time_cost || hack.money_cost) && (
              <div className="flex flex-wrap gap-2">
                {hack.age_range && (
                  <span className="px-3 py-1 bg-accent/50 rounded-full text-xs text-textMuted">
                    👶 {hack.age_range}
                  </span>
                )}
                {hack.time_cost && (
                  <span className="px-3 py-1 bg-accent/50 rounded-full text-xs text-textMuted">
                    ⏱️ {hack.time_cost}
                  </span>
                )}
                {hack.money_cost && (
                  <span className="px-3 py-1 bg-accent/50 rounded-full text-xs text-textMuted">
                    💰 {hack.money_cost}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
