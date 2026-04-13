import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nhhmnfvaoouveimlevlz.supabase.co'
const supabaseAnonKey = 'sb_publishable_SrHl3QZgE5xR3ne5US4cUg_QyGHPGPz'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)