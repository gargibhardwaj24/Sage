import {
  addDays,
  dayKey,
  differenceInCalendarDays,
  durationMinutes,
  endOfDay,
  isSameDay,
  startOfDay,
  startOfWeek,
  toDate,
  weekDays,
  WEEK_OPTS,
} from '@/lib/date'
import { getAllCategories, isFocusCategory, getCategory } from '@/data/categories'

export const SCORE_WEIGHTS = [
  {
    key: 'completion',
    label: 'Follow-through',
    weight: 0.4,
    hint: 'Share of events that were due and actually got done.',
  },
  {
    key: 'focus',
    label: 'Focus depth',
    weight: 0.28,
    hint: 'Deep work and learning hours against your weekly target.',
  },
  {
    key: 'consistency',
    label: 'Consistency',
    weight: 0.2,
    hint: 'Days this week where you finished at least one thing.',
  },
  {
    key: 'balance',
    label: 'Recovery',
    weight: 0.12,
    hint: 'Movement and personal time — the fuel the rest runs on.',
  },
]

const RECOVERY_TARGET_MINUTES = 300

export function weekStats(events, anchor, options = {}) {
  const { focusTargetHours = 20, now = new Date() } = options
  const start = startOfWeek(toDate(anchor), WEEK_OPTS)
  const end = endOfDay(addDays(start, 6))
  const days = weekDays(start)

  const inWeek = events.filter((e) => {
    if (e.source === 'holiday') return false
    const s = toDate(e.start)
    return s >= start && s <= end
  })

  const due = inWeek.filter((e) => toDate(e.end) <= now)
  const completed = inWeek.filter((e) => e.completed)

  const plannedMinutes = inWeek.reduce((n, e) => n + durationMinutes(e.start, e.end), 0)
  const completedMinutes = completed.reduce((n, e) => n + durationMinutes(e.start, e.end), 0)
  const focusMinutes = completed
    .filter((e) => isFocusCategory(e.categoryId))
    .reduce((n, e) => n + durationMinutes(e.start, e.end), 0)
  const recoveryMinutes = completed
    .filter((e) => e.categoryId === 'fitness' || e.categoryId === 'personal')
    .reduce((n, e) => n + durationMinutes(e.start, e.end), 0)

  const elapsedDays = Math.min(7, Math.max(1, differenceInCalendarDays(now, start) + 1))
  const activeDays = new Set(completed.map((e) => dayKey(e.start))).size

  const components = {
    completion: due.length ? completed.filter((e) => toDate(e.end) <= now).length / due.length : 0,
    focus: Math.min(1, focusMinutes / 60 / Math.max(1, focusTargetHours)),
    consistency: Math.min(1, activeDays / elapsedDays),
    balance: Math.min(1, recoveryMinutes / RECOVERY_TARGET_MINUTES),
  }

  const score = Math.round(
    100 * SCORE_WEIGHTS.reduce((sum, w) => sum + w.weight * (components[w.key] ?? 0), 0)
  )

  const byCategory = getAllCategories().map((c) => {
    const list = inWeek.filter((e) => e.categoryId === c.id)
    return {
      id: c.id,
      name: c.name,
      minutes: list.reduce((n, e) => n + durationMinutes(e.start, e.end), 0),
      hours: round1(list.reduce((n, e) => n + durationMinutes(e.start, e.end), 0) / 60),
      count: list.length,
    }
  }).filter((c) => c.minutes > 0)

  const byDay = days.map((day) => {
    const list = inWeek.filter((e) => isSameDay(toDate(e.start), day))
    const doneList = list.filter((e) => e.completed)
    const focus = doneList
      .filter((e) => isFocusCategory(e.categoryId))
      .reduce((n, e) => n + durationMinutes(e.start, e.end), 0)
    const other = doneList
      .filter((e) => !isFocusCategory(e.categoryId))
      .reduce((n, e) => n + durationMinutes(e.start, e.end), 0)
    return {
      day,
      label: day.toLocaleDateString(undefined, { weekday: 'short' }),
      planned: list.length,
      completed: doneList.length,
      focusHours: round1(focus / 60),
      otherHours: round1(other / 60),
      isFuture: startOfDay(day) > startOfDay(now),
    }
  })

  return {
    start,
    end,
    events: inWeek,
    plannedCount: inWeek.length,
    completedCount: completed.length,
    dueCount: due.length,
    plannedHours: round1(plannedMinutes / 60),
    completedHours: round1(completedMinutes / 60),
    focusHours: round1(focusMinutes / 60),
    recoveryHours: round1(recoveryMinutes / 60),
    completionRate: components.completion,
    components,
    score,
    byCategory,
    byDay,
  }
}

export function scoreTrend(events, count = 8, options = {}) {
  const thisWeek = startOfWeek(options.now ?? new Date(), WEEK_OPTS)
  return Array.from({ length: count }, (_, i) => {
    const anchor = addDays(thisWeek, (i - (count - 1)) * 7)
    const stats = weekStats(events, anchor, options)
    return {
      label: anchor.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      score: stats.score,
      focusHours: stats.focusHours,
      completed: stats.completedCount,
      isCurrent: i === count - 1,
    }
  })
}

export function streaks(events, now = new Date()) {
  const done = new Set(
    events.filter((e) => e.completed && e.source !== 'holiday').map((e) => dayKey(e.start))
  )
  if (!done.size) return { current: 0, longest: 0, lastActive: null }

  let current = 0
  let cursor = startOfDay(now)
  if (!done.has(dayKey(cursor))) cursor = addDays(cursor, -1)
  while (done.has(dayKey(cursor))) {
    current += 1
    cursor = addDays(cursor, -1)
  }

  const sorted = [...done].sort()
  let longest = 0
  let run = 0
  let prev = null
  for (const key of sorted) {
    const d = new Date(`${key}T00:00:00`)
    run = prev && differenceInCalendarDays(d, prev) === 1 ? run + 1 : 1
    longest = Math.max(longest, run)
    prev = d
  }

  return { current, longest: Math.max(longest, current), lastActive: sorted[sorted.length - 1] }
}

export function focusByHour(events, options = {}) {
  const { weeks = 4, now = new Date() } = options
  const since = addDays(startOfDay(now), -weeks * 7)
  const buckets = Array.from({ length: 24 }, (_, hour) => ({ hour, minutes: 0 }))

  for (const e of events) {
    if (e.source === 'holiday' || !e.completed || !isFocusCategory(e.categoryId)) continue
    const start = toDate(e.start)
    if (start < since) continue
    buckets[start.getHours()].minutes += durationMinutes(e.start, e.end)
  }
  return buckets
}

export function peakFocusHour(events, options = {}) {
  const buckets = focusByHour(events, options)
  const best = buckets.reduce((a, b) => (b.minutes > a.minutes ? b : a), buckets[0])
  return best.minutes > 0 ? best : null
}

export function dominantCategory(stats) {
  if (!stats.byCategory.length) return null
  const top = [...stats.byCategory].sort((a, b) => b.minutes - a.minutes)[0]
  return { ...top, category: getCategory(top.id) }
}

export function round1(n) {
  return Math.round(n * 10) / 10
}

export function scoreLabel(score) {
  if (score >= 85) return { label: 'Exceptional', tone: 'good' }
  if (score >= 70) return { label: 'Strong week', tone: 'good' }
  if (score >= 55) return { label: 'Solid', tone: 'warning' }
  if (score >= 35) return { label: 'Patchy', tone: 'serious' }
  return { label: 'Needs a reset', tone: 'critical' }
}
