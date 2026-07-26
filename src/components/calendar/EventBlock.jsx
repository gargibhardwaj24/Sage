import { useRef } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { Bell, Check, Sparkles } from 'lucide-react'
import { categoryHex, categoryInk, getCategory } from '@/data/categories'
import { useTheme } from '@/store/ThemeContext'
import { alpha } from '@/lib/color'
import { durationMinutes, fmtTimeShort, toDate } from '@/lib/date'
import { offsetFor, PX_PER_MIN } from './constants'
import { cn } from '@/lib/cn'

const DRAG_THRESHOLD = 5

export function EventBlock({ event, column = 0, columns = 1, onOpen, compact = false }) {
  const { isDark } = useTheme()
  const pointerStart = useRef(null)

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: event.id,
    data: { event },
  })

  const start = toDate(event.start)
  const minutes = durationMinutes(event.start, event.end)
  const top = offsetFor(start)
  const height = Math.max(minutes * PX_PER_MIN, 24)

  const hex = categoryHex(event.categoryId, isDark)
  const ink = categoryInk(event.categoryId, isDark)

  const gap = 3
  const widthPct = 100 / columns
  const style = {
    top,
    height,
    left: `calc(${column * widthPct}% + ${column ? gap : 0}px)`,
    width: `calc(${widthPct}% - ${columns > 1 ? gap * 1.5 : gap}px)`,
    backgroundColor: alpha(hex, isDark ? 0.2 : 0.13),
    borderLeft: `3px solid ${hex}`,
    color: ink,
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    zIndex: isDragging ? 40 : 10 + column,
  }

  const showTime = height >= 40
  const isShort = height < 34

  return (
    <div
      ref={setNodeRef}
      style={style}
      onPointerDownCapture={(e) => {
        pointerStart.current = { x: e.clientX, y: e.clientY }
      }}
      {...listeners}
      {...attributes}
      role="button"
      tabIndex={0}
      aria-label={`${event.title}, ${fmtTimeShort(event.start)}`}
      onClick={(e) => {
        const from = pointerStart.current
        if (from) {
          const moved = Math.hypot(e.clientX - from.x, e.clientY - from.y)
          if (moved > DRAG_THRESHOLD) return
        }
        onOpen?.(event)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen?.(event)
        }
      }}
      className={cn(
        'group absolute overflow-hidden rounded-event px-2 py-1 text-left shadow-sm',
        'cursor-grab touch-none select-none backdrop-blur-sm transition-shadow duration-150',
        'hover:shadow-[var(--shadow-ambient)] focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent))]',
        isDragging && 'cursor-grabbing opacity-80 shadow-[var(--shadow-ambient-lg)] ring-2 ring-[rgb(var(--accent))]/60',
        event.completed && 'opacity-55'
      )}
    >
      <div className={cn('flex items-start gap-1', isShort && 'items-center')}>
        <p
          className={cn(
            'min-w-0 flex-1 truncate text-[11.5px] font-medium leading-tight tracking-tight',
            event.completed && 'line-through'
          )}
        >
          {event.title}
        </p>
        <span className="mt-px flex shrink-0 items-center gap-0.5 opacity-70">
          {event.source === 'ai' ? <Sparkles size={10} strokeWidth={2.6} /> : null}
          {event.reminderMinutes != null && !event.completed ? <Bell size={9} strokeWidth={2.8} /> : null}
          {event.completed ? <Check size={10} strokeWidth={3} /> : null}
        </span>
      </div>

      {showTime && !compact ? (
        <p className="mt-0.5 truncate text-[10px] font-semibold opacity-75">
          {fmtTimeShort(event.start)}
          {height >= 56 ? ` – ${fmtTimeShort(event.end)}` : ''}
        </p>
      ) : null}

      {height >= 76 ? (
        <span
          className="mt-1.5 inline-flex rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider"
          style={{ backgroundColor: alpha(hex, isDark ? 0.3 : 0.2) }}
        >
          {getCategory(event.categoryId).short}
        </span>
      ) : null}

      {height >= 112 && event.notes ? (
        <p className="mt-1.5 line-clamp-2 text-[10px] leading-snug opacity-65">{event.notes}</p>
      ) : null}
    </div>
  )
}

export function EventDragPreview({ event }) {
  const { isDark } = useTheme()
  const hex = categoryHex(event.categoryId, isDark)
  return (
    <div
      className="pointer-events-none rounded-event px-3 py-2 shadow-[var(--shadow-ambient-lg)] backdrop-blur-md"
      style={{
        backgroundColor: alpha(hex, isDark ? 0.32 : 0.2),
        borderLeft: `3px solid ${hex}`,
        color: categoryInk(event.categoryId, isDark),
      }}
    >
      <p className="text-[11.5px] font-medium leading-tight">{event.title}</p>
      <p className="text-[10px] font-semibold opacity-75">{fmtTimeShort(event.start)}</p>
    </div>
  )
}

export default EventBlock
