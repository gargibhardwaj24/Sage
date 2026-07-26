import { Input, Select } from '@/components/ui/Field'
import { CATEGORIES, categoryHex } from '@/data/categories'
import { useTheme } from '@/store/ThemeContext'
import { humanDuration } from '@/lib/date'
import { cn } from '@/lib/cn'

export const DURATIONS = [15, 20, 25, 30, 45, 60, 90, 120, 150, 180, 240, 300]

export function CategoryPicker({ value, onChange, label, className }) {
  const { isDark } = useTheme()

  return (
    <span className="relative flex items-center">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-2.5 h-2 w-2 rounded-full"
        style={{ backgroundColor: categoryHex(value, isDark) }}
      />
      <Select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn('h-9 w-[7.5rem] pl-7 pr-7 text-label-sm', className)}
      >
        {CATEGORIES.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </Select>
    </span>
  )
}

export function ClockInput({ value, onChange, label, className }) {
  return (
    <Input
      type="time"
      step={300}
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn('h-9 w-[6.75rem] px-3 text-label-sm tabular-nums', className)}
    />
  )
}

export function MinutesSelect({ value, onChange, label, className }) {
  const options = DURATIONS.includes(value) ? DURATIONS : [...DURATIONS, value].sort((a, b) => a - b)

  return (
    <Select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className={cn('h-9 w-[5.5rem] px-3 pr-7 text-label-sm', className)}
    >
      {options.map((m) => (
        <option key={m} value={m}>
          {humanDuration(m)}
        </option>
      ))}
    </Select>
  )
}

export function SheetPanel({ title, hint, action, children, className }) {
  return (
    <section className={cn('surface-card rounded-card p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow">{title}</p>
          {hint ? (
            <p className="mt-2 text-label-sm leading-relaxed text-faint">{hint}</p>
          ) : null}
        </div>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  )
}
