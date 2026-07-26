import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Check, CircleAlert, ListChecks } from 'lucide-react'
import { MotionCard, CardHeader } from '@/components/ui/Card'
import EmptyState from '@/components/ui/EmptyState'
import { categoryHex } from '@/data/categories'
import { useTheme } from '@/store/ThemeContext'
import { addDays, fmtRelativeDay, fmtTimeShort, startOfDay, toDate } from '@/lib/date'
import { cn } from '@/lib/cn'

export function ActionItems({ events, now, onToggle, onOpen, delay = 0 }) {
  const { isDark } = useTheme()

  const { items, overdue, dueToday, doneToday } = useMemo(() => {
    const horizon = addDays(startOfDay(now), 2)
    const open = events.filter(
      (e) => !e.completed && toDate(e.start) < horizon && toDate(e.end) > addDays(now, -7)
    )

    const withState = open.map((e) => ({ ...e, isOverdue: toDate(e.end) <= now }))
    withState.sort((a, b) => {
      if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1
      return a.start.localeCompare(b.start)
    })

    const today = events.filter((e) => startOfDay(toDate(e.start)).getTime() === startOfDay(now).getTime())

    return {
      items: withState.slice(0, 5),
      overdue: withState.filter((e) => e.isOverdue).length,
      dueToday: today.length,
      doneToday: today.filter((e) => e.completed).length,
    }
  }, [events, now])

  const progress = dueToday ? (doneToday / dueToday) * 100 : 0

  return (
    <MotionCard delay={delay} className="flex flex-col p-5">
      <CardHeader
        icon={ListChecks}
        title="Action items"
        subtitle={overdue ? `${overdue} overdue` : 'Nothing overdue'}
        action={
          <span className="surface-inset rounded-full px-2.5 py-1 font-mono text-[11px] tabular-nums text-muted">
            {items.length} open
          </span>
        }
      />

      <div className="mt-4">
        <div className="mb-1.5 flex items-baseline justify-between">
          <span className="text-label-sm text-muted">Today&apos;s progress</span>
          <span className="font-mono text-label-sm tabular-nums text-ink">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-[rgb(var(--line))]">
          <motion.div
            className="h-full rounded-full bg-[rgb(var(--accent))]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
      </div>

      {items.length ? (
        <ul className="mt-4 space-y-1">
          {items.map((item) => (
            <li key={item.id}>
              <div className="group flex items-center gap-2.5 rounded-xl px-1.5 py-1.5 transition-colors hover:bg-[rgb(var(--card-high))]">
                <button
                  type="button"
                  onClick={() => onToggle(item.id)}
                  aria-label={`Mark "${item.title}" done`}
                  className="grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 border-[rgb(var(--line-strong))] text-transparent transition hover:border-[rgb(var(--accent))] hover:text-[rgb(var(--accent))]"
                >
                  <Check size={11} strokeWidth={3} />
                </button>

                <button
                  type="button"
                  onClick={() => onOpen(item)}
                  className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                >
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: categoryHex(item.categoryId, isDark) }}
                  />
                  <span className="min-w-0 flex-1 truncate text-body-md text-ink">{item.title}</span>
                  <span
                    className={cn(
                      'shrink-0 text-label-sm',
                      item.isOverdue ? 'text-amber-600 dark:text-amber-400' : 'text-faint'
                    )}
                  >
                    {item.isOverdue ? (
                      <span className="flex items-center gap-1">
                        <CircleAlert size={11} strokeWidth={2.4} />
                        {fmtRelativeDay(item.start)}
                      </span>
                    ) : (
                      fmtTimeShort(item.start)
                    )}
                  </span>
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={Check}
          title="Nothing outstanding"
          description="Everything scheduled so far is ticked off."
          className="py-8"
        />
      )}
    </MotionCard>
  )
}

export default ActionItems
