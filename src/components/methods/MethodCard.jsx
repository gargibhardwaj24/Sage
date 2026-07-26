import { motion } from 'framer-motion'
import {
  ArrowRight,
  Brain,
  CalendarRange,
  Check,
  CheckSquare,
  Grid2x2,
  Layers,
  LayoutGrid,
  PenLine,
  Timer,
  TimerReset,
} from 'lucide-react'
import Button from '@/components/ui/Button'
import { getWorksheet } from '@/data/worksheets'
import { alpha } from '@/lib/color'
import { humanDuration } from '@/lib/date'
import { cn } from '@/lib/cn'

const ICONS = {
  LayoutGrid,
  TimerReset,
  Timer,
  Brain,
  Grid2x2,
  CheckSquare,
  CalendarRange,
  Layers,
}

const DIFFICULTY_TONE = {
  Beginner: 'text-accent',
  Intermediate: 'text-amber-600 dark:text-amber-400',
  Advanced: 'text-muted',
}

export function DifficultyPill({ level, className }) {
  return (
    <span
      className={cn(
        'surface-inset inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-medium',
        DIFFICULTY_TONE[level] ?? 'text-muted',
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {level}
    </span>
  )
}

export function MethodCard({ method, selected, isDefault, onSelect, onOpenSheet, index = 0 }) {
  const Icon = ICONS[method.icon] ?? LayoutGrid
  const sheet = getWorksheet(method.id)

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'surface-card flex flex-col rounded-card p-5 transition-all duration-200 ease-expo',
        'hover:-translate-y-0.5 hover:shadow-[var(--shadow-ambient-lg)]',
        selected && 'ring-1 ring-[rgb(var(--accent))]'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className="grid h-10 w-10 place-items-center rounded-xl"
          style={{ backgroundColor: alpha(method.accent, 0.14), color: method.accent }}
        >
          <Icon size={18} strokeWidth={1.9} />
        </span>
        <span className="flex items-center gap-1.5">
          {isDefault ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-1 text-[10.5px] font-medium">
              <Check size={10} strokeWidth={3} />
              Active
            </span>
          ) : null}
          <DifficultyPill level={method.difficulty} />
        </span>
      </div>

      <h3 className="mt-5 text-headline-md tracking-tight text-ink">{method.name}</h3>
      <p className="mt-2 text-body-md leading-relaxed text-muted">{method.tagline}</p>

      <ul className="mt-4 space-y-1.5">
        {method.benefits.map((b) => (
          <li key={b} className="flex items-center gap-2 text-label-sm text-muted">
            <Check size={12} strokeWidth={2.6} className="shrink-0 text-accent" />
            {b}
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-label-sm text-faint">
            {humanDuration(method.defaultBlock)} blocks
          </span>
          <Button variant="ghost" size="sm" onClick={() => onSelect(method.id)}>
            Details
          </Button>
        </div>

        {sheet ? (
          <Button
            variant="secondary"
            size="sm"
            className="mt-2.5 w-full justify-center"
            onClick={() => onOpenSheet(method.id)}
          >
            <PenLine size={13} strokeWidth={2.2} />
            {sheet.cta}
          </Button>
        ) : null}
      </div>
    </motion.div>
  )
}

export function FeaturedMethodCard({ method, reason, onApply, onSelect, index = 0 }) {
  const Icon = ICONS[method.icon] ?? LayoutGrid

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
      className="surface-card flex flex-col rounded-card p-6"
    >
      <div className="flex items-center gap-2">
        <span className="surface-inset rounded-full px-2.5 py-1 text-[10.5px] font-medium text-muted">
          {method.theme}
        </span>
        <DifficultyPill level={method.difficulty} />
      </div>

      <div className="mt-5 flex items-start gap-4">
        <span
          className="grid h-12 w-12 shrink-0 place-items-center rounded-xl"
          style={{ backgroundColor: alpha(method.accent, 0.14), color: method.accent }}
        >
          <Icon size={22} strokeWidth={1.8} />
        </span>
        <div className="min-w-0">
          <h3 className="text-headline tracking-tight text-ink">{method.name}</h3>
          <p className="mt-1.5 text-body-md leading-relaxed text-muted">{method.tagline}</p>
        </div>
      </div>

      <p className="mt-4 flex items-start gap-2 text-label-sm leading-relaxed text-faint">
        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[rgb(var(--accent))]" />
        Suggested because: {reason}
      </p>

      <div className="mt-auto flex items-center gap-2 pt-6">
        <Button variant="primary" size="sm" onClick={() => onApply(method.id)}>
          Apply method
          <ArrowRight size={14} strokeWidth={2.2} />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onSelect(method.id)}>
          View details
        </Button>
      </div>
    </motion.div>
  )
}

export { ICONS as METHOD_ICONS }
export default MethodCard
