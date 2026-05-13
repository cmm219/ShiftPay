import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { AuthContext } from './authContextValue'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(() => !!supabase)

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
      let entityId = null
      if (data.role === 'worker') {
        const { data: worker } = await supabase
          .from('workers')
          .select('id')
          .eq('profile_id', userId)
          .maybeSingle()
        entityId = worker?.id || null
      } else if (data.role === 'restaurant') {
        const { data: restaurant } = await supabase
          .from('restaurants')
          .select('id')
          .eq('profile_id', userId)
          .maybeSingle()
        entityId = restaurant?.id || null
      }

      setProfile({
        ...data,
        worker_id: data.role === 'worker' ? entityId : null,
        restaurant_id: data.role === 'restaurant' ? entityId : null,
      })
    }
  }, [])

  useEffect(() => {
    // If Supabase is not configured, skip auth and render app in guest mode
    if (!supabase) {
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

  const signInWithPhone = async (phone) => {
    if (!supabase) return { data: null, error: { message: 'Supabase is not configured. Add credentials to .env.local' } }
    const { data, error } = await supabase.auth.signInWithOtp({
      phone,
    })
    return { data, error }
  }

  const verifyOtp = async (phone, token) => {
    if (!supabase) return { data: null, error: { message: 'Supabase is not configured. Add credentials to .env.local' } }
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    })
    return { data, error }
  }

  const signOut = async () => {
    if (!supabase) return { error: null }
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut, signInWithPhone, verifyOtp }}>
      {children}
    </AuthContext.Provider>
  )
}
