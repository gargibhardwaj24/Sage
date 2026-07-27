import { Plus, Settings2 } from 'lucide-react'
import ThemeToggle from './ThemeToggle'
import NotificationBell from './NotificationBell'
import CommandSearch from './CommandSearch'
import Button from '@/components/ui/Button'
import { format } from '@/lib/date'

export function Topbar({ onNewEvent, onOpenSettings }) {
  return (
    <header className="sticky top-0 z-20 -mx-4 mb-8 bg-[rgb(var(--canvas))]/85 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6">
      <div className="flex items-center gap-3">
        <CommandSearch />

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
