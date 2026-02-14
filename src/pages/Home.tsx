import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../lib/AuthContext'
import type { Hack, Question } from '../types/database.types'
import HackCard from '../components/HackCard'

type SortOption = 'trending' | 'new' | 'top'
type FilterOption = 'all' | 'baby' | 'toddler' | 'preschool' | 'school-age'

export default function Home() {
  const { user } = useAuth()
  const [allHacks, setAllHacks] = useState<Hack[]>([])
  const [displayedHacks, setDisplayedHacks] = useState<Hack[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Question[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [sortBy, setSortBy] = useState<SortOption>('trending')
  const [filterAge, setFilterAge] = useState<FilterOption>('all')

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

  useEffect(() => {
    applyFiltersAndSort()
  }, [sortBy, filterAge, allHacks])

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

    const { data: hacksData, error: hacksError } = await supabase
      .from('hacks')
      .select('*')
      .order('upvotes', { ascending: false })
      .range(0, 9999)
      .limit(5)

    if (hacksError) {
      console.error('Error fetching hacks:', hacksError)
      setLoading(false)
      return
    }

    const { data: questionsData } = await supabase
      .from('questions')
      .select('*')

    const questionsMap = new Map(questionsData?.map(q => [q.id, q]) || [])

    const hacksWithQuestions = hacksData?.map(hack => ({
      ...hack,
      question: questionsMap.get(hack.question_id)
    })) || []

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

      setAllHacks(enrichedHacks)
    } else {
      setAllHacks(hacksWithQuestions)
    }

    const uniqueCategories = [...new Set(questionsData?.map(q => q.category) || [])]
    setCategories(uniqueCategories)

    setLoading(false)
  }

  function applyFiltersAndSort() {
    let filtered = [...allHacks]

    if (filterAge !== 'all') {
      const ageMap: Record<FilterOption, string[]> = {
        'all': [],
        'baby': ['0-12 months', 'Newborn', 'Infant'],
        'toddler': ['1-3 years', 'Toddler'],
        'preschool': ['3-5 years', 'Preschool'],
        'school-age': ['5+ years', 'School age', 'Elementary']
      }
      
      filtered = filtered.filter(hack => {
        if (!hack.age_range) return true
        return ageMap[filterAge].some(age => 
          hack.age_range?.toLowerCase().includes(age.toLowerCase())
        )
      })
    }

    if (sortBy === 'trending') {
      filtered.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0))
    } else if (sortBy === 'new') {
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    } else if (sortBy === 'top') {
      filtered.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0))
    }

    setDisplayedHacks(filtered)
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
      <div className="text-center space-y-6">
        <div className="inline-block">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent mb-2 animate-fade-in">
            Parent Hacks
          </h1>
          <div className="h-1 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full"></div>
        </div>
        <p className="text-lg text-textMuted max-w-2xl mx-auto">
          Real solutions from real parents. Save your favorites and discover what works.
        </p>

        <div className="max-w-2xl mx-auto relative">
          <div className="relative group">
            <input
              type="text"
              placeholder="Ask anything... (e.g., 'how to get my toddler to sleep')"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-6 py-4 pr-12 rounded-2xl border-2 border-accent focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all text-textPrimary placeholder-textMuted bg-white shadow-sm group-hover:shadow-md"
            />
            <svg 
              className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-textMuted group-focus-within:text-primary transition-colors"
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {searchQuery && (
            <div className="absolute top-full mt-2 w-full bg-card rounded-2xl border-2 border-accent shadow-2xl max-h-96 overflow-y-auto z-50 animate-slide-in">
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
                      className="block p-4 rounded-xl hover:bg-accent transition-all hover:scale-[1.02]"
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

      <div className="bg-gradient-to-br from-card to-card/50 rounded-2xl p-6 border-2 border-accent/50 shadow-lg backdrop-blur-sm">
        <h2 className="text-xl font-semibold text-textPrimary mb-4 flex items-center gap-2">
          <span className="text-2xl">📚</span>
          Browse by Category
        </h2>
        <div className="flex flex-wrap gap-3">
          {categories.map(category => (
            <Link
              key={category}
              to={`/category/${encodeURIComponent(category)}`}
              className="px-4 py-2 bg-accent hover:bg-gradient-to-r hover:from-primary hover:to-primary/80 hover:text-white rounded-xl font-medium transition-all hover:scale-105 hover:shadow-md"
            >
              {category}
            </Link>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-2xl p-6 border-2 border-accent/50 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-textMuted">Sort by:</span>
            <div className="flex gap-2">
              {(['trending', 'new', 'top'] as SortOption[]).map(option => (
                <button
                  key={option}
                  onClick={() => setSortBy(option)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                    sortBy === option
                      ? 'bg-primary text-white shadow-md scale-105'
                      : 'bg-accent text-textPrimary hover:bg-accent/70'
                  }`}
                >
                  {option === 'trending' && '🔥 Trending'}
                  {option === 'new' && '✨ New'}
                  {option === 'top' && '⭐ Top'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-textMuted">Age:</span>
            <select
              value={filterAge}
              onChange={(e) => setFilterAge(e.target.value as FilterOption)}
              className="px-4 py-2 rounded-lg border-2 border-accent focus:border-primary focus:outline-none bg-white text-textPrimary font-medium"
            >
              <option value="all">All Ages</option>
              <option value="baby">Baby (0-12m)</option>
              <option value="toddler">Toddler (1-3y)</option>
              <option value="preschool">Preschool (3-5y)</option>
              <option value="school-age">School Age (5+)</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-textPrimary flex items-center gap-2">
            <span className="text-3xl">🔥</span>
            Trending Now ({displayedHacks.length})
          </h2>
          <Link 
            to="/submit"
            className="px-6 py-3 bg-gradient-to-r from-primary to-primary/80 text-white rounded-xl font-medium hover:shadow-lg hover:scale-105 transition-all duration-200 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Submit Hack
          </Link>
        </div>

        <div className="space-y-5">
          {displayedHacks.length === 0 ? (
            <div className="bg-card rounded-2xl p-12 text-center border-2 border-dashed border-accent">
              <p className="text-textMuted text-lg">No hacks match your filters. Try adjusting them!</p>
            </div>
          ) : (
            displayedHacks.map(hack => (
              <HackCard key={hack.id} hack={hack} onUpdate={fetchData} />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
