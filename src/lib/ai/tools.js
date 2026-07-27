import { getAllCategories, DEFAULT_CATEGORY } from '@/data/categories'
import { METHODS, getMethod } from '@/data/methods'
import {
  addDays,
  addMinutes,
  durationMinutes,
  format,
  fmtRelativeDay,
  fmtTimeShort,
  startOfDay,
  startOfWeek,
  toDate,
  WEEK_OPTS,
} from '@/lib/date'
import {
  eventsInRange,
  findConflicts,
  freeSlotsAcross,
  suggestAlternatives,
} from '@/lib/schedule'
import { peakFocusHour, streaks, weekStats } from '@/lib/analytics'
import { serializeEvent } from './context'
import { uid } from '@/lib/id'

const CATEGORY_IDS = () => getAllCategories().map((c) => c.id)
const METHOD_IDS = METHODS.map((m) => m.id)

const LOCAL_ISO = "yyyy-MM-dd'T'HH:mm:ss"

function parseLocal(value) {
  if (!value) return null
  const cleaned = String(value).trim().replace(' ', 'T').replace(/Z$/, '')
  const date = new Date(cleaned)
  return Number.isNaN(date.getTime()) ? null : date
}

const buildToolDeclarations = () => [
  {
    type: 'function',
    name: 'get_schedule',
    description:
      'Read the events on a range of days. Use when the user asks about a period outside the snapshot, or when you need the full detail of a day.',
    parameters: {
      type: 'object',
      properties: {
        from: { type: 'string', description: 'First day, YYYY-MM-DD. Defaults to today.' },
        days: { type: 'number', description: 'How many days to read, 1 to 31. Defaults to 1.' },
      },
      required: [],
    },
  },
  {
    type: 'function',
    name: 'check_availability',
    description:
      'Check whether a specific time window is free. Always use this before proposing to move or create something at a given time.',
    parameters: {
      type: 'object',
      properties: {
        start: { type: 'string', description: 'Window start, YYYY-MM-DDTHH:mm:ss' },
        end: { type: 'string', description: 'Window end, YYYY-MM-DDTHH:mm:ss' },
        excludeEventId: {
          type: 'string',
          description: 'Event to ignore when checking, used when moving that event.',
        },
      },
      required: ['start', 'end'],
    },
  },
  {
    type: 'function',
    name: 'find_free_slots',
    description:
      'Find open windows of at least a given length, ranked by how well they fit. Use for "when can I fit X" questions.',
    parameters: {
      type: 'object',
      properties: {
        durationMinutes: { type: 'number', description: 'Length needed, in minutes.' },
        from: { type: 'string', description: 'First day to search, YYYY-MM-DD. Defaults to today.' },
        days: { type: 'number', description: 'How many days to search, 1 to 14. Defaults to 7.' },
      },
      required: ['durationMinutes'],
    },
  },
  {
    type: 'function',
    name: 'get_productivity_stats',
    description:
      'Read the current productivity score, its four components, focus hours, completion counts, streak and peak focus hour.',
    parameters: { type: 'object', properties: {}, required: [] },
  },
  {
    type: 'function',
    name: 'create_event',
    description:
      'Propose adding a new event. The user confirms before anything is saved.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Short event title.' },
        start: { type: 'string', description: 'Start, YYYY-MM-DDTHH:mm:ss' },
        durationMinutes: { type: 'number', description: 'Length in minutes. Defaults to 60.' },
        categoryId: { type: 'string', description: `One of: ${CATEGORY_IDS().join(', ')}` },
        notes: { type: 'string', description: 'Optional note.' },
        reminderMinutes: { type: 'number', description: 'Optional reminder, minutes before start.' },
      },
      required: ['title', 'start'],
    },
  },
  {
    type: 'function',
    name: 'move_event',
    description:
      'Propose rescheduling an existing event. Duration is preserved. The user confirms before anything changes.',
    parameters: {
      type: 'object',
      properties: {
        eventId: { type: 'string', description: 'Exact id from the schedule snapshot.' },
        newStart: { type: 'string', description: 'New start, YYYY-MM-DDTHH:mm:ss' },
      },
      required: ['eventId', 'newStart'],
    },
  },
  {
    type: 'function',
    name: 'delete_event',
    description: 'Propose cancelling an event. The user confirms before anything is removed.',
    parameters: {
      type: 'object',
      properties: {
        eventId: { type: 'string', description: 'Exact id from the schedule snapshot.' },
      },
      required: ['eventId'],
    },
  },
  {
    type: 'function',
    name: 'complete_event',
    description: 'Propose marking an event as done.',
    parameters: {
      type: 'object',
      properties: {
        eventId: { type: 'string', description: 'Exact id from the schedule snapshot.' },
      },
      required: ['eventId'],
    },
  },
  {
    type: 'function',
    name: 'apply_method',
    description:
      'Propose applying a productivity method template to a whole week, adding its blocks.',
    parameters: {
      type: 'object',
      properties: {
        methodId: { type: 'string', description: `One of: ${METHOD_IDS.join(', ')}` },
        weekOffset: { type: 'number', description: '0 for this week, 1 for next week. Defaults to 0.' },
        replace: { type: 'boolean', description: 'Clear the week first. Defaults to false.' },
      },
      required: ['methodId'],
    },
  },
]

