import { useEffect, useMemo, useRef, useState } from 'react'
import { holidaysForYears, isYearCovered } from '@/data/holidays'
import { HOLIDAY_CATEGORY } from '@/data/categories'
import { hasCalendarificKey, loadHolidayYear } from '@/lib/holidaysApi'
import { atTime, iso } from '@/lib/date'

const COUNTRY = 'IN'

const parseDay = (value) => {
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function toHolidayEvents(entries) {
  return entries.map((entry) => {
    const day = parseDay(entry.date)
    const start = atTime(day, 0, 0)
    const end = atTime(day, 23, 59)

    return {
      id: `holiday-${entry.date}-${entry.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`,
      title: entry.name,
      notes: entry.approximate ? 'Date may shift with the moon sighting.' : '',
      categoryId: HOLIDAY_CATEGORY,
      start: iso(start),
      end: iso(end),
      completed: false,
      reminderMinutes: null,
      priority: null,
      method: null,
      source: 'holiday',
      allDay: true,
      holidayType: entry.type,
      createdAt: iso(start),
    }
  })
}

export const buildHolidayEvents = (years) => toHolidayEvents(holidaysForYears(years))

export function useHolidays(enabled = true, reference = new Date()) {
  const year = reference.getFullYear()
  const years = useMemo(() => [year - 1, year, year + 1], [year])

  const bundled = useMemo(() => (enabled ? buildHolidayEvents(years) : []), [enabled, years])

  const [remote, setRemote] = useState(null)
  const [source, setSource] = useState(hasCalendarificKey() ? 'loading' : 'bundled')
  const requested = useRef('')

  useEffect(() => {
    if (!enabled || !hasCalendarificKey()) {
      setSource('bundled')
      setRemote(null)
      return undefined
    }

    const token = years.join(',')
    if (requested.current === token) return undefined
    requested.current = token

    const controller = new AbortController()
    let active = true
    setSource('loading')

    ;(async () => {
      const collected = []
      let usedNetwork = false
      let ok = 0

      for (const y of years) {
        try {
          const { holidays, source: from } = await loadHolidayYear(y, COUNTRY, controller.signal)
          collected.push(...holidays)
          if (from === 'api') usedNetwork = true
          ok += 1
        } catch {
          if (isYearCovered(y)) collected.push(...holidaysForYears([y]))
        }
      }

      if (!active) return

      if (!ok) {
        setRemote(null)
        setSource('bundled')
        return
      }

      const seen = new Set()
      const merged = collected.filter((h) => {
        const key = `${h.date}|${h.name}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })

      setRemote(toHolidayEvents(merged.sort((a, b) => a.date.localeCompare(b.date))))
      setSource(usedNetwork ? 'api' : 'cache')
    })()

    return () => {
      active = false
      controller.abort()
    }
  }, [enabled, years])

  const holidays = enabled ? (remote ?? bundled) : []

  return { holidays, source: enabled ? source : 'off' }
}

export const holidayCoverage = (reference = new Date()) => {
  const year = reference.getFullYear()
  return { year, covered: isYearCovered(year) }
}

export default useHolidays
