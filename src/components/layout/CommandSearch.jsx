import { useEffect, useId, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CalendarSearch, CornerDownLeft, Search, Sparkles, X } from 'lucide-react'
import { ResultRow, ResultSkeleton } from '@/components/search/EventResultRow'
import { useEvents } from '@/store/EventsContext'
import { useEventDialog } from '@/store/DialogContext'
import { useEventSearch } from '@/hooks/useEventSearch'
import { DEFAULT_LIMIT } from '@/lib/eventSearch'
import { format, toDate } from '@/lib/date'
import { cn } from '@/lib/cn'

const MAX_ROWS = 6

export function CommandSearch() {
  const navigate = useNavigate()
  const location = useLocation()
  const { events, status } = useEvents()
  const dialog = useEventDialog()
  const search = useEventSearch(events, { status })

  const [open, setOpen] = useState(false)
  const [index, setIndex] = useState(0)
  const inputRef = useRef(null)
  const rootRef = useRef(null)
  const listId = useId()

  const rows = search.results.slice(0, MAX_ROWS)
  const atLimit = search.results.length >= DEFAULT_LIMIT
  const askIndex = rows.length
  const optionCount = rows.length + 1
  const showPanel = search.active && open
  const optionId = (i) => `${listId}-opt-${i}`

  useEffect(() => setIndex(0), [search.results])

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(true)
        inputRef.current?.focus()
        inputRef.current?.select()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (!showPanel) return undefined
    const onPointer = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    return () => document.removeEventListener('mousedown', onPointer)
  }, [showPanel])

  const dismiss = () => {
    setOpen(false)
    search.reset()
    inputRef.current?.blur()
  }

  const openResult = (event) => {
    const params = new URLSearchParams(
      location.pathname === '/calendar' ? location.search : ''
    )
    params.set('date', format(toDate(event.start), 'yyyy-MM-dd'))
    dismiss()
    navigate({ pathname: '/calendar', search: `?${params.toString()}` })
    if (event.source !== 'holiday') dialog.openEdit(event)
  }

  const askSage = () => {
    const prompt = search.query.trim()
    if (!prompt) return
    dismiss()
    navigate('/assistant', { state: { prompt, at: Date.now() } })
  }

  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      search.query ? dismiss() : inputRef.current?.blur()
      return
    }

    if (!showPanel) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setIndex((i) => (i + 1) % optionCount)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setIndex((i) => (i - 1 + optionCount) % optionCount)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (search.searching) return
      index < rows.length ? openResult(rows[index]) : askSage()
    } else if (e.key === 'Tab') {
      setOpen(false)
    }
  }

  return (
    <div ref={rootRef} className="relative min-w-0 flex-1 sm:max-w-md">
      <div
        className={cn(
          'surface-inset flex items-center gap-2.5 rounded-full px-4 py-2.5',
          'transition-colors duration-200 ease-expo focus-within:border-[rgb(var(--accent))]'
        )}
      >
        <Search size={15} strokeWidth={2} className="shrink-0 text-faint" />
        <input
          ref={inputRef}
          value={search.query}
          onChange={(e) => {
            search.setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search events or ask Sage…"
          aria-label="Search events or ask the assistant"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={showPanel ? listId : undefined}
          aria-activedescendant={showPanel && !search.searching ? optionId(index) : undefined}
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent text-body-md text-ink placeholder:text-faint focus:outline-none"
        />
        {search.active ? (
          <button
            type="button"
            onClick={dismiss}
            aria-label="Clear search"
            className="shrink-0 rounded-full p-0.5 text-faint transition-colors hover:text-ink"
          >
            <X size={14} strokeWidth={2.4} />
          </button>
        ) : (
          <kbd className="hidden shrink-0 rounded-md border px-1.5 py-0.5 font-mono text-[10px] text-faint sm:block">
            ⌘K
          </kbd>
        )}
      </div>

      {showPanel ? (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          className="surface-card absolute inset-x-0 top-full z-40 mt-2 overflow-hidden rounded-card"
        >
          <div className="max-h-[20rem] overflow-y-auto">
            {search.searching ? (
              <div role="status" aria-live="polite">
                <span className="sr-only">Searching your events…</span>
                {[0, 1, 2].map((i) => (
                  <ResultSkeleton key={i} index={i} />
                ))}
              </div>
            ) : (
              <div id={listId} role="listbox" aria-label="Search results">
                {rows.map((event, i) => (
                  <ResultRow
                    key={event.id}
                    id={optionId(i)}
                    event={event}
                    active={i === index}
                    onHover={() => setIndex(i)}
                    onSelect={openResult}
                    now={new Date()}
                  />
                ))}

                {rows.length ? null : (
                  <div className="flex flex-col items-center gap-1.5 px-4 py-6 text-center">
                    <CalendarSearch size={20} strokeWidth={1.8} className="text-faint" />
                    <p className="text-body-md font-medium text-ink">
                      No events match “{search.query.trim()}”
                    </p>
                    <p className="text-label-sm text-faint">Ask Sage instead — it can plan it.</p>
                  </div>
                )}

                <button
                  type="button"
                  id={optionId(askIndex)}
                  role="option"
                  aria-selected={index === askIndex}
                  onMouseMove={() => setIndex(askIndex)}
                  onClick={askSage}
                  className={cn(
                    'flex w-full items-center gap-3 border-t border-[rgb(var(--line))] px-3 py-2.5 text-left transition-colors',
                    'hover:bg-[rgb(var(--card-high))] focus-visible:outline-none',
                    index === askIndex && 'bg-[rgb(var(--card-high))]'
                  )}
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent-soft">
                    <Sparkles size={14} strokeWidth={2} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-body-md font-medium text-ink">
                      Ask Sage “{search.query.trim()}”
                    </span>
                    <span className="mt-0.5 block text-label-sm text-faint">
                      Plan it, reschedule it, or ask about your week
                    </span>
                  </span>
                  <CornerDownLeft size={13} strokeWidth={2.2} className="shrink-0 text-faint" />
                </button>
              </div>
            )}
          </div>

          {!search.searching && rows.length ? (
            <div className="flex items-center justify-between gap-3 border-t border-[rgb(var(--line))] px-3 py-2">
              <p className="eyebrow">
                {search.results.length > rows.length
                  ? `Showing ${rows.length} of ${search.results.length}${atLimit ? '+' : ''}`
                  : `${rows.length} result${rows.length === 1 ? '' : 's'}`}
              </p>
              <p className="text-label-sm text-faint">↑↓ to move · ⏎ to open</p>
            </div>
          ) : null}
        </motion.div>
      ) : null}
    </div>
  )
}

export default CommandSearch
