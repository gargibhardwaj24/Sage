import { useCallback, useEffect, useRef, useState } from 'react'
import { HOUR_HEIGHT } from '@/components/calendar/constants'
import { addMinutes, durationMinutes, SLOT_MINUTES, startOfDay, toDate } from '@/lib/date'

const DAY_MINUTES = 24 * 60

export const toClipboardEntry = (event) => ({
  title: event.title,
  categoryId: event.categoryId,
  notes: event.notes ?? '',
  reminderMinutes: event.reminderMinutes ?? null,
  priority: event.priority ?? null,
  method: event.method ?? null,
  minutes: Math.max(5, durationMinutes(event.start, event.end)),
  clockMinutes: (() => {
    const d = toDate(event.start)
    return d.getHours() * 60 + d.getMinutes()
  })(),
})

export function useEventClipboard() {
  const [entry, setEntry] = useState(null)
  const pointer = useRef({ x: 0, y: 0, seen: false })

  useEffect(() => {
    const onMove = (e) => {
      pointer.current = { x: e.clientX, y: e.clientY, seen: true }
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  const elementAtCursor = useCallback(() => {
    if (!pointer.current.seen) return null
    return document.elementFromPoint(pointer.current.x, pointer.current.y)
  }, [])

  const eventIdAtCursor = useCallback(() => {
    const holder = elementAtCursor()?.closest('[data-event-id]')
    return holder?.dataset.eventId ?? null
  }, [elementAtCursor])

  const slotAtCursor = useCallback(() => {
    const column = elementAtCursor()?.closest('[data-day-key]')
    if (!column) return null

    const rect = column.getBoundingClientRect()
    if (rect.height <= 0) return null

    const rawMinutes = ((pointer.current.y - rect.top) / HOUR_HEIGHT) * 60
    const snapped = Math.round(rawMinutes / SLOT_MINUTES) * SLOT_MINUTES
    const clamped = Math.max(0, Math.min(DAY_MINUTES - SLOT_MINUTES, snapped))

    const day = new Date(`${column.dataset.dayKey}T00:00:00`)
    if (Number.isNaN(day.getTime())) return null

    return addMinutes(startOfDay(day), clamped)
  }, [elementAtCursor])

  const copy = useCallback((event) => {
    if (!event) return null
    const next = toClipboardEntry(event)
    setEntry(next)
    return next
  }, [])

  const clear = useCallback(() => setEntry(null), [])

  return { entry, copy, clear, eventIdAtCursor, slotAtCursor }
}

export default useEventClipboard
