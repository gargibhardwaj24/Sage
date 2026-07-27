import { useEffect, useMemo, useRef, useState } from 'react'
import { ALL_CATEGORIES, searchEvents } from '@/lib/eventSearch'

const DEBOUNCE_MS = 220

export function useEventSearch(events, { status = 'ready', now = new Date() } = {}) {
  const [query, setQuery] = useState('')
  const [categoryId, setCategoryId] = useState(ALL_CATEGORIES)
  const [settled, setSettled] = useState('')

  const trimmed = query.trim()
  const nowRef = useRef(now)
  nowRef.current = now

  useEffect(() => {
    if (!trimmed) {
      setSettled('')
      return undefined
    }
    const timer = setTimeout(() => setSettled(trimmed), DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [trimmed])

  const eventsLoading = status === 'loading'
  const active = trimmed.length > 0
  const searching = active && (settled !== trimmed || eventsLoading)

  const results = useMemo(() => {
    if (!settled || eventsLoading) return []
    return searchEvents(events, settled, { categoryId, now: nowRef.current })
  }, [events, settled, categoryId, eventsLoading])

  const reset = () => {
    setQuery('')
    setSettled('')
    setCategoryId(ALL_CATEGORIES)
  }

  return {
    query,
    setQuery,
    categoryId,
    setCategoryId,
    results,
    searching,
    active,
    hasResults: results.length > 0,
    reset,
  }
}

export default useEventSearch
