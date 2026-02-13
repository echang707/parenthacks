import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zvbanjslctecsfblxnyo.supabase.co'
const supabaseAnonKey = 'sb_publishable_ArwISLPWGsTEdwmYIIAssg_UP4NdtIv'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
