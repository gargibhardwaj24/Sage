import { DAY_END_HOUR, DAY_START_HOUR } from '@/lib/date'

export const HOUR_HEIGHT = 56
export const PX_PER_MIN = HOUR_HEIGHT / 60
export const GRID_HEIGHT = (DAY_END_HOUR - DAY_START_HOUR) * HOUR_HEIGHT

export const HOURS = Array.from(
  { length: DAY_END_HOUR - DAY_START_HOUR + 1 },
  (_, i) => DAY_START_HOUR + i
)

export function offsetFor(date) {
  const d = date instanceof Date ? date : new Date(date)
  const minutes = d.getHours() * 60 + d.getMinutes() - DAY_START_HOUR * 60
  return minutes * PX_PER_MIN
}

export function initialScrollHour(now, anchor, settings = {}, anchorIsToday = false) {
  const workStart = Number.isFinite(Number(settings.workStartHour))
    ? Math.min(23, Math.max(0, Number(settings.workStartHour)))
    : 7

  if (!anchorIsToday) return workStart

  const current = now instanceof Date ? now.getHours() : new Date().getHours()
  return Math.min(21, Math.max(0, current - 1))
}

export const dayDroppableId = (key) => `day:${key}`
export const parseDayDroppable = (id) =>
  typeof id === 'string' && id.startsWith('day:') ? id.slice(4) : null