export const getToolDeclarations = buildToolDeclarations

export const READ_TOOLS = new Set([
  'get_schedule',
  'check_availability',
  'find_free_slots',
  'get_productivity_stats',
])

const workWindow = (settings) => ({
  workStartHour: settings.workStartHour ?? 7,
  workEndHour: settings.workEndHour ?? 22,
})

export function runReadTool(name, args, ctx) {
  const { events, settings, now } = ctx

  if (name === 'get_schedule') {
    const from = args.from ? parseLocal(`${args.from}T00:00:00`) : startOfDay(now)
    const days = Math.min(31, Math.max(1, Math.round(args.days ?? 1)))
    const list = eventsInRange(events, from, addDays(from, days))
    return {
      from: format(from, 'yyyy-MM-dd'),
      days,
      count: list.length,
      events: list.map(serializeEvent),
    }
  }

  if (name === 'check_availability') {
    const start = parseLocal(args.start)
    const end = parseLocal(args.end)
    if (!start || !end) return { error: 'Could not parse start or end.' }

    const clashes = findConflicts(events, start, end, args.excludeEventId ?? null)
    const alternatives = clashes.length
      ? suggestAlternatives(events, start, durationMinutes(start, end), {
          excludeId: args.excludeEventId ?? null,
          ...workWindow(settings),
          now,
        })
      : []

    return {
      free: clashes.length === 0,
      window: `${format(start, 'yyyy-MM-dd HH:mm')} to ${format(end, 'HH:mm')}`,
      conflicts: clashes.map(serializeEvent),
      alternatives: alternatives.map((a) => ({
        start: format(a.start, LOCAL_ISO),
        label: `${fmtRelativeDay(a.start)} ${fmtTimeShort(a.start)}`,
        reason: a.reason,
      })),
    }
  }

  if (name === 'find_free_slots') {
    const minutes = Math.max(15, Math.round(args.durationMinutes ?? 60))
    const from = args.from ? parseLocal(`${args.from}T00:00:00`) : startOfDay(now)
    const days = Math.min(14, Math.max(1, Math.round(args.days ?? 7)))

    const slots = freeSlotsAcross(events, from, days, {
      ...workWindow(settings),
      minMinutes: minutes,
      now,
    })

    return {
      durationMinutes: minutes,
      count: slots.length,
      slots: slots.slice(0, 12).map((s) => ({
        start: format(s.start, LOCAL_ISO),
        end: format(s.end, LOCAL_ISO),
        label: `${fmtRelativeDay(s.start)} ${fmtTimeShort(s.start)}-${fmtTimeShort(s.end)}`,
        minutes: s.minutes,
      })),
    }
  }

  if (name === 'get_productivity_stats') {
    const stats = weekStats(events, now, { focusTargetHours: settings.focusTargetHours, now })
    const streak = streaks(events, now)
    const peak = peakFocusHour(events, { now })
    return {
      score: stats.score,
      components: stats.components,
      focusHours: stats.focusHours,
      focusTargetHours: settings.focusTargetHours,
      completed: stats.completedCount,
      due: stats.dueCount,
      plannedHours: stats.plannedHours,
      recoveryHours: stats.recoveryHours,
      streakDays: streak.current,
      bestStreakDays: streak.longest,
      peakFocusHour: peak ? peak.hour : null,
      byCategory: stats.byCategory,
    }
  }

  return { error: `Unknown tool ${name}` }
}

function conflictReport(events, start, end, excludeId, settings, now) {
  const clashes = findConflicts(events, start, end, excludeId)
  if (!clashes.length) return { clashes: [], alternatives: [] }

  const alternatives = suggestAlternatives(events, start, durationMinutes(start, end), {
    excludeId,
    ...workWindow(settings),
    now,
  })
  return { clashes, alternatives }
}

