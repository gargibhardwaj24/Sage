import { PartyPopper } from 'lucide-react'
import { categoryHex, categoryInk, getCategory } from '@/data/categories'
import { useTheme } from '@/store/ThemeContext'
import { alpha } from '@/lib/color'
import { fmtDay, fmtRange, isSameDay, toDate } from '@/lib/date'
import { cn } from '@/lib/cn'

export function ResultSkeleton({ index }) {
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

export function ResultRow({ event, onSelect, now, id, active = false, onHover }) {
  const { isDark } = useTheme()
  const hex = categoryHex(event.categoryId, isDark)
  const isHoliday = event.source === 'holiday'
  const start = toDate(event.start)

  return (
    <button
      type="button"
      id={id}
      role="option"
      aria-selected={active}
      onMouseMove={onHover}
      onClick={() => onSelect(event)}
      className={cn(
        'flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors',
        'hover:bg-[rgb(var(--card-high))] focus-visible:bg-[rgb(var(--card-high))] focus-visible:outline-none',
        active && 'bg-[rgb(var(--card-high))]'
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
        style={{
          backgroundColor: alpha(hex, isDark ? 0.22 : 0.14),
          color: categoryInk(event.categoryId, isDark),
        }}
      >
        {getCategory(event.categoryId).short}
      </span>
    </button>
  )
}
