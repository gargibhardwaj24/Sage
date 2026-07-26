import { useMemo, useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Bell, CircleAlert, Clock3 } from 'lucide-react'
import { categoryHex } from '@/data/categories'
import { useTheme } from '@/store/ThemeContext'
import { useEvents } from '@/store/EventsContext'
import { useNow } from '@/hooks/useNow'
import {
  addDays,
  differenceInMinutes,
  fmtRelativeDay,
  fmtTimeShort,
  startOfDay,
  toDate,
} from '@/lib/date'
import { conflictPairs } from '@/lib/schedule'

export function NotificationBell() {
  const { events } = useEvents()
  const { isDark } = useTheme()
  const navigate = useNavigate()
  const now = useNow(30_000)
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const items = useMemo(() => {
    const soon = events
      .filter((e) => {
        if (e.completed) return false
        const start = toDate(e.start)
        return start > now && start < addDays(now, 1)
      })
      .sort((a, b) => a.start.localeCompare(b.start))
      .slice(0, 4)
      .map((e) => ({
        id: `up-${e.id}`,
        kind: 'upcoming',
        title: e.title,
        detail: `${fmtRelativeDay(e.start)} at ${fmtTimeShort(e.start)} · in ${differenceInMinutes(toDate(e.start), now)} min`,
        categoryId: e.categoryId,
      }))

    const clashes = Array.from({ length: 7 }, (_, i) =>
      conflictPairs(events, addDays(startOfDay(now), i))
    )
      .flat()
      .slice(0, 3)
      .map(([a, b]) => ({
        id: `clash-${a.id}-${b.id}`,
        kind: 'conflict',
        title: `"${a.title}" overlaps "${b.title}"`,
        detail: `${fmtRelativeDay(a.start)} at ${fmtTimeShort(a.start)}`,
        categoryId: a.categoryId,
      }))

    return [...clashes, ...soon]
  }, [events, now])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications${items.length ? ` (${items.length})` : ''}`}
        aria-expanded={open}
        className="relative grid h-10 w-10 place-items-center rounded-xl text-muted transition-colors hover:bg-[rgb(var(--card-high))] hover:text-ink"
      >
        <Bell size={17} strokeWidth={1.9} />
        {items.length ? (
          <span className="absolute right-2 top-2 grid h-4 min-w-4 place-items-center rounded-full bg-[rgb(var(--accent))] px-1 font-mono text-[9px] font-semibold tabular-nums text-[rgb(var(--accent-ink))]">
            {items.length}
          </span>
        ) : null}
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="surface-raised absolute right-0 top-12 z-50 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-card"
          >
            <div className="border-b px-4 py-3">
              <p className="eyebrow">Needs attention</p>
            </div>

            {items.length ? (
              <ul className="max-h-80 overflow-y-auto p-1.5">
                {items.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false)
                        navigate(item.kind === 'conflict' ? '/calendar?view=week' : '/calendar?view=day')
                      }}
                      className="flex w-full items-start gap-2.5 rounded-xl px-2.5 py-2.5 text-left transition-colors hover:bg-[rgb(var(--card-high))]"
                    >
                      {item.kind === 'conflict' ? (
                        <CircleAlert
                          size={14}
                          strokeWidth={2.2}
                          className="mt-0.5 shrink-0 text-amber-500"
                        />
                      ) : (
                        <span
                          className="mt-1 h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: categoryHex(item.categoryId, isDark) }}
                        />
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-body-md text-ink">{item.title}</span>
                        <span className="mt-0.5 block truncate text-label-sm text-faint">
                          {item.detail}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center px-6 py-8 text-center">
                <Clock3 size={20} strokeWidth={1.8} className="text-faint" />
                <p className="mt-3 text-body-md text-ink">All clear</p>
                <p className="mt-1 text-label-sm text-muted">
                  No conflicts, nothing starting in the next day.
                </p>
              </div>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

export default NotificationBell
