import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react'
import { storage } from '@/lib/storage'
import { logDev } from '@/lib/errors'
import { withRetry } from '@/lib/retry'
import { uuid } from '@/lib/id'
import { iso, toDate, addMinutes, durationMinutes } from '@/lib/date'
import { createSeedEvents } from '@/data/seed'
import { DEFAULT_CATEGORY } from '@/data/categories'
import { isSupabaseConfigured } from '@/lib/supabase'
import { useAuth } from '@/store/AuthContext'
import {
  fetchEvents,
  fetchProfile,
  hardDeleteAllEvents,
  insertEvents,
  markSeeded,
  restoreEvents,
  setCompleted,
  softDeleteEvents,
  updateEvent as updateEventRow,
} from '@/lib/repository'
import { consumeReseed } from '@/lib/demo'

const EventsContext = createContext(null)

const STORAGE_KEY = 'events.v1'
const UNDO_DEPTH = 25

export function normalizeEvent(draft) {
  const start = toDate(draft.start)
  const end = draft.end ? toDate(draft.end) : addMinutes(start, draft.durationMinutes ?? 60)

  return {
    id: draft.id ?? uuid(),
    title: (draft.title ?? 'Untitled').trim() || 'Untitled',
    notes: draft.notes ?? '',
    start: iso(start),
    end: iso(end > start ? end : addMinutes(start, 30)),
    categoryId: draft.categoryId ?? DEFAULT_CATEGORY,
    completed: Boolean(draft.completed),
    reminderMinutes: draft.reminderMinutes ?? null,
    priority: draft.priority ?? null,
    method: draft.method ?? null,
    source: draft.source ?? 'user',
    createdAt: draft.createdAt ?? iso(new Date()),
  }
}

const sortEvents = (list) => [...list].sort((a, b) => a.start.localeCompare(b.start))

function loadLocal() {
  const stored = storage.get(STORAGE_KEY)
  if (Array.isArray(stored) && stored.length) return sortEvents(stored.map(normalizeEvent))
  return sortEvents(createSeedEvents().map(normalizeEvent))
}

function reducer(state, action) {
  const commit = (events) => ({
    events: sortEvents(events),
    past: [...state.past, state.events].slice(-UNDO_DEPTH),
    status: state.status,
  })

  switch (action.type) {
    case 'hydrate':
      return { events: sortEvents(action.events), past: [], status: 'ready' }

    case 'status':
      return { ...state, status: action.status }

    case 'add':
      return commit([...state.events, normalizeEvent(action.event)])

    case 'addMany':
      return commit([...state.events, ...action.events.map(normalizeEvent)])

    case 'update':
      return commit(
        state.events.map((e) =>
          e.id === action.id ? normalizeEvent({ ...e, ...action.patch, id: e.id }) : e
        )
      )

    case 'remove':
      return commit(state.events.filter((e) => e.id !== action.id))

    case 'removeMany': {
      const ids = new Set(action.ids)
      return commit(state.events.filter((e) => !ids.has(e.id)))
    }

    case 'move':
      return commit(
        state.events.map((e) => {
          if (e.id !== action.id) return e
          const length = durationMinutes(e.start, e.end)
          const start = toDate(action.start)
          return { ...e, start: iso(start), end: iso(addMinutes(start, length)) }
        })
      )

    case 'toggleComplete':
      return commit(
        state.events.map((e) => (e.id === action.id ? { ...e, completed: !e.completed } : e))
      )

    case 'replaceAll':
      return commit(action.events.map(normalizeEvent))

    case 'reconcile': {
      const drop = new Set(action.ids)
      return {
        ...state,
        events: sortEvents([
          ...state.events.filter((e) => !drop.has(e.id)),
          ...action.events.map(normalizeEvent),
        ]),
      }
    }

    case 'rollbackAdd': {
      const drop = new Set(action.ids)
      return { ...state, events: state.events.filter((e) => !drop.has(e.id)) }
    }

    case 'undo': {
      if (!state.past.length) return state
      const past = [...state.past]
      const previous = past.pop()
      return { ...state, events: previous, past }
    }

    default:
      return state
  }
}

