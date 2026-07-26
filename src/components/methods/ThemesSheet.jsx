import { CategoryPicker, ClockInput, MinutesSelect } from '@/components/methods/sheetControls'
import { categoryHex } from '@/data/categories'
import { useTheme } from '@/store/ThemeContext'
import { addDays, format, isSameDay, startOfWeek, toDate, WEEK_OPTS } from '@/lib/date'
import { alpha } from '@/lib/color'
import { cn } from '@/lib/cn'

export function ThemesSheet({ state, onChange, date }) {
  const { isDark } = useTheme()
  const rows = state.rows ?? []
  const weekStart = startOfWeek(toDate(date), WEEK_OPTS)

  const patch = (index, values) =>
    onChange({ rows: rows.map((r, i) => (i === index ? { ...r, ...values } : r)) })

  return (
    <div className="space-y-3">
      {rows.map((row, index) => {
        const day = addDays(weekStart, row.day)
        const isToday = isSameDay(day, new Date())
        const active = Boolean(row.title.trim())
        const hex = categoryHex(row.categoryId, isDark)

        return (
          <div
            key={row.day}
            className={cn(
              'surface-card flex flex-wrap items-center gap-2 rounded-card p-4',
              !active && 'opacity-70'
            )}
            style={active ? { borderColor: alpha(hex, 0.35) } : undefined}
          >
            <span className="flex w-[5.5rem] shrink-0 flex-col">
              <span className="text-body-md font-medium text-ink">{format(day, 'EEEE')}</span>
              <span className="text-label-sm text-faint">
                {format(day, 'MMM d')}
                {isToday ? ' · today' : ''}
              </span>
            </span>

            <input
              value={row.title}
              onChange={(e) => patch(index, { title: e.target.value })}
              placeholder="Rest day — leave blank to skip"
              aria-label={`Theme for ${format(day, 'EEEE')}`}
              className={cn(
                'h-9 min-w-[10rem] flex-1 rounded-control border bg-[rgb(var(--surface))] px-3',
                'text-body-md text-ink placeholder:text-faint',
                'transition-all duration-200 ease-expo focus:border-[rgb(var(--accent))]',
                'focus:bg-[rgb(var(--card))] focus:outline-none'
              )}
            />

            <ClockInput
              value={row.start}
              onChange={(start) => patch(index, { start: start || '09:00' })}
              label={`Start time on ${format(day, 'EEEE')}`}
            />
            <MinutesSelect
              value={row.minutes}
              onChange={(minutes) => patch(index, { minutes })}
              label={`Length on ${format(day, 'EEEE')}`}
            />
            <CategoryPicker
              value={row.categoryId}
              onChange={(categoryId) => patch(index, { categoryId })}
              label={`Category on ${format(day, 'EEEE')}`}
            />
          </div>
        )
      })}
    </div>
  )
}

export default ThemesSheet
