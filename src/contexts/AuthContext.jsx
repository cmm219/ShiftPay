import { createContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (userId) => {
    if (!supabase) return
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching profile:', error.message)
      setProfile(null)
    } else {
      setProfile(data)
    }
  }, [])

  useEffect(() => {
    // If Supabase is not configured, skip auth and render app in guest mode
    if (!supabase) {
      setLoading(false)
      return
    }

    // Listen for auth state changes (INITIAL_SESSION fires on mount to hydrate)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user ?? null
        setUser(currentUser)

        if (currentUser) {
          await fetchProfile(currentUser.id)
        } else {
          setProfile(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [fetchProfile])

  const signUp = async ({ email, password, role, metadata = {} }) => {
    if (!supabase) return { data: null, error: { message: 'Supabase is not configured. Add credentials to .env.local' } }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role, ...metadata },
      },
    })
    return { data, error }
  }

  const signIn = async ({ email, password }) => {
    if (!supabase) return { data: null, error: { message: 'Supabase is not configured. Add credentials to .env.local' } }
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  }

  const signOut = async () => {
    if (!supabase) return { error: null }
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
