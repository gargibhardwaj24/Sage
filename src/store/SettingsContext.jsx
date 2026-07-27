import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { storage } from '@/lib/storage'
import { isSupabaseConfigured } from '@/lib/supabase'
import { fetchProfile, saveSettings } from '@/lib/repository'
import { useAuth } from '@/store/AuthContext'
import { setCustomCategories } from '@/data/categories'
import { resolveDisplayName } from '@/lib/identity'

const SettingsContext = createContext(null)

export const DEFAULT_SETTINGS = {
  userName: '',
  activeMethod: 'deep-work',
  workStartHour: 7,
  workEndHour: 22,
  focusTargetHours: 20,
  remindersEnabled: true,
  aiEnabled: true,
  geminiApiKey: '',
  geminiModel: 'gemini-3.6-flash',
  showHolidays: true,
  customCategories: [],
}

const LOCAL_ONLY = new Set(['geminiApiKey'])

const stripLocalOnly = (settings) => {
  const out = {}
  for (const [k, v] of Object.entries(settings)) {
    if (!LOCAL_ONLY.has(k)) out[k] = v
  }
  return out
}


export function SettingsProvider({ children }) {
  const { userId, user, isGuest, loading: authLoading } = useAuth()
  const remote = isSupabaseConfigured && Boolean(userId)

  const [settings, setSettings] = useState(() => ({
    ...DEFAULT_SETTINGS,
    ...(isSupabaseConfigured ? {} : (storage.get('settings') ?? {})),
  }))
  const [hydrated, setHydrated] = useState(!isSupabaseConfigured)

  const hydratedRef = useRef(hydrated)
  hydratedRef.current = hydrated

  useEffect(() => {
    if (!isSupabaseConfigured || authLoading) return
    if (!userId) {
      setHydrated(false)
      return
    }

    let active = true
    ;(async () => {
      const profile = await fetchProfile(userId).catch(() => null)
      if (!active) return

      setSettings((current) => ({
        ...DEFAULT_SETTINGS,
        ...(profile?.settings ?? {}),
        geminiApiKey: current.geminiApiKey,
        userName: profile?.settings?.userName || resolveDisplayName(user, profile),
      }))
      setHydrated(true)
    })()

    return () => {
      active = false
    }
  }, [userId, user, authLoading])

  useLayoutEffect(() => {
    setCustomCategories(settings.customCategories)
  }, [settings.customCategories])

  useEffect(() => {
    if (isSupabaseConfigured) return
    storage.set('settings', settings)
  }, [settings])

  useEffect(() => {
    if (!remote || !hydrated) return undefined
    const timer = setTimeout(() => {
      saveSettings(userId, stripLocalOnly(settings), settings.userName).catch(() => {})
    }, 600)
    return () => clearTimeout(timer)
  }, [remote, hydrated, settings, userId])

  const update = useCallback((patch) => {
    setSettings((s) => ({ ...s, ...patch }))
  }, [])

  const reset = useCallback(() => setSettings(DEFAULT_SETTINGS), [])

  const value = useMemo(
    () => ({ settings, update, reset, hydrated, isGuest }),
    [settings, update, reset, hydrated, isGuest]
  )

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used inside <SettingsProvider>')
  return ctx
}
