import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const forceMockData = import.meta.env.VITE_FORCE_MOCK_DATA === 'true'

const isConfigured =
  !forceMockData &&
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your-supabase') &&
  !supabaseAnonKey.includes('your-supabase')

export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null
