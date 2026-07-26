import { Plus, Trash2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Field'
import { CategoryPicker, ClockInput, MinutesSelect } from '@/components/methods/sheetControls'
import { categoryHex } from '@/data/categories'
import { useTheme } from '@/store/ThemeContext'
import { parseClock } from '@/lib/worksheet'
import { addMinutes, atTime, fmtTimeShort } from '@/lib/date'
import { cn } from '@/lib/cn'

const endsAt = (start, minutes) => {
  const { hour, minute } = parseClock(start)
  return fmtTimeShort(addMinutes(atTime(new Date(), hour, minute), minutes))
}

export function RowsSheet({ sheet, state, onChange }) {
  const { isDark } = useTheme()
  const rows = state.rows ?? []

  const patch = (index, values) =>
    onChange({ rows: rows.map((r, i) => (i === index ? { ...r, ...values } : r)) })

  const remove = (index) => onChange({ rows: rows.filter((_, i) => i !== index) })

  const add = () => {
    const last = rows[rows.length - 1]
    const { hour, minute } = parseClock(last?.start ?? '09:00')
    const next = addMinutes(atTime(new Date(), hour, minute), last?.minutes ?? 60)

    onChange({
      rows: [
        ...rows,
        {
          title: '',
          categoryId: last?.categoryId ?? 'deep-work',
          start: `${String(next.getHours()).padStart(2, '0')}:${String(next.getMinutes()).padStart(2, '0')}`,
          minutes: 60,
          notes: '',
        },
      ],
    })
  }

  const sorted = [...rows]
    .map((row, index) => ({ row, index }))
    .sort((a, b) => a.row.start.localeCompare(b.row.start))

  return (
    <div className="space-y-3">
      {sorted.map(({ row, index }) => (
        <div
          key={index}
          className="surface-card rounded-card p-4 transition-shadow duration-200 ease-expo"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span
              aria-hidden="true"
              className="h-9 w-1 shrink-0 rounded-full"
              style={{ backgroundColor: categoryHex(row.categoryId, isDark) }}
            />

            <input
              value={row.title}
              onChange={(e) => patch(index, { title: e.target.value })}
              placeholder={sheet.titlePlaceholder}
              aria-label="Block name"
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
              label="Start time"
            />
            <MinutesSelect
              value={row.minutes}
              onChange={(minutes) => patch(index, { minutes })}
              label="Length"
            />
            <CategoryPicker
              value={row.categoryId}
              onChange={(categoryId) => patch(index, { categoryId })}
              label="Category"
            />

            <button
              type="button"
              onClick={() => remove(index)}
              aria-label={`Remove ${row.title || 'this block'}`}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-control text-faint transition-colors hover:bg-rose-500/10 hover:text-rose-500"
            >
              <Trash2 size={15} strokeWidth={2} />
            </button>
          </div>

          <div className="mt-3 flex items-start gap-2">
            <span className="w-1 shrink-0" />
            <div className="min-w-0 flex-1">
              <Textarea
                value={row.notes ?? ''}
                onChange={(e) => patch(index, { notes: e.target.value })}
                rows={2}
                placeholder={sheet.notePlaceholder}
                aria-label={sheet.noteLabel}
                className="resize-y text-body-md"
              />
              <p className="mt-1.5 text-label-sm text-faint">
                {sheet.noteLabel} · runs until {endsAt(row.start, row.minutes)}
              </p>
            </div>
          </div>
        </div>
      ))}

      <Button variant="secondary" size="sm" onClick={add}>
        <Plus size={15} strokeWidth={2.2} />
        {sheet.addLabel}
      </Button>
    </div>
  )
}

export default RowsSheet
