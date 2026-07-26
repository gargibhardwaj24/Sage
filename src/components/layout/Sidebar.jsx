import { useMemo } from 'react'
import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Flame, LogOut, Settings } from 'lucide-react'
import { NAV_ITEMS } from './navigation'
import { cn } from '@/lib/cn'
import { useEvents } from '@/store/EventsContext'
import { useAuth } from '@/store/AuthContext'
import { streaks } from '@/lib/analytics'

export function Sidebar({ onOpenSettings }) {
  const { events } = useEvents()
  const { configured, isGuest, isDemo, user, signOut } = useAuth()
  const streak = useMemo(() => streaks(events), [events])

  return (
    <aside className="surface-flush fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r px-4 py-6 lg:flex">
      <Brand />

      <nav className="mt-10 flex flex-1 flex-col gap-0.5">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className="group">
            {({ isActive }) => (
              <span
                className={cn(
                  'relative flex items-center gap-3 rounded-full px-4 py-2.5 text-body-md transition-colors duration-200 ease-expo',
                  isActive ? 'font-medium text-ink' : 'text-muted hover:text-ink'
                )}
              >
                {isActive ? (
                  <motion.span
                    layoutId="nav-pill"
                    transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                    className="absolute inset-0 rounded-full bg-[rgb(var(--card-high))]"
                  />
                ) : null}
                <item.icon size={17} strokeWidth={1.9} className="relative z-10 shrink-0" />
                <span className="relative z-10 flex-1 truncate">{item.label}</span>
                {item.accent ? (
                  <span
                    className={cn(
                      'relative z-10 h-1.5 w-1.5 rounded-full bg-[rgb(var(--accent))] transition-opacity',
                      isActive ? 'opacity-100' : 'opacity-70'
                    )}
                  />
                ) : null}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <StreakBlock current={streak.current} longest={streak.longest} />

      <button
        type="button"
        onClick={onOpenSettings}
        className="mt-2 flex items-center gap-3 rounded-full px-4 py-2.5 text-body-md text-muted transition-colors hover:text-ink"
      >
        <Settings size={17} strokeWidth={1.9} />
        Settings
      </button>

      {configured ? (
        <button
          type="button"
          onClick={signOut}
          className="flex items-center gap-3 rounded-full px-4 py-2.5 text-body-md text-muted transition-colors hover:text-ink"
        >
          <LogOut size={17} strokeWidth={1.9} />
          <span className="min-w-0 flex-1 truncate text-left">
            {isGuest || isDemo ? 'End demo' : 'Sign out'}
          </span>
          {!isGuest && user?.email ? (
            <span className="sr-only">{user.email}</span>
          ) : null}
        </button>
      ) : null}
    </aside>
  )
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5 px-2">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary">
        <svg viewBox="0 0 64 64" className="h-4 w-4" aria-hidden="true">
          <rect
            x="14"
            y="20"
            width="36"
            height="30"
            rx="8"
            fill="none"
            stroke="currentColor"
            strokeWidth="5"
          />
          <path d="M20 14v8M44 14v8" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
          <path
            d="M23 37.5l5.5 5.5L42 30"
            fill="none"
            stroke="currentColor"
            strokeWidth="5.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <p className="text-headline-md font-semibold tracking-tight text-ink">Sage</p>
    </div>
  )
}

function StreakBlock({ current, longest }) {
  return (
    <div className="surface-inset rounded-card p-4">
      <div className="flex items-center gap-2">
        <Flame size={14} strokeWidth={2} className="text-accent" />
        <p className="eyebrow">Current streak</p>
      </div>
      <p className="mt-2 text-headline font-semibold tracking-tight text-ink">
        {current}
        <span className="ml-1 text-body-md font-normal text-muted">
          day{current === 1 ? '' : 's'}
        </span>
      </p>
      <p className="mt-1.5 text-label-sm leading-relaxed text-faint">
        {current >= longest && current > 0
          ? "Your best run yet. Don't miss twice."
          : `Personal best is ${longest} days.`}
      </p>
    </div>
  )
}

export default Sidebar
