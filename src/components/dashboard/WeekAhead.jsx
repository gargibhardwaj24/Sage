import { Link } from 'react-router-dom'
import { ChevronRight, CalendarRange } from 'lucide-react'
import { MotionCard, CardHeader } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { categoryHex } from '@/data/categories'
import { useTheme } from '@/store/ThemeContext'
import { eventsOnDay } from '@/lib/schedule'
import { durationMinutes, format, isToday, weekDays } from '@/lib/date'
import { cn } from '@/lib/cn'

const MAX_DOTS = 5

export function WeekAhead({ events, anchor, onSelectDay, delay = 0 }) {
  const { isDark } = useTheme()
  const days = weekDays(anchor)

  const loads = days.map((day) => {
    const list = eventsOnDay(events, day)
    return {
      day,
      list,
      hours: list.reduce((n, e) => n + durationMinutes(e.start, e.end), 0) / 60,
    }
  })
  const maxHours = Math.max(1, ...loads.map((l) => l.hours))

  return (
    <MotionCard delay={delay} className="p-5 sm:p-6">
      <CardHeader
        icon={CalendarRange}
        title="This week"
        subtitle={`${format(days[0], 'MMM d')} – ${format(days[6], 'MMM d')}`}
        action={
          <Button as={Link} to="/calendar?view=week" variant="ghost" size="xs">
            Week view
            <ChevronRight size={13} strokeWidth={2.8} />
          </Button>
        }
      />

      <div className="mt-5 grid grid-cols-7 gap-1.5 sm:gap-2">
        {loads.map(({ day, list, hours }) => {
          const today = isToday(day)
          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onSelectDay?.(day)}
              className={cn(
                'group flex flex-col items-center gap-2 rounded-xl px-1 py-3 transition',
                today
                  ? 'bg-[rgb(var(--accent))]/[0.08]'
                  : 'hover:bg-[rgb(var(--card-high))]'
              )}
            >
              <span
                className={cn(
                  'text-[9.5px] font-medium uppercase tracking-widest',
                  today ? 'text-accent' : 'text-faint'
                )}
              >
                {format(day, 'EEEEE')}
              </span>
              <span
                className={cn(
                  'grid h-7 w-7 place-items-center rounded-xl text-[13px] font-semibold',
                  today
                    ? 'bg-primary'
                    : 'text-ink'
                )}
              >
                {format(day, 'd')}
              </span>

              <span className="h-8 w-1.5 overflow-hidden rounded-full bg-[rgb(var(--line))]">
                <span
                  className="block w-full rounded-full bg-[rgb(var(--accent))] transition-all duration-700"
                  style={{ height: `${(hours / maxHours) * 100}%`, marginTop: `${100 - (hours / maxHours) * 100}%` }}
                />
              </span>

              <span className="flex h-1.5 items-center gap-[3px]">
                {list.slice(0, MAX_DOTS).map((e) => (
                  <span
                    key={e.id}
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: categoryHex(e.categoryId, isDark) }}
                  />
                ))}
              </span>

              <span className="font-mono text-[10px] font-medium tabular-nums text-faint">
                {list.length || '—'}
              </span>
            </button>
          )
        })}
      </div>
    </MotionCard>
  )
}

export default WeekAhead
