import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../lib/AuthContext'
import type { Hack, Question } from '../types/database.types'
import HackCard from '../components/HackCard'

export default function Home() {
  const { user } = useAuth()
  const [trendingHacks, setTrendingHacks] = useState<Hack[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Question[]>([])
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    fetchData()
  }, [user])

  useEffect(() => {
    if (searchQuery.trim()) {
      searchQuestions()
    } else {
      setSearchResults([])
    }
  }, [searchQuery])

  async function searchQuestions() {
    setIsSearching(true)
    const { data } = await supabase
      .from('questions')
      .select('*')
      .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%`)
      .limit(10)
    
    setSearchResults(data || [])
    setIsSearching(false)
  }

  async function fetchData() {
    setLoading(true)

    // Fetch ALL hacks first
    const { data: hacksData, error: hacksError } = await supabase
        .from('hacks')
        .select('*')
        .order('upvotes', { ascending: false })
        .limit(5)
        
    if (hacksError) {
      console.error('Error fetching hacks:', hacksError)
      setLoading(false)
      return
    }

    console.log(`Fetched ${hacksData?.length || 0} hacks from database`)

    // Fetch ALL questions separately
    const { data: questionsData } = await supabase
      .from('questions')
      .select('*')

    // Create a map of questions by ID
    const questionsMap = new Map(questionsData?.map(q => [q.id, q]) || [])

    // Manually join hacks with their questions
    const hacksWithQuestions = hacksData?.map(hack => ({
      ...hack,
      question: questionsMap.get(hack.question_id)
    })) || []

    console.log(`Joined hacks with questions, total: ${hacksWithQuestions.length}`)

    // Check if user has voted/saved
    if (user && hacksWithQuestions.length > 0) {
      const hackIds = hacksWithQuestions.map(h => h.id)
      
      const [votesData, savedData] = await Promise.all([
        supabase.from('hack_votes').select('hack_id').eq('user_id', user.id).in('hack_id', hackIds),
        supabase.from('saved_hacks').select('hack_id').eq('user_id', user.id).in('hack_id', hackIds)
      ])

      const votedIds = new Set(votesData.data?.map(v => v.hack_id) || [])
      const savedIds = new Set(savedData.data?.map(s => s.hack_id) || [])

      const enrichedHacks = hacksWithQuestions.map(hack => ({
        ...hack,
        user_has_voted: votedIds.has(hack.id),
        user_has_saved: savedIds.has(hack.id)
      }))

      setTrendingHacks(enrichedHacks)
    } else {
      setTrendingHacks(hacksWithQuestions)
    }

    // Get unique categories from questions
    const uniqueCategories = [...new Set(questionsData?.map(q => q.category) || [])]
    setCategories(uniqueCategories)

    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-textMuted">Loading hacks...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-10">
      {/* Hero Section with Search */}
      <div className="text-center space-y-6">
        <h1 className="text-4xl md:text-5xl font-bold text-textPrimary">
          Trending Parent Hacks
        </h1>
        <p className="text-lg text-textMuted max-w-2xl mx-auto">
          The most upvoted solutions from real parents. Save your favorites and discover what works.
        </p>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto relative">
          <input
            type="text"
            placeholder="Ask anything... (e.g., 'how to get my toddler to sleep')"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-6 py-4 rounded-2xl border-2 border-accent focus:border-primary focus:outline-none transition-colors text-textPrimary placeholder-textMuted bg-white shadow-sm"
          />
          <svg 
            className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-textMuted"
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>

          {/* Search Results Dropdown */}
          {searchQuery && (
            <div className="absolute top-full mt-2 w-full bg-card rounded-2xl border-2 border-accent shadow-lg max-h-96 overflow-y-auto z-50">
              {isSearching ? (
                <div className="p-8 text-center text-textMuted">Searching...</div>
              ) : searchResults.length === 0 ? (
                <div className="p-8 text-center text-textMuted">No questions found. Try different keywords!</div>
              ) : (
                <div className="p-2">
                  {searchResults.map(q => (
                    <Link
                      key={q.id}
                      to={`/question/${q.id}`}
                      className="block p-4 rounded-xl hover:bg-accent transition-colors"
                      onClick={() => setSearchQuery('')}
                    >
                      <div className="text-xs text-primary font-medium mb-1">{q.category}</div>
                      <div className="font-semibold text-textPrimary mb-1">{q.title}</div>
                      {q.description && (
                        <div className="text-sm text-textMuted line-clamp-2">{q.description}</div>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Categories */}
      <div className="bg-card rounded-2xl p-6 border-2 border-accent">
        <h2 className="text-xl font-semibold text-textPrimary mb-4">Browse by Category</h2>
        <div className="flex flex-wrap gap-3">
          {categories.map(category => (
            <Link
              key={category}
              to={`/category/${encodeURIComponent(category)}`}
              className="px-4 py-2 bg-accent hover:bg-primary hover:text-white rounded-xl font-medium transition-all"
            >
              {category}
            </Link>
          ))}
        </div>
      </div>

      {/* Trending Hacks */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-textPrimary">
            🔥 Trending Now ({trendingHacks.length} hacks)
          </h2>
          <Link 
            to="/submit"
            className="px-4 py-2 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-all"
          >
            + Submit Hack
          </Link>
        </div>

        <div className="space-y-5">
          {trendingHacks.length === 0 ? (
            <div className="bg-card rounded-2xl p-12 text-center border-2 border-dashed border-accent">
              <p className="text-textMuted text-lg">No hacks yet. Be the first!</p>
            </div>
          ) : (
            trendingHacks.map(hack => (
              <HackCard key={hack.id} hack={hack} onUpdate={fetchData} />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
