export type Profile = {
  id: string
  username: string | null
  created_at: string
}

export type Question = {
  id: string
  title: string
  category: string
  description: string | null
  created_at: string
}

export type Hack = {
  id: string
  question_id: string
  title: string
  description: string
  why_it_works: string | null
  use_when: string | null
  avoid_when: string | null
  age_range: string | null
  time_cost: string | null
  money_cost: string | null
  intensity: string | null
  upvotes: number
  created_at: string
  question?: Question
  user_has_voted?: boolean
  user_has_saved?: boolean
}

export type HackVote = {
  id: string
  hack_id: string
  user_id: string
  created_at: string
}

export type SavedHack = {
  user_id: string
  hack_id: string
  created_at: string
}

export type HackSubmission = {
  id: string
  user_id: string | null
  question_id: string | null
  title: string | null
  description: string | null
  why_it_works: string | null
  created_at: string
  status: string
}
