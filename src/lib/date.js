import {
  addDays,
  addMinutes,
  differenceInCalendarDays,
  differenceInMinutes,
  eachDayOfInterval,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isToday,
  isTomorrow,
  isYesterday,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns'

export const WEEK_OPTS = { weekStartsOn: 1 }

export const DAY_START_HOUR = 6
export const DAY_END_HOUR = 23
export const SLOT_MINUTES = 30
export const HOURS_IN_VIEW = DAY_END_HOUR - DAY_START_HOUR

export function toDate(value) {
  if (value instanceof Date) return value
  if (typeof value === 'number') return new Date(value)
  return parseISO(value)
}

export const iso = (date) => toDate(date).toISOString()

export const fmtTime = (d) => format(toDate(d), 'h:mm a')
export const fmtTimeShort = (d) => {
  const date = toDate(d)
  return format(date, date.getMinutes() === 0 ? 'h a' : 'h:mm a')
}
export const fmtRange = (s, e) => `${fmtTimeShort(s)} – ${fmtTimeShort(e)}`
export const fmtDay = (d) => format(toDate(d), 'EEE, MMM d')
export const fmtDayLong = (d) => format(toDate(d), 'EEEE, MMMM d')
export const fmtMonth = (d) => format(toDate(d), 'MMMM yyyy')
export const dayKey = (d) => format(toDate(d), 'yyyy-MM-dd')

export function fmtRelativeDay(value) {
  const d = toDate(value)
  if (isToday(d)) return 'today'
  if (isTomorrow(d)) return 'tomorrow'
  if (isYesterday(d)) return 'yesterday'
  const delta = differenceInCalendarDays(d, new Date())
  if (delta > 1 && delta < 7) return format(d, 'EEEE')
  return format(d, 'EEE, MMM d')
}

export function minutesSinceMidnight(value) {
  const d = toDate(value)
  return d.getHours() * 60 + d.getMinutes()
}

export const durationMinutes = (start, end) =>
  Math.max(0, differenceInMinutes(toDate(end), toDate(start)))

export function humanDuration(minutes) {
  const m = Math.round(minutes)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  const rem = m % 60
  if (!rem) return `${h}h`
  return `${h}h ${rem}m`
}

export function snapToSlot(date, slot = SLOT_MINUTES, mode = 'nearest') {
  const d = toDate(date)
  const mins = d.getHours() * 60 + d.getMinutes()
  const rounder = mode === 'floor' ? Math.floor : Math.round
  const snapped = rounder(mins / slot) * slot
  const out = startOfDay(d)
  return addMinutes(out, snapped)
}

export function atTime(day, hours, minutes = 0) {
  const d = startOfDay(toDate(day))
  d.setHours(hours, minutes, 0, 0)
  return d
}

export function weekDays(anchor) {
  const start = startOfWeek(toDate(anchor), WEEK_OPTS)
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

export function monthMatrix(anchor) {
  const start = startOfWeek(startOfMonth(toDate(anchor)), WEEK_OPTS)
  const end = endOfWeek(endOfMonth(toDate(anchor)), WEEK_OPTS)
  const days = eachDayOfInterval({ start, end })
  while (days.length < 42) days.push(addDays(days[days.length - 1], 1))
  return days
}

export function overlaps(aStart, aEnd, bStart, bEnd) {
  return toDate(aStart) < toDate(bEnd) && toDate(bStart) < toDate(aEnd)
}

export function clampToWorkingWindow(date) {
  const d = toDate(date)
  const mins = minutesSinceMidnight(d)
  if (mins < DAY_START_HOUR * 60) return atTime(d, DAY_START_HOUR)
  if (mins > DAY_END_HOUR * 60) return atTime(d, DAY_END_HOUR)
  return d
}

export function gridPosition(start, end) {
  const total = HOURS_IN_VIEW * 60
  const startMin = Math.max(0, minutesSinceMidnight(start) - DAY_START_HOUR * 60)
  const endMin = Math.min(total, minutesSinceMidnight(end) - DAY_START_HOUR * 60)
  const top = (startMin / total) * 100
  const height = (Math.max(endMin - startMin, 18) / total) * 100
  return { top, height: Math.min(height, 100 - top) }
}

export function partOfDay(date) {
  const h = toDate(date).getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  if (h < 21) return 'evening'
  return 'night'
}

export function greeting(date = new Date()) {
  const h = toDate(date).getHours()
  if (h < 5) return 'Still up'
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  if (h < 21) return 'Good evening'
  return 'Winding down'
}

export {
  addDays,
  addMinutes,
  differenceInCalendarDays,
  differenceInMinutes,
  eachDayOfInterval,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isToday,
  isTomorrow,
  isYesterday,
  startOfDay,
  startOfMonth,
  startOfWeek,
}
