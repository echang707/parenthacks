import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import type { Question } from '../types/database.types'

export default function CategoryPage() {
  const { category } = useParams<{ category: string }>()
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (category) fetchQuestions()
  }, [category])

  async function fetchQuestions() {
    setLoading(true)

    const decodedCategory = decodeURIComponent(category || '')

    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('category', decodedCategory)
      .order('created_at', { ascending: false })
      .range(0, 9999) // Fetch up to 10,000 questions

    if (error) {
      console.error('Error fetching questions:', error)
    }

    console.log(`Loaded ${data?.length || 0} questions for category: ${decodedCategory}`)

    setQuestions(data || [])
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-textMuted">Loading questions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
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

      {/* Category Header */}
      <div className="text-center space-y-3">
        <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
          Category
        </span>
        <h1 className="text-4xl font-bold text-textPrimary">
          {decodeURIComponent(category || '')}
        </h1>
        <p className="text-textMuted">
          {questions.length} {questions.length === 1 ? 'question' : 'questions'}
        </p>
      </div>

      {/* Questions List */}
      <div className="grid gap-6 md:grid-cols-2">
        {questions.length === 0 ? (
          <div className="col-span-full bg-card rounded-2xl p-12 text-center border-2 border-dashed border-accent">
            <p className="text-textMuted text-lg">No questions in this category yet.</p>
          </div>
        ) : (
          questions.map(question => (
            <Link
              key={question.id}
              to={`/question/${question.id}`}
              className="group bg-card rounded-2xl p-6 border-2 border-accent hover:border-primary transition-all shadow-sm hover:shadow-md"
            >
              <h3 className="text-xl font-semibold text-textPrimary mb-3 group-hover:text-primary transition-colors">
                {question.title}
              </h3>
              
              {question.description && (
                <p className="text-textMuted leading-relaxed line-clamp-3 mb-4">
                  {question.description}
                </p>
              )}

              <div className="flex items-center text-sm text-primary font-medium">
                View hacks
                <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
