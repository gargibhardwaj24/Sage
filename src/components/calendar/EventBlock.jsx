import { useRef, useState } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { Bell, Check, Sparkles } from 'lucide-react'
import { categoryHex, categoryInk, getCategory } from '@/data/categories'
import { useTheme } from '@/store/ThemeContext'
import { alpha } from '@/lib/color'
import { addMinutes, durationMinutes, fmtTimeShort, humanDuration, startOfDay, toDate } from '@/lib/date'
import { offsetFor, PX_PER_MIN } from './constants'
import { cn } from '@/lib/cn'

const DRAG_THRESHOLD = 5
const RESIZE_SNAP = 15
const MIN_EVENT_MINUTES = 15
const MAX_EVENT_MINUTES = 24 * 60

export function EventBlock({ event, column = 0, columns = 1, onOpen, onResize, compact = false }) {
  const { isDark } = useTheme()
  const pointerStart = useRef(null)
  const [preview, setPreview] = useState(null)

  const isHoliday = event.source === 'holiday'
  const continuesBefore = Boolean(event.continuesBefore)
  const continuesAfter = Boolean(event.continuesAfter)
  const canResize = !isHoliday && typeof onResize === 'function'

  const sourceEvent = event.realStart
    ? (() => {
        const { segId, realStart, realEnd, continuesBefore: _b, continuesAfter: _a, ...rest } = event
        return { ...rest, start: realStart, end: realEnd }
      })()
    : event

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: event.segId ?? event.id,
    data: { event: sourceEvent },
    disabled: isHoliday || continuesBefore || Boolean(preview),
  })

  const baseStart = toDate(event.realStart ?? event.start)
  const baseEnd = toDate(event.realEnd ?? event.end)
  const start = preview?.start ?? baseStart
  const end = preview?.end ?? baseEnd
  const minutes = durationMinutes(start, end)

  const columnStart = startOfDay(toDate(event.start))
  const columnEnd = addMinutes(columnStart, 24 * 60)
  const drawStart = start < columnStart ? columnStart : start
  const drawEnd = end > columnEnd ? columnEnd : end

  const top = offsetFor(drawStart)
  const height = Math.max(durationMinutes(drawStart, drawEnd) * PX_PER_MIN, 24)

  const beginResize = (edge) => (e) => {
    if (!canResize || e.button != null && e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()

    const originY = e.clientY
    let latest = null

    const onMove = (ev) => {
      const deltaMin =
        Math.round(((ev.clientY - originY) / PX_PER_MIN) / RESIZE_SNAP) * RESIZE_SNAP

      if (edge === 'top') {
        let next = addMinutes(baseStart, deltaMin)
        const latestStart = addMinutes(baseEnd, -MIN_EVENT_MINUTES)
        const earliestStart = addMinutes(baseEnd, -MAX_EVENT_MINUTES)
        if (next > latestStart) next = latestStart
        if (next < earliestStart) next = earliestStart
        latest = { start: next, end: baseEnd }
      } else {
        let next = addMinutes(baseEnd, deltaMin)
        const earliestEnd = addMinutes(baseStart, MIN_EVENT_MINUTES)
        const latestEnd = addMinutes(baseStart, MAX_EVENT_MINUTES)
        if (next < earliestEnd) next = earliestEnd
        if (next > latestEnd) next = latestEnd
        latest = { start: baseStart, end: next }
      }

      setPreview(latest)
    }

    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      setPreview(null)

      if (
        latest &&
        (latest.start.getTime() !== baseStart.getTime() ||
          latest.end.getTime() !== baseEnd.getTime())
      ) {
        onResize(event.id, latest.start, latest.end)
      }
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
  }

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
    zIndex: isDragging || preview ? 40 : 10 + column,
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
      data-event-id={event.id}
      aria-label={`${event.title}, ${fmtTimeShort(baseStart)}`}
      onClick={(e) => {
        if (isHoliday) return
        const from = pointerStart.current
        if (from) {
          const moved = Math.hypot(e.clientX - from.x, e.clientY - from.y)
          if (moved > DRAG_THRESHOLD) return
        }
        onOpen?.(sourceEvent)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          if (!isHoliday) onOpen?.(sourceEvent)
        }
      }}
      className={cn(
        'group absolute overflow-hidden rounded-event px-2 py-1 text-left shadow-sm',
        'touch-none select-none backdrop-blur-sm transition-shadow duration-150',
        'hover:shadow-[var(--shadow-ambient)]',
        !isHoliday && 'cursor-grab focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent))]',
        isDragging && 'cursor-grabbing opacity-80 shadow-[var(--shadow-ambient-lg)] ring-2 ring-[rgb(var(--accent))]/60',
        preview && 'shadow-[var(--shadow-ambient-lg)] ring-2 ring-[rgb(var(--accent))]/70',
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
          {continuesBefore ? '↑ ' : ''}
          {fmtTimeShort(start)}
          {height >= 56 || preview || continuesAfter ? ` – ${fmtTimeShort(end)}` : ''}
          {continuesAfter ? ' ↓' : ''}
          {preview ? ` · ${humanDuration(minutes)}` : ''}
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

      {canResize && !continuesBefore ? (
        <ResizeHandle edge="top" onPointerDown={beginResize('top')} active={Boolean(preview)} />
      ) : null}
      {canResize && !continuesAfter ? (
        <ResizeHandle edge="bottom" onPointerDown={beginResize('bottom')} active={Boolean(preview)} />
      ) : null}
    </div>
  )
}

function ResizeHandle({ edge, onPointerDown, active }) {
  return (
    <span
      role="presentation"
      onPointerDown={onPointerDown}
      onClick={(e) => e.stopPropagation()}
      title={edge === 'top' ? 'Drag to change the start time' : 'Drag to change the end time'}
      className={cn(
        'absolute inset-x-0 z-20 flex h-2.5 cursor-ns-resize touch-none items-center justify-center',
        edge === 'top' ? '-top-px' : '-bottom-px'
      )}
    >
      <span
        className={cn(
          'h-[3px] w-7 rounded-full bg-current transition-opacity duration-150',
          active ? 'opacity-80' : 'opacity-0 group-hover:opacity-55'
        )}
      />
    </span>
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
