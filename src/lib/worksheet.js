import {
  addDays,
  addMinutes,
  atTime,
  durationMinutes,
  fmtDay,
  iso,
  startOfDay,
  startOfWeek,
  toDate,
  WEEK_OPTS,
} from '@/lib/date'
import { freeSlots } from '@/lib/schedule'
import { DEFAULT_CATEGORY } from '@/data/categories'

export const slotKey = (hour, minute) =>
  `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`

export function slotsOf(sheet) {
  const out = []
  for (let hour = sheet.startHour; hour <= sheet.endHour; hour += 1) {
    for (let minute = 0; minute < 60; minute += sheet.slotMinutes) {
      out.push({ hour, minute, key: slotKey(hour, minute) })
    }
  }
  return out
}

export function rowsOf(sheet) {
  const rows = []
  for (let hour = sheet.startHour; hour <= sheet.endHour; hour += 1) {
    const keys = []
    for (let minute = 0; minute < 60; minute += sheet.slotMinutes) {
      keys.push({ minute, key: slotKey(hour, minute) })
    }
    rows.push({ hour, keys })
  }
  return rows
}

export function parseClock(value) {
  const [h, m] = String(value ?? '09:00').split(':')
  const hour = Number(h)
  const minute = Number(m)
  return {
    hour: Number.isFinite(hour) ? Math.min(23, Math.max(0, hour)) : 9,
    minute: Number.isFinite(minute) ? Math.min(59, Math.max(0, minute)) : 0,
  }
}

const at = (day, clock) => {
  const { hour, minute } = parseClock(clock)
  return atTime(day, hour, minute)
}

const draft = (values) => ({ source: 'template', ...values })

const poolEvent = (d, index) => ({
  id: `draft-${index}`,
  start: iso(d.start),
  end: iso(d.end),
  completed: false,
  categoryId: d.categoryId,
})

function nextFreeSlot(pool, day, minutes, options) {
  const [first] = freeSlots(pool, day, { ...options, minMinutes: minutes })
  if (!first) return null
  return { start: first.start, end: addMinutes(first.start, minutes) }
}

function buildTimebox(state, { sheet, date, methodId }) {
  const drafts = []
  let open = null

  const flush = () => {
    if (open) drafts.push(open)
    open = null
  }

  for (const slot of slotsOf(sheet)) {
    const cell = state.slots?.[slot.key]
    const title = (cell?.text ?? '').trim()

    if (!title) {
      flush()
      continue
    }

    const categoryId = cell.categoryId ?? DEFAULT_CATEGORY
    const priority = cell.priority ?? null
    const start = atTime(date, slot.hour, slot.minute)
    const end = addMinutes(start, sheet.slotMinutes)

    if (
      open &&
      open.title === title &&
      open.categoryId === categoryId &&
      open.priority === priority &&
      open.end.getTime() === start.getTime()
    ) {
      open.end = end
      continue
    }

    flush()
    open = draft({ title, categoryId, priority, start, end, method: methodId })
  }

  flush()
  return { drafts, notices: [] }
}

function buildRows(state, { date, methodId }) {
  const drafts = (state.rows ?? [])
    .filter((row) => row.title.trim())
    .map((row) => {
      const start = at(date, row.start)
      return draft({
        title: row.title.trim(),
        notes: (row.notes ?? '').trim(),
        categoryId: row.categoryId ?? DEFAULT_CATEGORY,
        start,
        end: addMinutes(start, Math.max(5, row.minutes ?? 60)),
        method: methodId,
      })
    })

  return { drafts, notices: [] }
}

function buildThemes(state, { date, methodId }) {
  const weekStart = startOfWeek(toDate(date), WEEK_OPTS)

  const drafts = (state.rows ?? [])
    .filter((row) => row.title.trim())
    .map((row) => {
      const day = addDays(weekStart, row.day)
      const start = at(day, row.start)
      return draft({
        title: `Theme · ${row.title.trim()}`,
        notes: (row.notes ?? '').trim(),
        categoryId: row.categoryId ?? DEFAULT_CATEGORY,
        start,
        end: addMinutes(start, Math.max(30, row.minutes ?? 240)),
        method: methodId,
      })
    })

  const blank = (state.rows ?? []).length - drafts.length
  const notices = blank
    ? [`${blank} ${blank === 1 ? 'day is' : 'days are'} left unthemed and will not be scheduled.`]
    : []

  return { drafts, notices }
}

