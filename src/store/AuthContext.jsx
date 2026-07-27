import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { demoCredentials, isDemoConfigured, isDemoUser, requestReseed } from '@/lib/demo'
import { hardDeleteAllEvents } from '@/lib/repository'
import { clearCache, clearOutbox } from '@/lib/eventCache'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    if (!isSupabaseConfigured) return undefined

    let active = true

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session ?? null)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next ?? null)
      setLoading(false)
    })

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const signIn = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }, [])

  const signUp = useCallback(async (email, password, displayName) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    })
    if (error) throw error
  }, [])

  const signInAsGuest = useCallback(async () => {
    const { error } = await supabase.auth.signInAnonymously()
    if (error) throw error
  }, [])

  const signInAsDemo = useCallback(async () => {
    if (!isDemoConfigured) {
      throw new Error('demo_unavailable')
    }
    const { email, password } = demoCredentials()
    requestReseed()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }, [])

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) throw error
  }, [])

  const signOut = useCallback(async () => {
    const current = session?.user
    if (isDemoUser(current)) {
      await hardDeleteAllEvents(current.id).catch(() => {})
    }
    if (current?.id) {
      clearCache(current.id)
      clearOutbox(current.id)
    }
    await supabase.auth.signOut()
  }, [session])

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      userId: session?.user?.id ?? null,
      isGuest: session?.user?.is_anonymous ?? false,
      isDemo: isDemoUser(session?.user),
      demoAvailable: isDemoConfigured,
      loading,
      configured: isSupabaseConfigured,
      signIn,
      signUp,
      signInAsGuest,
      signInAsDemo,
      signInWithGoogle,
      signOut,
    }),
    [session, loading, signIn, signUp, signInAsGuest, signInAsDemo, signInWithGoogle, signOut]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
