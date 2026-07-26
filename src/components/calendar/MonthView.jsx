import { useRef } from 'react'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import { format, isSameMonth, isToday } from 'date-fns'
import { categoryHex, categoryInk } from '@/data/categories'
import { useTheme } from '@/store/ThemeContext'
import { alpha } from '@/lib/color'
import { dayKey, fmtTimeShort, monthMatrix } from '@/lib/date'
import { eventsOnDay } from '@/lib/schedule'
import { dayDroppableId } from './constants'
import { cn } from '@/lib/cn'

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MAX_CHIPS = 3

function EventChip({ event, onOpen }) {
  const { isDark } = useTheme()
  const pointerStart = useRef(null)
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: event.id,
    data: { event },
  })

  const hex = categoryHex(event.categoryId, isDark)

  return (
    <div
      ref={setNodeRef}
      onPointerDownCapture={(e) => {
        pointerStart.current = { x: e.clientX, y: e.clientY }
      }}
      {...listeners}
      {...attributes}
      role="button"
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation()
        const from = pointerStart.current
        if (from && Math.hypot(e.clientX - from.x, e.clientY - from.y) > 5) return
        onOpen?.(event)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onOpen?.(event)
      }}
      style={{
        backgroundColor: alpha(hex, isDark ? 0.2 : 0.13),
        color: categoryInk(event.categoryId, isDark),
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
      }}
      className={cn(
        'flex cursor-grab touch-none select-none items-center gap-1 rounded-event px-1.5 py-[3px]',
        'text-[10.5px] font-medium leading-tight transition',
        isDragging && 'z-40 cursor-grabbing opacity-80 shadow-[var(--shadow-ambient)]',
        event.completed && 'opacity-55 line-through'
      )}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: hex }} />
      <span className="truncate">{event.title}</span>
    </div>
  )
}

function DayCell({ day, anchor, events, onOpenEvent, onSelectDay }) {
  const key = dayKey(day)
  const { setNodeRef, isOver } = useDroppable({ id: dayDroppableId(key), data: { day } })
  const outside = !isSameMonth(day, anchor)
  const today = isToday(day)
  const visible = events.slice(0, MAX_CHIPS)
  const overflow = events.length - visible.length

  return (
    <div
      ref={setNodeRef}
      onClick={() => onSelectDay?.(day)}
      className={cn(
        'group relative flex min-h-[92px] flex-col gap-1 border-b border-r p-1.5',
        'cursor-pointer transition-colors duration-150',
        outside && 'opacity-40',
        today && 'bg-[rgb(var(--accent))]/[0.06]',
        isOver && 'bg-[rgb(var(--accent))]/[0.1] ring-2 ring-inset ring-[rgb(var(--accent))]/40'
      )}
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            'grid h-6 w-6 place-items-center rounded-full text-[11px] font-semibold',
            today
              ? 'bg-primary'
              : 'text-muted'
          )}
        >
          {format(day, 'd')}
        </span>
        {events.length ? (
          <span className="text-[9.5px] font-medium text-faint">
            {fmtTimeShort(events[0].start)}
          </span>
        ) : null}
      </div>

      <div className="flex flex-col gap-1 overflow-hidden">
        {visible.map((event) => (
          <EventChip key={event.id} event={event} onOpen={onOpenEvent} />
        ))}
        {overflow > 0 ? (
          <span className="px-1 text-[10px] font-medium text-faint">
            +{overflow} more
          </span>
        ) : null}
      </div>
    </div>
  )
}

export function MonthView({ anchor, events, onOpenEvent, onSelectDay }) {
  const days = monthMatrix(anchor)

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="grid grid-cols-7 border-b border-line">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="py-2 text-center text-[10px] font-medium uppercase tracking-widest text-faint"
          >
            {label}
          </div>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-7 overflow-y-auto border-l border-line">
        {days.map((day) => (
          <DayCell
            key={day.toISOString()}
            day={day}
            anchor={anchor}
            events={eventsOnDay(events, day)}
            onOpenEvent={onOpenEvent}
            onSelectDay={onSelectDay}
          />
        ))}
      </div>
    </div>
  )
}

export default MonthView
