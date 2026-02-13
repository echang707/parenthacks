import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { supabase } from "../lib/supabaseClient"
import { useAuth } from "../lib/AuthContext"
import HackCard from "../components/HackCard"
import type { Hack, Question } from "../types/database.types"

export default function QuestionPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [question, setQuestion] = useState<Question | null>(null)
  const [hacks, setHacks] = useState<Hack[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) fetchData()
  }, [id, user])

  async function fetchData() {
    setLoading(true)

    // Fetch question
    const { data: questionData } = await supabase
      .from("questions")
      .select("*")
      .eq("id", id)
      .single()

    setQuestion(questionData)

    // Fetch ALL hacks sorted by upvotes
    const { data: hacksData, error: hacksError } = await supabase
      .from("hacks")
      .select("*")
      .eq("question_id", id)
      .order("upvotes", { ascending: false })
      .range(0, 9999) // Fetch up to 10,000 hacks

    if (hacksError) {
      console.error('Error fetching hacks:', hacksError)
    }

    console.log(`Loaded ${hacksData?.length || 0} hacks for question: ${questionData?.title}`)

    // Check if user has voted/saved
    if (user && hacksData) {
      const hackIds = hacksData.map(h => h.id)
      
      const [votesData, savedData] = await Promise.all([
        supabase.from('hack_votes').select('hack_id').eq('user_id', user.id).in('hack_id', hackIds),
        supabase.from('saved_hacks').select('hack_id').eq('user_id', user.id).in('hack_id', hackIds)
      ])

      const votedIds = new Set(votesData.data?.map(v => v.hack_id) || [])
      const savedIds = new Set(savedData.data?.map(s => s.hack_id) || [])

      const enrichedHacks = hacksData.map(hack => ({
        ...hack,
        user_has_voted: votedIds.has(hack.id),
        user_has_saved: savedIds.has(hack.id)
      }))

      setHacks(enrichedHacks)
    } else {
      setHacks(hacksData || [])
    }

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
    <div className="space-y-8">
      
      {/* Back Button */}
      <Link 
        to={question?.category ? `/category/${encodeURIComponent(question.category)}` : '/'}
        className="inline-flex items-center text-textMuted hover:text-primary transition-colors group"
      >
        <svg className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to {question?.category || 'home'}
      </Link>

      {/* Question Header */}
      <div className="bg-card rounded-2xl p-8 border-2 border-accent shadow-sm">
        {question?.category && (
          <Link
            to={`/category/${encodeURIComponent(question.category)}`}
            className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4 hover:bg-primary/20 transition-colors"
          >
            {question.category}
          </Link>
        )}
        <h1 className="text-3xl md:text-4xl font-bold text-textPrimary mb-3">
          {question?.title}
        </h1>
        {question?.description && (
          <p className="text-lg text-textMuted">
            {question.description}
          </p>
        )}
      </div>

      {/* Hacks Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-textPrimary">
            Solutions ({hacks.length})
          </h2>
          <Link
            to={`/submit?question=${id}`}
            className="px-4 py-2 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-all"
          >
            + Add Hack
          </Link>
        </div>

        <div className="space-y-5">
          {hacks.length === 0 ? (
            <div className="bg-card rounded-2xl p-12 text-center border-2 border-dashed border-accent">
              <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🤔</span>
              </div>
              <p className="text-textMuted text-lg mb-4">
                No hacks yet for this question
              </p>
              <Link
                to={`/submit?question=${id}`}
                className="inline-block px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-all"
              >
                Be the first to share a solution
              </Link>
            </div>
          ) : (
            hacks.map((hack) => (
              <HackCard key={hack.id} hack={hack} onUpdate={fetchData} />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
