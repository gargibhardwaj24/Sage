import { Headphones, Play, Timer } from 'lucide-react'
import { MotionCard } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { categoryHex, getCategory } from '@/data/categories'
import { useTheme } from '@/store/ThemeContext'
import { useNow } from '@/hooks/useNow'
import { currentEvent, nextUpcoming } from '@/lib/schedule'
import { durationMinutes, fmtTimeShort, toDate } from '@/lib/date'

const pad = (n) => String(Math.floor(n)).padStart(2, '0')

function clock(ms) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}

export function FocusSession({ events, onOpen, delay = 0 }) {
  const { isDark } = useTheme()
  const now = useNow(1000)

  const active = currentEvent(events, now)
  const next = nextUpcoming(events, now)
  const event = active ?? next
  if (!event) return null

  const category = getCategory(event.categoryId)
  const hex = categoryHex(event.categoryId, isDark)
  const start = toDate(event.start)
  const end = toDate(event.end)

  const remaining = active ? end - now : start - now
  const total = durationMinutes(event.start, event.end) * 60000
  const progress = active ? Math.min(1, Math.max(0, (now - start) / total)) : 0

  return (
    <MotionCard delay={delay} className="relative overflow-hidden p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
            style={{ backgroundColor: `${hex}22`, color: hex }}
          >
            {active ? <Headphones size={17} strokeWidth={2} /> : <Timer size={17} strokeWidth={2} />}
          </span>
          <div className="min-w-0">
            <p className="eyebrow">{active ? 'Current focus' : 'Up next'}</p>
            <p className="mt-1.5 truncate text-body-lg font-medium tracking-tight text-ink">
              {event.title}
            </p>
            <p className="mt-0.5 text-label-sm text-muted">
              {category.name} · {fmtTimeShort(event.start)} – {fmtTimeShort(event.end)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="eyebrow">{active ? 'Time remaining' : 'Starts in'}</p>
            <p className="mt-1.5 font-mono text-headline font-semibold tabular-nums tracking-tight text-ink">
              {clock(remaining)}
            </p>
          </div>
          {!active ? (
            <Button variant="secondary" size="sm" onClick={() => onOpen?.(event)}>
              <Play size={13} strokeWidth={2.4} />
              Details
            </Button>
          ) : null}
        </div>
      </div>

      {active ? (
        <div className="mt-4 h-1 overflow-hidden rounded-full bg-[rgb(var(--line))]">
          <div
            className="h-full rounded-full transition-[width] duration-1000 ease-linear"
            style={{ width: `${progress * 100}%`, backgroundColor: hex }}
          />
        </div>
      ) : null}
    </MotionCard>
  )
}

export default FocusSession
