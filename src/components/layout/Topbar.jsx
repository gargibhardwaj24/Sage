import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Settings2 } from 'lucide-react'
import ThemeToggle from './ThemeToggle'
import NotificationBell from './NotificationBell'
import Button from '@/components/ui/Button'
import { format } from '@/lib/date'
import { cn } from '@/lib/cn'

export function Topbar({ onNewEvent, onOpenSettings }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const submit = (e) => {
    e.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return
    navigate('/assistant', { state: { prompt: trimmed, at: Date.now() } })
    setQuery('')
    inputRef.current?.blur()
  }

  return (
    <header className="sticky top-0 z-20 -mx-4 mb-8 bg-[rgb(var(--canvas))]/85 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6">
      <div className="flex items-center gap-3">
        <form onSubmit={submit} className="min-w-0 flex-1 sm:max-w-md">
          <div
            className={cn(
              'surface-inset flex items-center gap-2.5 rounded-full px-4 py-2.5',
              'transition-colors duration-200 ease-expo focus-within:border-[rgb(var(--accent))]'
            )}
          >
            <Search size={15} strokeWidth={2} className="shrink-0 text-faint" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask Sage or type a command…"
              aria-label="Ask the assistant"
              className="min-w-0 flex-1 bg-transparent text-body-md text-ink placeholder:text-faint focus:outline-none"
            />
            {query ? (
              <button
                type="submit"
                className="shrink-0 rounded-full bg-accent px-2.5 py-1 text-label-sm font-semibold"
              >
                Ask
              </button>
            ) : (
              <kbd className="hidden shrink-0 rounded-md border px-1.5 py-0.5 font-mono text-[10px] text-faint sm:block">
                ⌘K
              </kbd>
            )}
          </div>
        </form>

        <div className="ml-auto hidden text-right md:block">
          <p className="text-label-sm font-medium text-ink">Today</p>
          <p className="eyebrow mt-1">{format(new Date(), 'MMM d, yyyy')}</p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onOpenSettings}
            aria-label="Preferences"
            title="Preferences"
            className="grid h-10 w-10 place-items-center rounded-xl text-muted transition-colors hover:bg-[rgb(var(--card-high))] hover:text-ink lg:hidden"
          >
            <Settings2 size={17} strokeWidth={1.9} />
          </button>
          <NotificationBell />
          <ThemeToggle />
          <Button variant="primary" size="md" onClick={onNewEvent} className="hidden sm:inline-flex">
            <Plus size={16} strokeWidth={2.2} />
            New event
          </Button>
          <Button
            variant="primary"
            size="icon"
            onClick={onNewEvent}
            aria-label="New event"
            className="sm:hidden"
          >
            <Plus size={17} strokeWidth={2.2} />
          </Button>
        </div>
      </div>
    </header>
  )
}

export default Topbar
