import { useState } from 'react'
import { AlertTriangle, Plus, Zap } from 'lucide-react'
import { MotionCard, CardHeader } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Field'
import { categoryHex } from '@/data/categories'
import { useCategories } from '@/hooks/useCategories'
import { useTheme } from '@/store/ThemeContext'
import { alpha } from '@/lib/color'
import { addMinutes, format, snapToSlot } from '@/lib/date'
import { findConflicts } from '@/lib/schedule'
import { cn } from '@/lib/cn'

const DURATIONS = [
  { value: 25, label: '25m' },
  { value: 45, label: '45m' },
  { value: 60, label: '1h' },
  { value: 90, label: '1h 30' },
  { value: 120, label: '2h' },
]

export function QuickAdd({ events, onAdd, delay = 0 }) {
  const { isDark } = useTheme()
  const categories = useCategories()
  const [title, setTitle] = useState('')
  const [categoryId, setCategoryId] = useState('deep-work')
  const [duration, setDuration] = useState(60)
  const [date, setDate] = useState(() => format(new Date(), 'yyyy-MM-dd'))
  const [time, setTime] = useState(() => format(snapToSlot(addMinutes(new Date(), 30)), 'HH:mm'))

  const start = new Date(`${date}T${time}:00`)
  const valid = title.trim() && !Number.isNaN(start.getTime())
  const end = valid ? addMinutes(start, duration) : null
  const conflicts = valid ? findConflicts(events, start, end) : []

  const submit = (e) => {
    e.preventDefault()
    if (!valid) return
    onAdd({ title: title.trim(), categoryId, start, end, source: 'user' })
    setTitle('')
  }

  return (
    <MotionCard delay={delay} className="p-5">
      <CardHeader icon={Zap} title="Quick add" subtitle="Name it, place it, done" />

      <form onSubmit={submit} className="mt-4 space-y-3">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs a slot?"
          aria-label="Event title"
        />

        <div className="flex flex-wrap gap-1.5">
          {categories.map((c) => {
            const active = categoryId === c.id
            const hex = categoryHex(c.id, isDark)
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategoryId(c.id)}
                aria-pressed={active}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition',
                  active
                    ? 'text-ink'
                    : 'text-ink-400 hover:text-ink-700 dark:text-ink-500 dark:hover:text-ink-200'
                )}
                style={active ? { backgroundColor: alpha(hex, isDark ? 0.2 : 0.14) } : undefined}
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: hex }} />
                {c.short}
              </button>
            )
          })}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-label="Date"
            className="h-10 px-3 text-xs"
          />
          <Input
            type="time"
            step="300"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            aria-label="Start time"
            className="h-10 px-3 text-xs"
          />
        </div>

        <div className="flex gap-1.5">
          {DURATIONS.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => setDuration(d.value)}
              className={cn(
                'flex-1 rounded-xl py-1.5 text-[11px] font-medium transition',
                duration === d.value
                  ? 'bg-accent'
                  : 'surface-inset text-muted hover:bg-[rgb(var(--card-high))]'
              )}
            >
              {d.label}
            </button>
          ))}
        </div>

        {conflicts.length ? (
          <p className="flex items-start gap-1.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
            <AlertTriangle size={12} strokeWidth={2.8} className="mt-px shrink-0" />
            Overlaps “{conflicts[0].title}” — still fine to add.
          </p>
        ) : null}

        <Button type="submit" variant="primary" size="sm" disabled={!valid} className="w-full justify-center">
          <Plus size={15} strokeWidth={2.8} />
          Add to calendar
        </Button>
      </form>
    </MotionCard>
  )
}

export default QuickAdd
