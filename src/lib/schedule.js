import {
  addDays,
  addMinutes,
  atTime,
  differenceInMinutes,
  durationMinutes,
  isSameDay,
  minutesSinceMidnight,
  overlaps,
  startOfDay,
  toDate,
} from '@/lib/date'

export function eventsOnDay(events, day) {
  const d = toDate(day)
  return events
    .filter((e) => isSameDay(toDate(e.start), d))
    .sort((a, b) => a.start.localeCompare(b.start))
}

export function eventsInRange(events, start, end) {
  const s = toDate(start)
  const e = toDate(end)
  return events
    .filter((ev) => overlaps(ev.start, ev.end, s, e))
    .sort((a, b) => a.start.localeCompare(b.start))
}

export function findConflicts(events, start, end, excludeId = null) {
  return events.filter(
    (e) => e.id !== excludeId && !e.completed && overlaps(e.start, e.end, start, end)
  )
}

export const isFree = (events, start, end, excludeId = null) =>
  findConflicts(events, start, end, excludeId).length === 0

export function freeSlots(events, day, options = {}) {
  const { workStartHour = 8, workEndHour = 20, minMinutes = 30, now = new Date() } = options

  const dayStart = atTime(day, workStartHour)
  const dayEnd = atTime(day, workEndHour)
  const from = isSameDay(toDate(day), now) && now > dayStart ? roundUp(now, 15) : dayStart
  if (from >= dayEnd) return []

  const busy = eventsOnDay(events, day)
    .filter((e) => !e.completed)
    .map((e) => ({ start: toDate(e.start), end: toDate(e.end) }))
    .sort((a, b) => a.start - b.start)

  const slots = []
  let cursor = from

  for (const b of busy) {
    if (b.end <= cursor) continue
    if (b.start > cursor) {
      const slotEnd = b.start < dayEnd ? b.start : dayEnd
      if (differenceInMinutes(slotEnd, cursor) >= minMinutes) {
        slots.push({ start: cursor, end: slotEnd, minutes: differenceInMinutes(slotEnd, cursor) })
      }
    }
    if (b.end > cursor) cursor = b.end
    if (cursor >= dayEnd) break
  }

  if (cursor < dayEnd && differenceInMinutes(dayEnd, cursor) >= minMinutes) {
    slots.push({ start: cursor, end: dayEnd, minutes: differenceInMinutes(dayEnd, cursor) })
  }

  return slots
}

export function freeSlotsAcross(events, fromDay, days, options = {}) {
  const out = []
  for (let i = 0; i < days; i += 1) {
    const day = addDays(startOfDay(toDate(fromDay)), i)
    for (const slot of freeSlots(events, day, options)) out.push({ ...slot, day })
  }
  return out
}

const roundUp = (date, step) => {
  const d = toDate(date)
  const mins = d.getHours() * 60 + d.getMinutes()
  return addMinutes(startOfDay(d), Math.ceil(mins / step) * step)
}

export function suggestAlternatives(events, desiredStart, minutes, options = {}) {
  const {
    excludeId = null,
    workStartHour = 8,
    workEndHour = 20,
    searchDays = 4,
    limit = 3,
    now = new Date(),
    preferMornings = false,
  } = options

  const desired = toDate(desiredStart)
  const candidates = []

  for (let dayOffset = 0; dayOffset < searchDays; dayOffset += 1) {
    const day = addDays(startOfDay(desired), dayOffset)
    const slots = freeSlots(events, day, { workStartHour, workEndHour, minMinutes: minutes, now })

    for (const slot of slots) {
      const probes = new Set([slot.start.getTime(), addMinutes(slot.end, -minutes).getTime()])
      const aligned = roundUp(slot.start, 30)
      if (aligned >= slot.start && addMinutes(aligned, minutes) <= slot.end) {
        probes.add(aligned.getTime())
      }
      const sameClock = atTime(day, desired.getHours(), desired.getMinutes())
      if (sameClock >= slot.start && addMinutes(sameClock, minutes) <= slot.end) {
        probes.add(sameClock.getTime())
      }

      for (const ms of probes) {
        const start = new Date(ms)
        const end = addMinutes(start, minutes)
        if (start < slot.start || end > slot.end) continue
        if (start < now) continue
        if (!isFree(events, start, end, excludeId)) continue
        candidates.push({ start, end, score: scoreCandidate(start, desired, dayOffset, preferMornings) })
      }
    }
  }

  candidates.sort((a, b) => b.score - a.score)

  const seen = new Set()
  const unique = []
  for (const c of candidates) {
    const key = c.start.getTime()
    if (seen.has(key)) continue
    seen.add(key)
    unique.push({ ...c, reason: describeAlternative(c.start, desired) })
    if (unique.length >= limit) break
  }
  return unique
}

