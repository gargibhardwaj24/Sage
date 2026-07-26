import { useCallback, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { AlertTriangle, Plus, Sparkles } from 'lucide-react'
import CalendarToolbar from '@/components/calendar/CalendarToolbar'
import WeekView from '@/components/calendar/WeekView'
import DayView from '@/components/calendar/DayView'
import MonthView from '@/components/calendar/MonthView'
import { EventDragPreview } from '@/components/calendar/EventBlock'
import { parseDayDroppable, PX_PER_MIN } from '@/components/calendar/constants'
import { Card } from '@/components/ui/Card'
import { useEvents } from '@/store/EventsContext'
import { useEventDialog } from '@/store/DialogContext'
import { useToast } from '@/store/ToastContext'
import { useNow } from '@/hooks/useNow'
import { useIsCompact } from '@/hooks/useMediaQuery'
import { CATEGORIES } from '@/data/categories'
import { conflictPairs } from '@/lib/schedule'
import {
  addDays,
  addMinutes,
  atTime,
  fmtRelativeDay,
  fmtTimeShort,
  isSameDay,
  SLOT_MINUTES,
  snapToSlot,
  startOfDay,
  startOfMonth,
  toDate,
  weekDays,
} from '@/lib/date'

const ALL_CATEGORIES = new Set(CATEGORIES.map((c) => c.id))

export function CalendarPage() {
  const [params, setParams] = useSearchParams()
  const { events, moveEvent, undo } = useEvents()
  const dialog = useEventDialog()
  const { toast } = useToast()
  const navigate = useNavigate()
  const now = useNow()
  const isCompact = useIsCompact()

  const requestedView = params.get('view')
  const view = ['day', 'week', 'month'].includes(requestedView)
    ? requestedView
    : isCompact
      ? 'day'
      : 'week'
  const [anchor, setAnchor] = useState(() => {
    const raw = params.get('date')
    const parsed = raw ? new Date(`${raw}T00:00:00`) : null
    return parsed && !Number.isNaN(parsed.getTime()) ? parsed : new Date()
  })
  const [activeCategories, setActiveCategories] = useState(ALL_CATEGORIES)
  const [dragging, setDragging] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } })
  )

  const visibleEvents = useMemo(
    () => events.filter((e) => activeCategories.has(e.categoryId)),
    [events, activeCategories]
  )

  const setView = (next) => {
    params.set('view', next)
    setParams(params, { replace: true })
  }

  const step = useCallback(
    (direction) => {
      setAnchor((current) => {
        if (view === 'day') return addDays(current, direction)
        if (view === 'week') return addDays(current, direction * 7)
        const next = new Date(current)
        next.setMonth(next.getMonth() + direction, 1)
        return next
      })
    },
    [view]
  )

  const toggleCategory = (id) => {
    if (id === '__all__') {
      setActiveCategories(new Set(ALL_CATEGORIES))
      return
    }
    setActiveCategories((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next.size ? next : new Set(ALL_CATEGORIES)
    })
  }

  const handleDragEnd = ({ active, over, delta }) => {
    setDragging(null)
    const event = events.find((e) => e.id === active.id)
    if (!event) return

    const originalStart = toDate(event.start)
    let start = originalStart

    if (view !== 'month') {
      const rawMinutes = delta.y / PX_PER_MIN
      const snapped = Math.round(rawMinutes / SLOT_MINUTES) * SLOT_MINUTES
      start = addMinutes(originalStart, snapped)
    }

    const targetKey = parseDayDroppable(over?.id)
    if (targetKey) {
      const targetDay = new Date(`${targetKey}T00:00:00`)
      if (!isSameDay(targetDay, start)) {
        start = atTime(targetDay, start.getHours(), start.getMinutes())
      }
    }

    if (start.getTime() === originalStart.getTime()) return

    moveEvent(event.id, start)
    toast({
      tone: 'success',
      title: `Moved "${event.title}"`,
      description: `${fmtRelativeDay(start)} at ${fmtTimeShort(start)}`,
      action: { label: 'Undo', onClick: undo },
    })
  }

  const openCreateAt = (start) =>
    dialog.openNew({ start, end: addMinutes(start, 60), categoryId: 'deep-work' })

  const selectDay = (day) => {
    setAnchor(day)
    setView('day')
  }

  const daysInScope = useMemo(() => {
    if (view === 'day') return [startOfDay(anchor)]
    if (view === 'week') return weekDays(anchor)
    return []
  }, [view, anchor])

  const clashes = useMemo(
    () => daysInScope.flatMap((day) => conflictPairs(visibleEvents, day)),
    [daysInScope, visibleEvents]
  )

  return (
    <div className="flex flex-col gap-4">
      {clashes.length ? (
        <div className="flex items-center gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/[0.08] px-4 py-2.5">
          <AlertTriangle size={15} className="shrink-0 text-amber-600 dark:text-amber-400" strokeWidth={2.6} />
          <p className="text-xs font-semibold text-amber-800 dark:text-amber-200">
            {clashes.length} overlapping pair{clashes.length > 1 ? 's' : ''} in view — drag one aside,
            or ask the assistant to resolve it.
          </p>
        </div>
      ) : null}

      <Card className="flex h-[calc(100vh-13rem)] min-h-[520px] flex-col overflow-hidden p-4 sm:p-5 lg:h-[calc(100vh-11rem)]">
        <CalendarToolbar
          view={view}
          onViewChange={setView}
          anchor={anchor}
          onPrev={() => step(-1)}
          onNext={() => step(1)}
          onToday={() => setAnchor(view === 'month' ? startOfMonth(new Date()) : new Date())}
          activeCategories={activeCategories}
          onToggleCategory={toggleCategory}
        />

        <DndContext
          sensors={sensors}
          onDragStart={({ active }) => setDragging(active.data.current?.event ?? null)}
          onDragCancel={() => setDragging(null)}
          onDragEnd={handleDragEnd}
        >
          <div className="flex min-h-0 flex-1 flex-col pt-3">
            {view === 'week' ? (
              <WeekView
                anchor={anchor}
                events={visibleEvents}
                now={now}
                onOpenEvent={dialog.openEdit}
                onCreateAt={openCreateAt}
                onSelectDay={selectDay}
              />
            ) : null}
            {view === 'day' ? (
              <DayView
                anchor={anchor}
                events={visibleEvents}
                now={now}
                onOpenEvent={dialog.openEdit}
                onCreateAt={openCreateAt}
              />
            ) : null}
            {view === 'month' ? (
              <MonthView
                anchor={anchor}
                events={visibleEvents}
                onOpenEvent={dialog.openEdit}
                onSelectDay={selectDay}
              />
            ) : null}
          </div>

          <DragOverlay dropAnimation={null}>
            {dragging ? <EventDragPreview event={dragging} /> : null}
          </DragOverlay>
        </DndContext>
      </Card>

      <div className="safe-bottom fixed bottom-24 right-4 z-30 flex flex-col gap-2 lg:bottom-6 lg:right-6">
        <button
          type="button"
          onClick={() => dialog.openNew({ start: snapToSlot(addMinutes(now, 30)) })}
          aria-label="New event"
          title="New event"
          className="bg-primary grid h-12 w-12 place-items-center rounded-full shadow-[var(--shadow-ambient-lg)] transition-transform duration-200 ease-expo hover:scale-105 active:scale-95"
        >
          <Plus size={20} strokeWidth={2.2} />
        </button>
        <button
          type="button"
          onClick={() => navigate('/assistant')}
          aria-label="Ask Sage"
          title="Ask Sage"
          className="bg-accent grid h-12 w-12 place-items-center rounded-full shadow-[var(--shadow-ambient-lg)] transition-transform duration-200 ease-expo hover:scale-105 active:scale-95"
        >
          <Sparkles size={19} strokeWidth={2.2} />
        </button>
      </div>
    </div>
  )
}

export default CalendarPage
