import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { CalendarSearch, PartyPopper, Search, X } from 'lucide-react'
import { Select } from '@/components/ui/Field'
import { categoryHex, categoryInk, getCategory } from '@/data/categories'
import { useCategories } from '@/hooks/useCategories'
import { useTheme } from '@/store/ThemeContext'
import { alpha } from '@/lib/color'
import { ALL_CATEGORIES } from '@/lib/eventSearch'
import { fmtDay, fmtRange, isSameDay, toDate } from '@/lib/date'
import { cn } from '@/lib/cn'

function ResultSkeleton({ index }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5" aria-hidden="true">
      <span className="h-8 w-1 shrink-0 animate-pulse rounded-full bg-[rgb(var(--line-strong))]" />
      <span className="min-w-0 flex-1 space-y-1.5">
        <span
          className="block h-3 animate-pulse rounded bg-[rgb(var(--line-strong))]"
          style={{ width: `${58 - index * 9}%` }}
        />
        <span
          className="block h-2.5 animate-pulse rounded bg-[rgb(var(--line))]"
          style={{ width: `${38 - index * 6}%` }}
        />
      </span>
      <span className="h-4 w-14 shrink-0 animate-pulse rounded-full bg-[rgb(var(--line))]" />
    </div>
  )
}

function ResultRow({ event, onSelect, now }) {
  const { isDark } = useTheme()
  const hex = categoryHex(event.categoryId, isDark)
  const isHoliday = event.source === 'holiday'
  const start = toDate(event.start)

  return (
    <button
      type="button"
      onClick={() => onSelect(event)}
      className={cn(
        'flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors',
        'hover:bg-[rgb(var(--card-high))] focus-visible:bg-[rgb(var(--card-high))] focus-visible:outline-none'
      )}
    >
      <span className="h-8 w-1 shrink-0 rounded-full" style={{ backgroundColor: hex }} />

      <span className="min-w-0 flex-1">
        <span
          className={cn(
            'block truncate text-body-md font-medium text-ink',
            event.completed && 'line-through opacity-60'
          )}
        >
          {event.title}
        </span>
        <span className="mt-0.5 flex items-center gap-1.5 text-label-sm text-faint">
          {isHoliday ? <PartyPopper size={11} strokeWidth={2.2} /> : null}
          {fmtDay(start)}
          {isSameDay(start, now) ? ' · today' : ''}
          {isHoliday ? ' · all day' : ` · ${fmtRange(event.start, event.end)}`}
        </span>
      </span>

      <span
        className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
        style={{ backgroundColor: alpha(hex, isDark ? 0.22 : 0.14), color: categoryInk(event.categoryId, isDark) }}
      >
        {getCategory(event.categoryId).short}
      </span>
    </button>
  )
}

export function EventSearch({
  query,
  onQueryChange,
  categoryId,
  onCategoryChange,
  results,
  searching,
  active,
  onSelect,
  onReset,
  now = new Date(),
}) {
  const categories = useCategories()
  const inputRef = useRef(null)

  useEffect(() => {
    const onKey = (e) => {
      const target = e.target
      const tag = target?.tagName
      const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target?.isContentEditable

      if (e.key === '/' && !typing && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        inputRef.current?.focus()
      }
      if (e.key === 'Escape' && document.activeElement === inputRef.current) {
        onReset()
        inputRef.current?.blur()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onReset])

  return (
    <div className="relative">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="surface-card flex min-w-0 flex-1 items-center gap-2.5 rounded-full px-4 py-2.5">
          <Search size={15} strokeWidth={2} className="shrink-0 text-faint" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search events by name, note or area…"
            aria-label="Search events"
            role="searchbox"
            className="min-w-0 flex-1 bg-transparent text-body-md text-ink placeholder:text-faint focus:outline-none"
          />
          {active ? (
            <button
              type="button"
              onClick={onReset}
              aria-label="Clear search"
              className="shrink-0 rounded-full p-0.5 text-faint transition-colors hover:text-ink"
            >
              <X size={14} strokeWidth={2.4} />
            </button>
          ) : (
            <kbd className="hidden shrink-0 rounded-md border px-1.5 py-0.5 font-mono text-[10px] text-faint sm:block">
              /
            </kbd>
          )}
        </div>

        <Select
          value={categoryId}
          onChange={(e) => onCategoryChange(e.target.value)}
          aria-label="Filter results by area"
          className="h-11 w-full rounded-full sm:w-44"
        >
          <option value={ALL_CATEGORIES}>All areas</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>

      {active ? (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          className="surface-card absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-card"
        >
          <div className="flex items-center justify-between gap-3 border-b border-[rgb(var(--line))] px-3 py-2">
            <p className="eyebrow">
              {searching ? 'Searching…' : `${results.length} result${results.length === 1 ? '' : 's'}`}
            </p>
            {!searching && results.length ? (
              <p className="text-label-sm text-faint">Enter to open the first</p>
            ) : null}
          </div>

          <div className="max-h-[22rem] overflow-y-auto">
            {searching ? (
              <div role="status" aria-live="polite">
                <span className="sr-only">Searching your events…</span>
                {[0, 1, 2].map((i) => (
                  <ResultSkeleton key={i} index={i} />
                ))}
              </div>
            ) : results.length ? (
              <div role="listbox" aria-label="Search results">
                {results.map((event) => (
                  <ResultRow key={event.id} event={event} onSelect={onSelect} now={now} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1.5 px-4 py-8 text-center">
                <CalendarSearch size={20} strokeWidth={1.8} className="text-faint" />
                <p className="text-body-md font-medium text-ink">No events match “{query.trim()}”</p>
                <p className="text-label-sm text-faint">
                  Try a different word, or widen the area filter.
                </p>
              </div>
            )}
          </div>
        </motion.div>
      ) : null}
    </div>
  )
}

export default EventSearch
