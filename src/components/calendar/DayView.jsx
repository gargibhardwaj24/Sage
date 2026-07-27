import { useEffect, useRef } from 'react'
import { Clock3, Sparkles } from 'lucide-react'
import { AllDayRow, DayColumn, GridLines, OffHours, TimeGutter } from './TimeGrid'
import { GRID_HEIGHT, HOUR_HEIGHT, initialScrollHour } from './constants'
import { eventsOnDay, freeSlots, totalMinutes } from '@/lib/schedule'
import { fmtDayLong, fmtRange, humanDuration, isToday } from '@/lib/date'
import { useSettings } from '@/store/SettingsContext'
import Button from '@/components/ui/Button'

export function DayView({ anchor, events, now, onOpenEvent, onCreateAt, onResizeEvent }) {
  const { settings } = useSettings()
  const scroller = useRef(null)
  const dayEvents = eventsOnDay(events, anchor)

  const focusHour = initialScrollHour(now, anchor, settings, isToday(anchor))

  useEffect(() => {
    if (!scroller.current) return
    scroller.current.scrollTop = focusHour * HOUR_HEIGHT
  }, [focusHour])

  const gaps = freeSlots(events, anchor, {
    workStartHour: settings.workStartHour,
    workEndHour: settings.workEndHour,
    minMinutes: 45,
    now,
  })

  const scheduled = totalMinutes(dayEvents)
  const done = dayEvents.filter((e) => e.completed).length

  return (
    <div className="flex min-h-0 flex-1 gap-4">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex items-baseline justify-between gap-3 border-b px-1 pb-3">
          <div>
            <p className="text-sm font-semibold tracking-tight text-ink">
              {fmtDayLong(anchor)}
              {isToday(anchor) ? (
                <span className="ml-2 rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
                  Today
                </span>
              ) : null}
            </p>
            <p className="mt-0.5 text-xs font-medium text-muted">
              {dayEvents.length} event{dayEvents.length === 1 ? '' : 's'} · {humanDuration(scheduled)}{' '}
              scheduled · {done} done
            </p>
          </div>
        </div>

        <AllDayRow days={[anchor]} events={dayEvents} onOpenEvent={onOpenEvent} />

        <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto">
          <div className="flex pr-2" style={{ height: GRID_HEIGHT }}>
            <TimeGutter />
            <div className="relative flex flex-1">
              <OffHours />
              <GridLines />
              <DayColumn
                day={anchor}
                events={events}
                now={now}
                onOpenEvent={onOpenEvent}
                onCreateAt={onCreateAt}
                onResizeEvent={onResizeEvent}
                showNowBadge
              />
            </div>
          </div>
        </div>
      </div>

      <aside className="hidden w-60 shrink-0 flex-col overflow-y-auto xl:flex">
        <p className="mb-3 flex items-center gap-2 text-[11px] font-medium uppercase tracking-widest text-faint">
          <Clock3 size={13} strokeWidth={2.6} />
          Open gaps
        </p>

        {gaps.length ? (
          <div className="space-y-2">
            {gaps.map((slot) => (
              <button
                key={slot.start.toISOString()}
                type="button"
                onClick={() => onCreateAt?.(slot.start)}
                className="stripes surface-inset group w-full rounded-xl p-3 text-left transition hover:border-[rgb(var(--accent))]"
              >
                <p className="text-xs font-medium text-ink">
                  {fmtRange(slot.start, slot.end)}
                </p>
                <p className="mt-0.5 text-[11px] font-semibold text-muted">
                  {humanDuration(slot.minutes)} free
                </p>
                <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-accent opacity-0 transition group-hover:opacity-100">
                  <Sparkles size={11} strokeWidth={2.8} />
                  Fill this
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="surface-inset rounded-xl p-4">
            <p className="text-xs font-semibold text-muted">
              No gaps of 45 minutes or more inside your working window.
            </p>
            <Button
              variant="subtle"
              size="xs"
              className="mt-3"
              onClick={() => onCreateAt?.(anchor)}
            >
              Add anyway
            </Button>
          </div>
        )}
      </aside>
    </div>
  )
}

export default DayView
