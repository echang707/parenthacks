import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../lib/AuthContext'
import HackCard from '../components/HackCard'
import type { Hack } from '../types/database.types'

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user, profile, signOut } = useAuth()
  const [savedHacks, setSavedHacks] = useState<Hack[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'saved' | 'submitted'>('saved')

  useEffect(() => {
    if (!user) {
      navigate('/auth')
      return
    }
    fetchSavedHacks()
  }, [user])

  async function fetchSavedHacks() {
    if (!user) return
    
    setLoading(true)

    const { data } = await supabase
      .from('saved_hacks')
      .select(`
        hack_id,
        hacks (
          *,
          question:questions(id, title, category)
        )
      `)
      .eq('user_id', user.id)

    const hacks = data?.map(item => ({
      ...item.hacks,
      user_has_saved: true,
      user_has_voted: false // We'll check this if needed
    })) || []

    setSavedHacks(hacks as any)
    setLoading(false)
  }

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  if (!user) return null

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-card rounded-2xl p-8 border-2 border-accent">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-textPrimary mb-2">
              {profile?.username || 'User'}
            </h1>
            <p className="text-textMuted">{user.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 rounded-xl border-2 border-accent hover:bg-accent text-textPrimary font-medium transition-all"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b-2 border-accent">
        <button
          onClick={() => setActiveTab('saved')}
          className={`px-6 py-3 font-semibold transition-all ${
            activeTab === 'saved'
              ? 'text-primary border-b-2 border-primary -mb-0.5'
              : 'text-textMuted hover:text-textPrimary'
          }`}
        >
          Saved Hacks ({savedHacks.length})
        </button>
        <button
          onClick={() => setActiveTab('submitted')}
          className={`px-6 py-3 font-semibold transition-all ${
            activeTab === 'submitted'
              ? 'text-primary border-b-2 border-primary -mb-0.5'
              : 'text-textMuted hover:text-textPrimary'
          }`}
        >
          My Submissions
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-textMuted">Loading...</p>
          </div>
        </div>
      ) : activeTab === 'saved' ? (
        <div className="space-y-5">
          {savedHacks.length === 0 ? (
            <div className="bg-card rounded-2xl p-12 text-center border-2 border-dashed border-accent">
              <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📑</span>
              </div>
              <p className="text-textMuted text-lg mb-4">No saved hacks yet</p>
              <Link
                to="/"
                className="inline-block px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-all"
              >
                Browse Hacks
              </Link>
            </div>
          ) : (
            savedHacks.map(hack => (
              <HackCard key={hack.id} hack={hack} onUpdate={fetchSavedHacks} />
            ))
          )}
        </div>
      ) : (
        <div className="bg-card rounded-2xl p-12 text-center border-2 border-dashed border-accent">
          <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🚧</span>
          </div>
          <p className="text-textMuted text-lg">Submissions view coming soon</p>
        </div>
      )}
    </div>
  )
}
