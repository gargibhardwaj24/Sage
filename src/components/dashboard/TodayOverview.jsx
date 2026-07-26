import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CalendarDays, Check, ChevronRight, Clock3, Sparkles } from 'lucide-react'
import { MotionCard, CardHeader } from '@/components/ui/Card'
import EmptyState from '@/components/ui/EmptyState'
import Button from '@/components/ui/Button'
import { categoryHex, categoryInk, getCategory } from '@/data/categories'
import { useTheme } from '@/store/ThemeContext'
import { alpha } from '@/lib/color'
import { durationMinutes, fmtRange, humanDuration, toDate } from '@/lib/date'
import { cn } from '@/lib/cn'

export function TodayOverview({ events, now, onToggle, onOpen, onCreate, delay = 0 }) {
  const { isDark } = useTheme()
  const done = events.filter((e) => e.completed).length
  const scheduled = events.reduce((n, e) => n + durationMinutes(e.start, e.end), 0)
  const progress = events.length ? (done / events.length) * 100 : 0

  return (
    <MotionCard delay={delay} className="flex flex-col p-5 sm:p-6">
      <CardHeader
        icon={CalendarDays}
        title="Today"
        subtitle={
          events.length
            ? `${events.length} events · ${humanDuration(scheduled)} · ${done} done`
            : 'Nothing scheduled yet'
        }
        action={
          <Button as={Link} to="/calendar?view=day" variant="ghost" size="xs">
            Open
            <ChevronRight size={13} strokeWidth={2.8} />
          </Button>
        }
      />

      {events.length ? (
        <>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[rgb(var(--line))]">
            <motion.div
              className="h-full rounded-full bg-[rgb(var(--accent))]"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>

          <ul className="mt-4 space-y-1.5">
            {events.map((event) => {
              const hex = categoryHex(event.categoryId, isDark)
              const isNow = toDate(event.start) <= now && toDate(event.end) > now
              const isPast = toDate(event.end) <= now

              return (
                <li key={event.id}>
                  <div
                    className={cn(
                      'group flex items-center gap-3 rounded-xl px-2.5 py-2 transition',
                      'hover:bg-[rgb(var(--card-high))]',
                      isNow && 'bg-[rgb(var(--accent))]/[0.08]'
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => onToggle(event.id)}
                      aria-label={event.completed ? 'Mark as not done' : 'Mark as done'}
                      className={cn(
                        'grid h-6 w-6 shrink-0 place-items-center rounded-lg border-2 transition',
                        event.completed
                          ? 'border-transparent bg-emerald-500 text-white'
                          : 'border-[rgb(var(--line-strong))] text-transparent hover:border-[rgb(var(--accent))]'
                      )}
                    >
                      <Check size={13} strokeWidth={3.2} />
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpen(event)}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      <span className="h-8 w-1 shrink-0 rounded-full" style={{ backgroundColor: hex }} />
                      <span className="min-w-0 flex-1">
                        <span
                          className={cn(
                            'block truncate text-[13.5px] font-medium leading-tight text-ink',
                            event.completed && 'line-through opacity-55',
                            isPast && !event.completed && 'opacity-70'
                          )}
                        >
                          {event.title}
                        </span>
                        <span className="mt-0.5 block truncate text-[11px] font-semibold text-muted">
                          {fmtRange(event.start, event.end)}
                          {isNow ? ' · happening now' : ''}
                        </span>
                      </span>
                      <span
                        className="hidden shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium sm:block"
                        style={{
                          backgroundColor: alpha(hex, isDark ? 0.18 : 0.13),
                          color: categoryInk(event.categoryId, isDark),
                        }}
                      >
                        {getCategory(event.categoryId).short}
                      </span>
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        </>
      ) : (
        <EmptyState
          icon={Clock3}
          title="A completely open day"
          description="Rare and valuable. Claim a block before something else does."
          action={
            <Button variant="primary" size="sm" onClick={onCreate}>
              Add the first block
            </Button>
          }
        />
      )}
    </MotionCard>
  )
}

export function UnclaimedTimeCard({ slots, freeMinutes, onFill, delay = 0 }) {
  const biggest = slots.length ? slots.reduce((a, b) => (b.minutes > a.minutes ? b : a)) : null

  return (
    <MotionCard delay={delay} className="flex flex-col p-5">
      <p className="eyebrow">Unclaimed today</p>

      <p className="mt-3 text-headline-lg font-semibold leading-none tracking-tight text-ink">
        {humanDuration(freeMinutes)}
      </p>
      <p className="mt-2 text-body-md text-muted">
        {slots.length
          ? `Across ${slots.length} open gap${slots.length === 1 ? '' : 's'} inside your working window.`
          : 'Nothing left inside your working window today.'}
      </p>

      {biggest ? (
        <>
          <div className="mt-4 space-y-1.5">
            {slots.slice(0, 3).map((slot) => (
              <button
                key={slot.start.toISOString()}
                type="button"
                onClick={() => onFill?.(slot.start)}
                className="stripes surface-inset flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left transition hover:border-[rgb(var(--accent))]"
              >
                <span className="text-body-md text-ink">{fmtRange(slot.start, slot.end)}</span>
                <span className="shrink-0 text-label-sm text-faint">
                  {humanDuration(slot.minutes)}
                </span>
              </button>
            ))}
          </div>

          <Button
            variant="subtle"
            size="sm"
            className="mt-4 w-full justify-center"
            onClick={() => onFill?.(biggest.start)}
          >
            <Sparkles size={13} strokeWidth={2.2} />
            Claim the longest gap
          </Button>
        </>
      ) : null}
    </MotionCard>
  )
}

export default TodayOverview
