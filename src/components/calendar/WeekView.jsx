import { useEffect, useRef } from 'react'
import { DayColumn, DayHeader, GridLines, TimeGutter } from './TimeGrid'
import { GRID_HEIGHT, HOUR_HEIGHT } from './constants'
import { eventsOnDay } from '@/lib/schedule'
import { DAY_START_HOUR, isToday, weekDays } from '@/lib/date'

export function WeekView({ anchor, events, now, onOpenEvent, onCreateAt, onSelectDay }) {
  const days = weekDays(anchor)
  const scroller = useRef(null)

  useEffect(() => {
    if (!scroller.current) return
    const focusHour = Math.max(DAY_START_HOUR, Math.min(now.getHours() - 1, 20))
    scroller.current.scrollTop = (focusHour - DAY_START_HOUR) * HOUR_HEIGHT
  }, [now])

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

        <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          <div className="flex pr-2" style={{ height: GRID_HEIGHT }}>
            <TimeGutter />
            <div className="relative flex flex-1">
              <GridLines />
              {days.map((day, i) => (
                <DayColumn
                  key={day.toISOString()}
                  day={day}
                  events={eventsOnDay(events, day)}
                  now={now}
                  onOpenEvent={onOpenEvent}
                  onCreateAt={onCreateAt}
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
