import { useEffect, useState } from 'react'
import { BellRing, Clock3 } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { CategoryBadge } from '@/components/ui/Badge'
import { categoryHex } from '@/data/categories'
import { useTheme } from '@/store/ThemeContext'
import { alpha } from '@/lib/color'
import { fmtRange, fmtRelativeDay, toDate } from '@/lib/date'

function countdown(target, now) {
  const ms = toDate(target).getTime() - now
  if (ms <= 0) return 'starting now'
  const minutes = Math.floor(ms / 60_000)
  const seconds = Math.floor((ms % 60_000) / 1000)
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60)
    return `in ${hours}h ${minutes % 60}m`
  }
  if (minutes === 0) return `in ${seconds}s`
  return `in ${minutes}m ${String(seconds).padStart(2, '0')}s`
}

export function ReminderDialog({ event, onDismiss, onSnooze, onOpen }) {
  const { isDark } = useTheme()
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!event) return undefined
    setNow(Date.now())
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [event])

  if (!event) return null

  const hex = categoryHex(event.categoryId, isDark)

  return (
    <Modal
      open={Boolean(event)}
      onClose={onDismiss}
      title="Reminder"
      description={`${fmtRelativeDay(event.start)} · ${fmtRange(event.start, event.end)}`}
      className="sm:max-w-md"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={() => onSnooze(5)} className="mr-auto">
            <Clock3 size={14} strokeWidth={2} />
            Snooze 5 min
          </Button>
          <Button variant="secondary" size="sm" onClick={onDismiss}>
            Dismiss
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              onOpen(event)
              onDismiss()
            }}
          >
            Open event
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-4">
        <span
          className="grid h-12 w-12 shrink-0 place-items-center rounded-control"
          style={{ backgroundColor: alpha(hex, isDark ? 0.22 : 0.16), color: hex }}
        >
          <BellRing size={22} strokeWidth={1.9} />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-headline tracking-tight text-ink">{event.title}</p>

          <p className="mt-2 font-mono text-body-lg tabular-nums text-accent">
            {countdown(event.start, now)}
          </p>

          <div className="mt-3">
            <CategoryBadge categoryId={event.categoryId} />
          </div>

          {event.notes ? (
            <p className="mt-4 rounded-control bg-[rgb(var(--surface))] px-3 py-2 text-body-md leading-relaxed text-muted">
              {event.notes}
            </p>
          ) : null}
        </div>
      </div>
    </Modal>
  )
}

export default ReminderDialog
