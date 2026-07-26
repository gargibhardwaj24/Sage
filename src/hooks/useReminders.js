import { useCallback, useEffect, useRef, useState } from 'react'
import { useEvents } from '@/store/EventsContext'
import { useSettings } from '@/store/SettingsContext'
import { toDate } from '@/lib/date'

const TICK_MS = 15_000

export function useReminders() {
  const { events } = useEvents()
  const { settings } = useSettings()

  const [active, setActive] = useState(null)
  const handled = useRef(new Set())
  const snoozedUntil = useRef(new Map())

  const eventsRef = useRef(events)
  eventsRef.current = events

  const activeRef = useRef(active)
  activeRef.current = active

  useEffect(() => {
    if (!settings.remindersEnabled) {
      setActive(null)
      return undefined
    }

    const check = () => {
      if (activeRef.current) return
      const now = Date.now()

      for (const event of eventsRef.current) {
        if (event.reminderMinutes == null || event.completed) continue

        const start = toDate(event.start).getTime()
        if (now > start) continue

        const snoozed = snoozedUntil.current.get(event.id)
        if (snoozed && now < snoozed) continue
        if (!snoozed && handled.current.has(event.id)) continue

        const dueAt = start - event.reminderMinutes * 60_000
        if (now < dueAt) continue

        handled.current.add(event.id)
        snoozedUntil.current.delete(event.id)
        setActive(event)
        return
      }
    }

    check()
    const timer = setInterval(check, TICK_MS)
    return () => clearInterval(timer)
  }, [settings.remindersEnabled])

  const dismiss = useCallback(() => setActive(null), [])

  const snooze = useCallback((minutes) => {
    const current = activeRef.current
    if (current) {
      snoozedUntil.current.set(current.id, Date.now() + minutes * 60_000)
      handled.current.delete(current.id)
    }
    setActive(null)
  }, [])

  return { active, dismiss, snooze }
}

export default useReminders
