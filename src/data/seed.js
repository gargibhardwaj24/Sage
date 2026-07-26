import { addDays, atTime, addMinutes, iso, startOfDay } from '@/lib/date'
import { uid } from '@/lib/id'

function rng(seed) {
  let t = seed + 0x6d2b79f5
  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

const ROUTINE = [
  { days: [1, 3, 5], h: 7, m: 0, min: 45, title: 'Morning run', cat: 'fitness' },
  {
    days: [1, 2, 3, 4, 5],
    h: 8,
    m: 30,
    min: 120,
    title: 'Deep work · Project Atlas',
    cat: 'deep-work',
    notes: 'Phone in the other room. One outcome only.',
    reminder: 10,
  },
  { days: [1, 2, 3, 4, 5], h: 11, m: 0, min: 45, title: 'Inbox & admin batch', cat: 'admin' },
  { days: [1, 2, 3, 4, 5], h: 12, m: 30, min: 45, title: 'Lunch & reset', cat: 'personal' },
  { days: [1, 3], h: 14, m: 0, min: 30, title: 'Team standup', cat: 'meeting', reminder: 5 },
  { days: [2], h: 14, m: 0, min: 60, title: 'Design review', cat: 'meeting', reminder: 10 },
  { days: [4], h: 15, m: 30, min: 45, title: '1:1 with mentor', cat: 'meeting', reminder: 15 },
  { days: [2, 4], h: 15, m: 0, min: 60, title: 'System design reading', cat: 'learning' },
  {
    days: [1, 2, 3, 4, 5, 6],
    h: 17,
    m: 0,
    min: 90,
    title: 'DSA practice',
    cat: 'learning',
    notes: 'Two problems: one graph, one DP.',
    reminder: 15,
  },
  { days: [2, 4], h: 19, m: 30, min: 60, title: 'Strength training', cat: 'fitness' },
  { days: [1, 3, 5], h: 20, m: 30, min: 45, title: 'Reading & wind down', cat: 'personal' },
  { days: [6], h: 9, m: 30, min: 90, title: 'Long run', cat: 'fitness' },
  { days: [6, 0], h: 11, m: 0, min: 120, title: 'Side project · Sage', cat: 'deep-work' },
  { days: [0], h: 19, m: 0, min: 90, title: 'Family dinner', cat: 'personal' },
  { days: [0], h: 16, m: 0, min: 45, title: 'Weekly review & plan', cat: 'admin', reminder: 30 },
]

const ONE_OFFS = [
  { offset: 1, h: 10, m: 0, min: 60, title: 'Portfolio site polish', cat: 'deep-work' },
  { offset: 2, h: 16, m: 30, min: 45, title: 'Mock interview', cat: 'learning', reminder: 30 },
  { offset: 3, h: 13, m: 0, min: 60, title: 'Coffee with Aarav', cat: 'personal' },
  { offset: 5, h: 10, m: 0, min: 90, title: 'Open-source contribution', cat: 'deep-work' },
  { offset: -2, h: 18, m: 30, min: 60, title: 'Recruiter call', cat: 'meeting' },
]

const PAST_DAYS = 84
const FUTURE_DAYS = 12

export function createSeedEvents(now = new Date()) {
  const today = startOfDay(now)
  const events = []

  const push = (start, min, title, cat, extra = {}) => {
    events.push({
      id: uid('ev'),
      title,
      notes: extra.notes ?? '',
      start: iso(start),
      end: iso(addMinutes(start, min)),
      categoryId: cat,
      completed: extra.completed ?? false,
      reminderMinutes: extra.reminder ?? null,
      priority: extra.priority ?? null,
      method: extra.method ?? null,
      source: extra.source ?? 'user',
      createdAt: iso(addDays(start, -3)),
    })
  }

  for (let offset = -PAST_DAYS; offset <= FUTURE_DAYS; offset += 1) {
    const day = addDays(today, offset)
    const dow = day.getDay()
    const rand = rng(offset * 7919 + dow)
    const isPast = offset < 0
    const restDay = isPast && rand() < 0.11

    for (const slot of ROUTINE) {
      if (!slot.days.includes(dow)) continue
      if (rand() < 0.14) continue

      const jitter = Math.round((rand() - 0.5) * 2) * 15
      const start = addMinutes(atTime(day, slot.h, slot.m), jitter)

      let completed = false
      if (isPast && !restDay) {
        const recency = 1 - Math.min(1, Math.abs(offset) / PAST_DAYS)
        const base = slot.cat === 'meeting' || slot.cat === 'personal' ? 0.72 : 0.45
        completed = rand() < base + recency * 0.35
      }

      push(start, slot.min, slot.title, slot.cat, {
        notes: slot.notes,
        reminder: slot.reminder,
        completed,
      })
    }
  }

  for (const o of ONE_OFFS) {
    const start = atTime(addDays(today, o.offset), o.h, o.m)
    push(start, o.min, o.title, o.cat, {
      reminder: o.reminder,
      completed: o.offset < 0,
    })
  }

  const hasDsaToday = events.some(
    (e) => e.title === 'DSA practice' && startOfDay(new Date(e.start)).getTime() === today.getTime()
  )
  if (!hasDsaToday) {
    push(atTime(today, 17, 0), 90, 'DSA practice', 'learning', {
      notes: 'Two problems: one graph, one DP.',
      reminder: 15,
    })
  }

  return events.sort((a, b) => a.start.localeCompare(b.start))
}
