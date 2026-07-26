import { useDroppable } from '@dnd-kit/core'
import { format, isToday } from 'date-fns'
import EventBlock from './EventBlock'
import { dayDroppableId, GRID_HEIGHT, HOUR_HEIGHT, HOURS, offsetFor } from './constants'
import { layoutDay } from '@/lib/schedule'
import { atTime, DAY_START_HOUR, dayKey } from '@/lib/date'
import { cn } from '@/lib/cn'

export function TimeGutter() {
  return (
    <div className="relative w-12 shrink-0 sm:w-14" style={{ height: GRID_HEIGHT }}>
      {HOURS.map((hour) => (
        <div
          key={hour}
          className="absolute right-2 -translate-y-1/2 text-[10px] font-medium uppercase tracking-wide text-faint"
          style={{ top: (hour - DAY_START_HOUR) * HOUR_HEIGHT }}
        >
          {format(atTime(new Date(), hour), hour % 12 === 0 ? 'h a' : 'h a')}
        </div>
      ))}
    </div>
  )
}

export function GridLines() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {HOURS.map((hour) => (
        <div
          key={hour}
          className="absolute inset-x-0 border-t border-line"
          style={{ top: (hour - DAY_START_HOUR) * HOUR_HEIGHT }}
        />
      ))}
    </div>
  )
}

function NowIndicator({ now, showBadge }) {
  const top = offsetFor(now)
  if (top < 0 || top > GRID_HEIGHT) return null
  return (
    <div className="pointer-events-none absolute inset-x-0 z-30" style={{ top }} aria-hidden="true">
      <div className="relative h-px bg-rose-500">
        {showBadge ? (
          <span className="absolute -left-[52px] -top-[9px] rounded-md bg-rose-500 px-1.5 py-0.5 font-mono text-[10px] font-medium tabular-nums text-white">
            {format(now, 'HH:mm')}
          </span>
        ) : null}
        <span className="absolute -left-1 -top-[3px] h-[7px] w-[7px] rounded-full bg-rose-500" />
        <span className="absolute -left-1 -top-[3px] h-[7px] w-[7px] animate-pulse-ring rounded-full bg-rose-500" />
      </div>
    </div>
  )
}

export function DayColumn({ day, events, now, onOpenEvent, onCreateAt, className, showNowBadge }) {
  const key = dayKey(day)
  const { setNodeRef, isOver } = useDroppable({ id: dayDroppableId(key), data: { day } })
  const laidOut = layoutDay(events)

  const handleBackgroundClick = (e) => {
    if (e.target !== e.currentTarget) return
    const rect = e.currentTarget.getBoundingClientRect()
    const minutes = Math.floor((e.clientY - rect.top) / HOUR_HEIGHT) * 60 + DAY_START_HOUR * 60
    onCreateAt?.(atTime(day, Math.floor(minutes / 60), 0))
  }

  return (
    <div
      ref={setNodeRef}
      onClick={handleBackgroundClick}
      className={cn(
        'relative flex-1 border-l transition-colors duration-150',
        isOver && 'bg-[rgb(var(--accent))]/[0.07]',
        className
      )}
      style={{ height: GRID_HEIGHT }}
    >
      {isToday(day) ? <NowIndicator now={now} showBadge={showNowBadge} /> : null}

      {laidOut.map(({ event, column, columns }) => (
        <EventBlock
          key={event.id}
          event={event}
          column={column}
          columns={columns}
          onOpen={onOpenEvent}
        />
      ))}

      {isOver ? (
        <div className="pointer-events-none absolute inset-0 rounded-lg ring-2 ring-inset ring-[rgb(var(--accent))]/40" />
      ) : null}
    </div>
  )
}

export function DayHeader({ day, count, onClick, compact = false }) {
  const today = isToday(day)
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-2 transition',
        'hover:bg-[rgb(var(--card-high))]'
      )}
    >
      <span
        className={cn(
          'text-[10px] font-medium uppercase tracking-widest',
          today ? 'text-accent' : 'text-faint'
        )}
      >
        {format(day, 'EEE')}
      </span>
      <span
        className={cn(
          'grid h-8 w-8 place-items-center rounded-full text-sm font-semibold tracking-tight',
          today
            ? 'bg-primary'
            : 'text-ink'
        )}
      >
        {format(day, 'd')}
      </span>
      {!compact ? (
        <span className="text-[10px] font-semibold text-faint">
          {count ? `${count} event${count > 1 ? 's' : ''}` : '—'}
        </span>
      ) : null}
    </button>
  )
}
