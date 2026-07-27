import { useEffect, useRef } from 'react'
import { AllDayRow, DayColumn, DayHeader, GridLines, OffHours, TimeGutter } from './TimeGrid'
import { GRID_HEIGHT, HOUR_HEIGHT, initialScrollHour } from './constants'
import { eventsOnDay } from '@/lib/schedule'
import { isToday, weekDays } from '@/lib/date'
import { useSettings } from '@/store/SettingsContext'

export function WeekView({ anchor, events, now, onOpenEvent, onCreateAt, onSelectDay, onResizeEvent }) {
  const days = weekDays(anchor)
  const scroller = useRef(null)
  const { settings } = useSettings()
  const focusHour = initialScrollHour(now, anchor, settings, days.some(isToday))

  useEffect(() => {
    if (!scroller.current) return
    scroller.current.scrollTop = focusHour * HOUR_HEIGHT
  }, [focusHour])

  return (
    <div className="flex min-h-0 flex-1 overflow-x-auto">
      <div className="flex min-h-0 min-w-[640px] flex-1 flex-col sm:min-w-0">
        <div className="flex border-b pr-2">
          <div className="w-12 shrink-0 sm:w-14" />
          <div className="flex flex-1">
            {days.map((day) => (
              <DayHeader
                key={day.toISOString()}
                day={day}
                count={eventsOnDay(events, day).length}
                onClick={() => onSelectDay?.(day)}
              />
            ))}
          </div>
        </div>

        <AllDayRow days={days} events={events} onOpenEvent={onOpenEvent} />

        <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          <div className="flex pr-2" style={{ height: GRID_HEIGHT }}>
            <TimeGutter />
            <div className="relative flex flex-1">
              <OffHours />
              <GridLines />
              {days.map((day, i) => (
                <DayColumn
                  key={day.toISOString()}
                  day={day}
                  events={events}
                  now={now}
                  onOpenEvent={onOpenEvent}
                  onCreateAt={onCreateAt}
                  onResizeEvent={onResizeEvent}
                  showNowBadge={i === 0}
                  className={isToday(day) ? 'bg-[rgb(var(--accent))]/[0.04]' : undefined}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WeekView