function scoreCandidate(start, desired, dayOffset, preferMornings) {
  let score = 100 - dayOffset * 22
  const clockDelta = Math.abs(minutesSinceMidnight(start) - minutesSinceMidnight(desired))
  score -= clockDelta / 12

  const hour = start.getHours()
  if (preferMornings && hour >= 8 && hour <= 11) score += 12

  const offHours = hour < 7 ? 7 - hour : hour >= 21 ? hour - 20 : 0
  if (offHours > 0 && clockDelta > 90) score -= 8 * offHours

  if (start.getMinutes() === 0) score += 4
  return score
}

function describeAlternative(start, desired) {
  if (!isSameDay(start, desired)) return 'next free day'
  const delta = differenceInMinutes(start, desired)
  if (delta === 0) return 'exactly when you asked'
  return `${formatDelta(Math.abs(delta))} ${delta > 0 ? 'later' : 'earlier'}`
}

function formatDelta(mins) {
  if (mins < 60) return `${mins} min`
  const hours = Math.floor(mins / 60)
  const rest = mins % 60
  return rest ? `${hours}h ${rest}m` : `${hours}h`
}

export function layoutDay(events) {
  const sorted = [...events].sort(
    (a, b) => a.start.localeCompare(b.start) || b.end.localeCompare(a.end)
  )

  const laidOut = []
  let cluster = []
  let clusterEnd = null

  const flush = () => {
    if (!cluster.length) return
    const columns = []
    for (const ev of cluster) {
      let placed = false
      for (let i = 0; i < columns.length; i += 1) {
        const last = columns[i][columns[i].length - 1]
        if (toDate(last.end) <= toDate(ev.start)) {
          columns[i].push(ev)
          ev._col = i
          placed = true
          break
        }
      }
      if (!placed) {
        columns.push([ev])
        ev._col = columns.length - 1
      }
    }
    for (const ev of cluster) {
      laidOut.push({ event: ev, column: ev._col, columns: columns.length })
      delete ev._col
    }
    cluster = []
    clusterEnd = null
  }

  for (const ev of sorted) {
    if (clusterEnd && toDate(ev.start) >= clusterEnd) flush()
    cluster.push(ev)
    const end = toDate(ev.end)
    clusterEnd = clusterEnd && clusterEnd > end ? clusterEnd : end
  }
  flush()

  return laidOut
}

export function totalMinutes(events, predicate = () => true) {
  return events.reduce((sum, e) => (predicate(e) ? sum + durationMinutes(e.start, e.end) : sum), 0)
}

export function nextUpcoming(events, now = new Date()) {
  return (
    events
      .filter((e) => toDate(e.start) > now && !e.completed)
      .sort((a, b) => a.start.localeCompare(b.start))[0] ?? null
  )
}

export function currentEvent(events, now = new Date()) {
  return events.find((e) => toDate(e.start) <= now && toDate(e.end) > now && !e.completed) ?? null
}

export function conflictPairs(events, day) {
  const list = eventsOnDay(events, day).filter((e) => !e.completed)
  const pairs = []
  for (let i = 0; i < list.length; i += 1) {
    for (let j = i + 1; j < list.length; j += 1) {
      if (overlaps(list[i].start, list[i].end, list[j].start, list[j].end)) {
        pairs.push([list[i], list[j]])
      }
    }
  }
  return pairs
}