export function EventsProvider({ children }) {
  const { userId, isGuest, isDemo, loading: authLoading } = useAuth()
  const remote = isSupabaseConfigured && Boolean(userId)

  const [state, dispatch] = useReducer(reducer, undefined, () => ({
    events: isSupabaseConfigured ? [] : loadLocal(),
    past: [],
    status: isSupabaseConfigured ? 'loading' : 'ready',
  }))

  const { events, status } = state
  const [sync, setSync] = useState({ failures: 0, reverted: false })
  const [reload, setReload] = useState(0)

  const eventsRef = useRef(events)
  eventsRef.current = events

  const userIdRef = useRef(userId)
  userIdRef.current = userId

  const remoteRef = useRef(remote)
  remoteRef.current = remote

  useEffect(() => {
    if (isSupabaseConfigured) return
    storage.set(STORAGE_KEY, events)
  }, [events])

  useEffect(() => {
    if (!isSupabaseConfigured || authLoading) return
    if (!userId) {
      dispatch({ type: 'hydrate', events: [] })
      return
    }

    let active = true
    let retryTimer = null
    dispatch({ type: 'status', status: 'loading' })

    const load = async () => {
      const profile = await fetchProfile(userId).catch(() => null)
      let rows = await withRetry(() => fetchEvents(userId))

      if (isDemo && (consumeReseed() || rows.length === 0)) {
        if (rows.length) await hardDeleteAllEvents(userId)
        const seeds = createSeedEvents().map(normalizeEvent)
        rows = await insertEvents(seeds, userId)
        await markSeeded(userId).catch(() => {})
        return rows
      }

      if (isGuest && !rows.length && !profile?.seeded_at) {
        const seeds = createSeedEvents().map(normalizeEvent)
        rows = await insertEvents(seeds, userId)
        await markSeeded(userId).catch(() => {})
      }

      return rows
    }

    load()
      .then((rows) => {
        if (active) dispatch({ type: 'hydrate', events: rows })
      })
      .catch((error) => {
        logDev('hydrate', error?.message ?? error)
        if (!active) return
        dispatch({ type: 'status', status: 'error' })
        retryTimer = setTimeout(() => {
          if (active) setReload((n) => n + 1)
        }, 4000)
      })

    return () => {
      active = false
      if (retryTimer) clearTimeout(retryTimer)
    }
  }, [userId, isGuest, isDemo, authLoading, reload])

  const push = useCallback((work, options = {}) => {
    if (!remoteRef.current) return
    const uid = userIdRef.current

    Promise.resolve(work(uid))
      .then((result) => options.onSuccess?.(result))
      .catch((error) => {
        logDev('sync', error?.message ?? error)
        options.rollback?.()
        setSync((current) => ({ failures: current.failures + 1, reverted: Boolean(options.rollback) }))
      })
  }, [])

  const syncAdd = useCallback((optimistic) => {
    const ids = optimistic.map((e) => e.id)

    return {
      onSuccess: (rows) => {
        if (!Array.isArray(rows)) return
        const known = new Set(ids)
        const drifted = rows.length !== ids.length || rows.some((r) => !known.has(r.id))
        if (drifted) dispatch({ type: 'reconcile', ids, events: rows })
      },
      rollback: () => dispatch({ type: 'rollbackAdd', ids }),
    }
  }, [])

  const api = useMemo(
    () => ({
      addEvent: (event) => {
        const normalized = normalizeEvent(event)
        dispatch({ type: 'add', event: normalized })
        push((uid) => insertEvents([normalized], uid), syncAdd([normalized]))
        return normalized
      },
      addEvents: (list) => {
        const normalized = list.map(normalizeEvent)
        dispatch({ type: 'addMany', events: normalized })
        push((uid) => insertEvents(normalized, uid), syncAdd(normalized))
        return normalized
      },
      updateEvent: (id, patch) => {
        dispatch({ type: 'update', id, patch })
        const next = normalizeEvent({
          ...eventsRef.current.find((e) => e.id === id),
          ...patch,
          id,
        })
        push((uid) => updateEventRow(id, next, uid))
      },
      removeEvent: (id) => {
        dispatch({ type: 'remove', id })
        push((uid) => softDeleteEvents([id], uid))
      },
      removeEvents: (ids) => {
        dispatch({ type: 'removeMany', ids })
        push((uid) => softDeleteEvents(ids, uid))
      },
      moveEvent: (id, start) => {
        dispatch({ type: 'move', id, start })
        const current = eventsRef.current.find((e) => e.id === id)
        if (!current) return
        const length = durationMinutes(current.start, current.end)
        const next = { ...current, start: iso(toDate(start)), end: iso(addMinutes(toDate(start), length)) }
        push((uid) => updateEventRow(id, next, uid))
      },
      toggleComplete: (id) => {
        dispatch({ type: 'toggleComplete', id })
        const current = eventsRef.current.find((e) => e.id === id)
        if (!current) return
        push((uid) => setCompleted(id, !current.completed, uid))
      },
      replaceAll: (list) => dispatch({ type: 'replaceAll', events: list }),
      resetToSeed: () => {
        const seeds = createSeedEvents().map(normalizeEvent)
        const previousIds = eventsRef.current.map((e) => e.id)
        dispatch({ type: 'replaceAll', events: seeds })
        push(async (uid) => {
          if (previousIds.length) await softDeleteEvents(previousIds, uid)
          await insertEvents(seeds, uid)
        })
      },
      clearAll: () => {
        const previousIds = eventsRef.current.map((e) => e.id)
        dispatch({ type: 'replaceAll', events: [] })
        push((uid) => (previousIds.length ? softDeleteEvents(previousIds, uid) : null))
      },
      undo: () => {
        const before = eventsRef.current
        dispatch({ type: 'undo' })
        push(async (uid) => {
          const after = eventsRef.current
          const beforeIds = new Set(before.map((e) => e.id))
          const afterIds = new Set(after.map((e) => e.id))

          const restored = after.filter((e) => !beforeIds.has(e.id)).map((e) => e.id)
          const removed = before.filter((e) => !afterIds.has(e.id)).map((e) => e.id)
          const changed = after.filter((e) => {
            const prev = before.find((p) => p.id === e.id)
            return prev && JSON.stringify(prev) !== JSON.stringify(e)
          })

          if (restored.length) await restoreEvents(restored, uid)
          if (removed.length) await softDeleteEvents(removed, uid)
          for (const e of changed) await updateEventRow(e.id, e, uid)
        })
      },
      getEvents: () => eventsRef.current,
    }),
    [push, syncAdd]
  )

  const retry = useCallback(() => setReload((n) => n + 1), [])

  const value = useMemo(
    () => ({ events, status, sync, retry, canUndo: state.past.length > 0, remote, ...api }),
    [events, status, sync, retry, state.past.length, remote, api]
  )

  return <EventsContext.Provider value={value}>{children}</EventsContext.Provider>
}

export function useEvents() {
  const ctx = useContext(EventsContext)
  if (!ctx) throw new Error('useEvents must be used inside <EventsProvider>')
  return ctx
}