export function buildProposal(name, args, ctx) {
  const { events, settings, now } = ctx
  const blocks = []
  const actions = []
  const warnings = []

  if (name === 'create_event') {
    const start = parseLocal(args.start)
    if (!start) return null

    const minutes = Math.max(5, Math.round(args.durationMinutes ?? 60))
    const end = addMinutes(start, minutes)
    const categoryId = CATEGORY_IDS().includes(args.categoryId) ? args.categoryId : DEFAULT_CATEGORY

    const draft = {
      title: args.title?.trim() || 'New block',
      categoryId,
      start,
      end,
      notes: args.notes ?? '',
      reminderMinutes: args.reminderMinutes ?? null,
      source: 'ai',
    }

    blocks.push({ type: 'draft', draft })

    const { clashes, alternatives } = conflictReport(events, start, end, null, settings, now)
    if (clashes.length) {
      warnings.push(
        `That overlaps ${clashes.map((c) => `"${c.title}"`).join(', ')}. I can still add it, or use one of the clear slots.`
      )
      blocks.push({ type: 'events', title: 'In the way', events: clashes })
      if (alternatives.length) blocks.push({ type: 'slots', title: 'Clear instead', slots: alternatives })
      alternatives.slice(0, 2).forEach((alt, i) => {
        actions.push({
          id: uid('act'),
          kind: 'create',
          label: `${fmtRelativeDay(alt.start)} ${fmtTimeShort(alt.start)}`,
          description: alt.reason,
          tone: i === 0 ? 'primary' : 'ghost',
          payload: { event: { ...draft, start: alt.start, end: addMinutes(alt.start, minutes) } },
        })
      })
    }

    actions.push({
      id: uid('act'),
      kind: 'create',
      label: clashes.length ? 'Add anyway' : 'Add to calendar',
      tone: clashes.length ? 'danger' : 'primary',
      payload: { event: draft },
    })

    return { blocks, actions, warnings }
  }

  if (name === 'move_event') {
    const event = events.find((e) => e.id === args.eventId)
    const start = parseLocal(args.newStart)
    if (!event || !start) return null

    const length = durationMinutes(event.start, event.end)
    const end = addMinutes(start, length)

    blocks.push({
      type: 'diff',
      event,
      from: { start: event.start, end: event.end },
      to: { start, end },
    })

    const { clashes, alternatives } = conflictReport(events, start, end, event.id, settings, now)
    if (clashes.length) {
      warnings.push(
        `That clashes with ${clashes.map((c) => `"${c.title}"`).join(', ')}.`
      )
      blocks.push({ type: 'events', title: 'In the way', events: clashes })
      if (alternatives.length) blocks.push({ type: 'slots', title: 'Clear alternatives', slots: alternatives })
      alternatives.slice(0, 2).forEach((alt, i) => {
        actions.push({
          id: uid('act'),
          kind: 'move',
          label: `Move to ${fmtTimeShort(alt.start)}`,
          description: `${fmtRelativeDay(alt.start)} · ${alt.reason}`,
          tone: i === 0 ? 'primary' : 'ghost',
          payload: { eventId: event.id, start: alt.start },
        })
      })
    }

    actions.push({
      id: uid('act'),
      kind: 'move',
      label: clashes.length ? `Move anyway (overlap ${clashes.length})` : 'Confirm move',
      tone: clashes.length ? 'danger' : 'primary',
      payload: { eventId: event.id, start },
    })

    return { blocks, actions, warnings }
  }

  if (name === 'delete_event') {
    const event = events.find((e) => e.id === args.eventId)
    if (!event) return null
    return {
      blocks: [{ type: 'events', title: 'To cancel', events: [event] }],
      actions: [
        {
          id: uid('act'),
          kind: 'delete',
          label: 'Cancel it',
          tone: 'danger',
          payload: { eventId: event.id },
        },
      ],
      warnings: [],
    }
  }

  if (name === 'complete_event') {
    const event = events.find((e) => e.id === args.eventId)
    if (!event) return null
    if (event.completed) {
      return { blocks: [], actions: [], warnings: [`"${event.title}" is already marked done.`] }
    }
    return {
      blocks: [{ type: 'events', title: 'Completing', events: [event] }],
      actions: [
        {
          id: uid('act'),
          kind: 'complete',
          label: 'Mark done',
          tone: 'primary',
          payload: { eventId: event.id },
        },
      ],
      warnings: [],
    }
  }

  if (name === 'apply_method') {
    const method = getMethod(args.methodId)
    if (!method) return null

    const offset = Math.max(0, Math.round(args.weekOffset ?? 0))
    const weekStart = addDays(startOfWeek(now, WEEK_OPTS), offset * 7)
    const drafts = method.buildWeek(weekStart)

    return {
      blocks: [
        { type: 'method', methodId: method.id },
        { type: 'template', drafts, weekStart },
      ],
      actions: [
        {
          id: uid('act'),
          kind: 'applyMethod',
          label: `Add ${drafts.length} blocks`,
          description: 'Keeps your existing events',
          tone: 'primary',
          payload: { methodId: method.id, weekStart, replace: false },
        },
        {
          id: uid('act'),
          kind: 'applyMethod',
          label: 'Replace the week',
          description: 'Clears the week first',
          tone: 'danger',
          payload: { methodId: method.id, weekStart, replace: true },
        },
      ],
      warnings: [],
    }
  }

  return null
}