function buildFrog(state, { sheet, date, methodId }) {
  const title = (state.frog ?? '').trim()
  if (!title) return { drafts: [], notices: [] }

  const firstAction = (state.firstAction ?? '').trim()
  const start = at(date, state.start ?? sheet.start)
  const minutes = Math.max(15, state.minutes ?? sheet.minutes)
  const end = addMinutes(start, minutes)

  const drafts = [
    draft({
      title: `🐸 ${title}`,
      notes: firstAction ? `First action: ${firstAction}` : '',
      categoryId: sheet.categoryId,
      start,
      end,
      method: methodId,
    }),
  ]

  const rewardTitle = (state.rewardTitle ?? sheet.reward.title).trim()
  if (state.rewardEnabled !== false && rewardTitle) {
    drafts.push(
      draft({
        title: rewardTitle,
        categoryId: sheet.reward.categoryId,
        start: end,
        end: addMinutes(end, sheet.reward.minutes),
        method: methodId,
      })
    )
  }

  const notices = (state.avoiding ?? '').trim()
    ? ['Your “why I am avoiding it” note stays on the sheet, not the calendar.']
    : []

  return { drafts, notices }
}

function buildMatrix(state, { sheet, date, methodId, events = [], settings = {}, now = new Date() }) {
  const options = {
    workStartHour: settings.workStartHour ?? 8,
    workEndHour: settings.workEndHour ?? 20,
    now,
  }

  const drafts = []
  const notices = []
  const pool = () => [...events, ...drafts.map(poolEvent)]

  const tasksIn = (id) => (state.quadrants?.[id] ?? []).filter((t) => t.title.trim())

  for (const quadrant of sheet.quadrants) {
    const tasks = tasksIn(quadrant.id)
    if (!tasks.length) continue

    if (quadrant.mode === 'drop') {
      notices.push(`${tasks.length} Q4 ${tasks.length === 1 ? 'item is' : 'items are'} deleted, not scheduled.`)
      continue
    }

    if (quadrant.mode === 'batch') {
      const slot = nextFreeSlot(pool(), date, quadrant.minutes, options)
      if (!slot) {
        notices.push(`No room for the Q3 batch on ${fmtDay(date)}.`)
        continue
      }
      drafts.push(
        draft({
          title: quadrant.batchTitle,
          notes: tasks.map((t) => `· ${t.title.trim()}`).join('\n'),
          categoryId: quadrant.categoryId,
          priority: quadrant.id,
          start: slot.start,
          end: slot.end,
          method: methodId,
        })
      )
      continue
    }

    const spreads = quadrant.mode === 'spread'
    const anchor = startOfDay(toDate(date))
    let unplaced = 0
    let offset = 0

    for (const task of tasks) {
      const minutes = Math.max(15, task.minutes ?? quadrant.minutes)
      let slot = null
      let landed = offset

      for (let i = offset; i < (spreads ? sheet.spreadDays : 1) && !slot; i += 1) {
        landed = i
        slot = nextFreeSlot(pool(), addDays(anchor, spreads ? i : 0), minutes, options)
      }

      if (!slot) {
        unplaced += 1
        continue
      }

      drafts.push(
        draft({
          title: task.title.trim(),
          categoryId: quadrant.categoryId,
          priority: quadrant.id,
          start: slot.start,
          end: slot.end,
          method: methodId,
        })
      )

      if (spreads) offset = landed + 1
    }

    if (unplaced) {
      notices.push(
        `${unplaced} ${quadrant.id.toUpperCase()} ${unplaced === 1 ? 'task' : 'tasks'} did not fit — free up some space or widen your day in Preferences.`
      )
    }
  }

  return { drafts: drafts.sort((a, b) => a.start - b.start), notices }
}

export const SHEET_KINDS = {
  timebox: {
    init: (sheet) => ({
      slots: {},
      priorities: sheet.priorities.map((p) => ({ ...p, text: '' })),
      notes: '',
    }),
    build: buildTimebox,
  },
  rows: {
    init: (sheet) => ({ rows: sheet.rows.map((r) => ({ ...r, notes: '' })) }),
    build: buildRows,
  },
  themes: {
    init: (sheet) => ({ rows: sheet.rows.map((r) => ({ ...r, notes: '' })) }),
    build: buildThemes,
  },
  frog: {
    init: (sheet) => ({
      frog: '',
      avoiding: '',
      firstAction: '',
      start: sheet.start,
      minutes: sheet.minutes,
      rewardTitle: sheet.reward.title,
      rewardEnabled: true,
    }),
    build: buildFrog,
  },
  matrix: {
    init: (sheet) => ({
      quadrants: Object.fromEntries(sheet.quadrants.map((q) => [q.id, []])),
    }),
    build: buildMatrix,
  },
}

export function buildDrafts(sheet, state, ctx) {
  const kind = SHEET_KINDS[sheet.kind]
  if (!kind) return { drafts: [], notices: [] }
  return kind.build(state, { ...ctx, sheet })
}

export function draftConflicts(events, drafts) {
  const hits = new Map()

  for (const d of drafts) {
    for (const event of events) {
      if (event.completed) continue
      if (toDate(event.start) < d.end && d.start < toDate(event.end)) {
        hits.set(event.id, event)
      }
    }
  }

  return [...hits.values()].sort((a, b) => a.start.localeCompare(b.start))
}

export const plannedMinutes = (drafts) =>
  drafts.reduce((sum, d) => sum + durationMinutes(d.start, d.end), 0)
