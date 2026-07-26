import { CalendarDays, ChevronLeft, ChevronRight, Columns3, Grid3x3, Rows3 } from 'lucide-react'
import Segmented from '@/components/ui/Segmented'
import Button from '@/components/ui/Button'
import { CATEGORIES, categoryHex } from '@/data/categories'
import { useTheme } from '@/store/ThemeContext'
import { alpha } from '@/lib/color'
import { fmtDay, fmtMonth, format, weekDays } from '@/lib/date'
import { cn } from '@/lib/cn'

export const VIEW_OPTIONS = [
  { value: 'day', label: 'Day', icon: Rows3 },
  { value: 'week', label: 'Week', icon: Columns3 },
  { value: 'month', label: 'Month', icon: Grid3x3 },
]

function rangeLabel(view, anchor) {
  if (view === 'month') return fmtMonth(anchor)
  if (view === 'day') return fmtDay(anchor)
  const days = weekDays(anchor)
  const sameMonth = days[0].getMonth() === days[6].getMonth()
  return sameMonth
    ? `${format(days[0], 'MMM d')} – ${format(days[6], 'd, yyyy')}`
    : `${format(days[0], 'MMM d')} – ${format(days[6], 'MMM d')}`
}

export function CalendarToolbar({
  view,
  onViewChange,
  anchor,
  onPrev,
  onNext,
  onToday,
  activeCategories,
  onToggleCategory,
}) {
  const { isDark } = useTheme()
  const allActive = activeCategories.size === CATEGORIES.length

  return (
    <div className="flex flex-wrap items-center gap-3 border-b px-1 pb-4">
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon-sm" onClick={onPrev} aria-label="Previous">
          <ChevronLeft size={17} strokeWidth={2.6} />
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={onNext} aria-label="Next">
          <ChevronRight size={17} strokeWidth={2.6} />
        </Button>
        <Button variant="outline" size="xs" onClick={onToday} className="ml-1">
          <CalendarDays size={13} strokeWidth={2.6} />
          Today
        </Button>
      </div>

      <h2 className="min-w-0 flex-1 truncate text-base font-semibold tracking-tight text-ink sm:text-lg">
        {rangeLabel(view, anchor)}
      </h2>

      <div className="order-last flex w-full items-center gap-1.5 overflow-x-auto no-scrollbar sm:order-none sm:w-auto">
        {CATEGORIES.map((c) => {
          const active = activeCategories.has(c.id)
          const hex = categoryHex(c.id, isDark)
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onToggleCategory(c.id)}
              aria-pressed={active}
              title={`${active ? 'Hide' : 'Show'} ${c.name}`}
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition',
                active
                  ? 'text-ink'
                  : 'text-ink-400 line-through opacity-60 dark:text-ink-500'
              )}
              style={active ? { backgroundColor: alpha(hex, isDark ? 0.18 : 0.13) } : undefined}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: active ? hex : 'currentColor' }}
              />
              {c.short}
            </button>
          )
        })}
        {!allActive ? (
          <button
            type="button"
            onClick={() => onToggleCategory('__all__')}
            className="shrink-0 rounded-full px-2 py-1 text-[11px] font-medium text-accent"
          >
            Reset
          </button>
        ) : null}
      </div>

      <Segmented options={VIEW_OPTIONS} value={view} onChange={onViewChange} size="sm" layoutId="cal-view" />
    </div>
  )
}

export default CalendarToolbar
