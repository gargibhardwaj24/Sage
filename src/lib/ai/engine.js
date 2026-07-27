import {
  addDays,
  addMinutes,
  atTime,
  differenceInMinutes,
  durationMinutes,
  fmtDay,
  fmtRelativeDay,
  fmtTimeShort,
  fmtRange,
  humanDuration,
  isSameDay,
  startOfDay,
  startOfWeek,
  toDate,
  weekDays,
  WEEK_OPTS,
} from '@/lib/date'
import {
  conflictPairs,
  eventsInRange,
  eventsOnDay,
  findConflicts,
  freeSlots,
  freeSlotsAcross,
  nextUpcoming,
  suggestAlternatives,
  totalMinutes,
} from '@/lib/schedule'
import { weekStats, streaks, peakFocusHour, scoreLabel } from '@/lib/analytics'
import { getCategory, isFocusCategory } from '@/data/categories'
import { METHODS, getMethod } from '@/data/methods'
import { parseWhen, PART_OF_DAY_WINDOW } from './datetime'
import { classify, detectCategory, detectMethod, extractTitle, INTENTS } from './intents'
import { resolveEvent } from './match'
import { lookupKnowledge, CAPABILITIES } from './knowledge'
import { uid } from '@/lib/id'

const RELATIVE_SHIFT_RE =
  /\b(?:by\s+)?(\d+(?:\.\d+)?)?\s*(hours?|hrs?|h|minutes?|mins?|m)?\s*(later|earlier|forward|back|ahead|sooner)\b/

const reply = (partial) => ({
  id: uid('msg'),
  role: 'assistant',
  text: '',
  blocks: [],
  actions: [],
  followUps: [],
  createdAt: new Date().toISOString(),
  ...partial,
})

const action = (kind, label, payload, extra = {}) => ({
  id: uid('act'),
  kind,
  label,
  payload,
  tone: 'ghost',
  ...extra,
})

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n))

function workingWindow(settings, ...times) {
  let startHour = settings.workStartHour ?? 7
  let endHour = settings.workEndHour ?? 22

  for (const t of times) {
    if (!t) continue
    const d = toDate(t)
    startHour = Math.min(startHour, d.getHours())
    endHour = Math.max(endHour, d.getMinutes() > 0 ? d.getHours() + 2 : d.getHours() + 1)
  }

  return {
    workStartHour: clamp(startHour, 0, 22),
    workEndHour: clamp(Math.max(endHour, startHour + 1), 1, 24),
  }
}

function whenPhrase(date) {
  const rel = fmtRelativeDay(date)
  const needsOn = /,/.test(rel)
  return `${needsOn ? 'on ' : ''}${rel} at ${fmtTimeShort(date)}`
}

export function respond(input, ctx) {
  const { events = [], settings = {}, now = new Date() } = ctx
  const cls = classify(input)
  const when = parseWhen(input, now)
  const scope = { input, events, settings, now, when, cls }

  const handlers = {
    [INTENTS.MOVE]: handleMove,
    [INTENTS.CREATE]: handleCreate,
    [INTENTS.DELETE]: handleDelete,
    [INTENTS.COMPLETE]: handleComplete,
    [INTENTS.AVAILABILITY]: handleAvailability,
    [INTENTS.AGENDA]: handleAgenda,
    [INTENTS.FIND_SLOT]: handleFindSlot,
    [INTENTS.STATS]: handleStats,
    [INTENTS.SUGGEST]: handleSuggest,
    [INTENTS.APPLY_METHOD]: handleApplyMethod,
    [INTENTS.EXPLAIN_METHOD]: handleExplainMethod,
    [INTENTS.ADVICE]: handleAdvice,
    [INTENTS.GREETING]: handleGreeting,
    [INTENTS.HELP]: handleHelp,
  }

  const handler = handlers[cls.intent] ?? handleFallback
  const result = handler(scope) ?? handleFallback(scope)
  return { ...result, intent: cls.intent, confidence: cls.confidence }
}

function resolveWindow(scope) {
  const { when, now, settings } = scope
  const day = when.day ?? startOfDay(now)

  if (when.isRange && when.start && when.end) {
    return { start: when.start, end: when.end, label: describeWindow(when.start, when.end) }
  }
  if (when.start && when.times.length) {
    const length = when.duration ?? 60
    return {
      start: when.start,
      end: addMinutes(when.start, length),
      label: `${fmtRelativeDay(when.start)} at ${fmtTimeShort(when.start)}`,
      point: true,
    }
  }
  if (when.partOfDay) {
    const [from, to] = PART_OF_DAY_WINDOW[when.partOfDay]
    return {
      start: atTime(day, from),
      end: atTime(day, to),
      label: `${when.partOfDay === 'tonight' ? 'tonight' : `${fmtRelativeDay(day)} ${when.partOfDay}`}`,
    }
  }
  const start = isSameDay(day, now) ? now : atTime(day, settings.workStartHour ?? 8)
  return {
    start,
    end: atTime(day, settings.workEndHour ?? 20),
    label: fmtRelativeDay(day),
    wholeDay: true,
  }
}

function describeWindow(start, end) {
  return `${fmtRelativeDay(start)} ${fmtRange(start, end)}`
}

function handleAvailability(scope) {
  const { events, now, settings, when } = scope
  const win = resolveWindow(scope)
  const clashes = findConflicts(events, win.start, win.end)

  const asksBusy = /\bbusy\b|\bbooked\b|\btaken\b/.test(when.text)
  const yes = asksBusy ? 'No' : 'Yes'
  const no = asksBusy ? 'Yes' : 'No'

  if (!clashes.length) {
    const day = startOfDay(win.start)
    const rest = eventsOnDay(events, day).filter((e) => toDate(e.start) >= win.start)
    const followingUp = rest[0]

    const text = win.point
      ? `${yes} — you're free ${win.label}.`
      : `${yes} — nothing scheduled ${win.label}.`

    return reply({
      text:
        text +
        (followingUp
          ? ` Your next commitment is **${followingUp.title}** at ${fmtTimeShort(followingUp.start)}.`
          : ' The rest of that day is clear too.'),
      blocks: rest.length
        ? [{ type: 'events', title: `Rest of ${fmtRelativeDay(day)}`, events: rest.slice(0, 4) }]
        : [],
      actions: [
        action(
          'create',
          `Block ${humanDuration(differenceInMinutes(win.end, win.start))} here`,
          {
            event: {
              title: 'Focus block',
              categoryId: 'deep-work',
              start: win.start,
              end: win.point ? win.end : addMinutes(win.start, defaultBlock(settings)),
              source: 'ai',
            },
          },
          { tone: 'primary' }
        ),
      ],
      followUps: ['What else is on that day?', 'Find me a deep work slot this week'],
    })
  }

  const first = clashes[0]
  const minutes = when.duration ?? durationMinutes(first.start, first.end)
  const alternatives = suggestAlternatives(events, win.start, minutes, {
    ...workingWindow(settings, win.start, win.end),
    now,
  })

  return reply({
    text:
      clashes.length === 1
        ? `${no} — **${first.title}** runs ${fmtRange(first.start, first.end)} ${fmtRelativeDay(first.start)}.`
        : `${no} — you have ${clashes.length} things ${win.label}.`,
    blocks: [
      { type: 'events', title: `Booked ${win.label}`, events: clashes },
      ...(alternatives.length
        ? [{ type: 'slots', title: 'Closest openings', slots: alternatives }]
        : []),
    ],
    actions: alternatives.slice(0, 2).map((alt, i) =>
      action(
        'create',
        `Block ${fmtTimeShort(alt.start)} ${isSameDay(alt.start, win.start) ? '' : fmtRelativeDay(alt.start)}`.trim(),
        {
          event: {
            title: 'Focus block',
            categoryId: 'deep-work',
            start: alt.start,
            end: alt.end,
            source: 'ai',
          },
        },
        { tone: i === 0 ? 'primary' : 'ghost' }
      )
    ),
    followUps: ['Move something to free that up', "What's on that day?"],
  })
}

function handleMove(scope) {
  const { input, events, now, settings, when } = scope

  const disambiguator = when.isRange && when.start ? when.start : null
  const target = resolveEvent(events, input, {
    now,
    near: disambiguator ?? when.day ?? null,
    includePast: false,
  })

  if (!target.event) {
    return reply({
      text: "I couldn't find that one on your calendar. Which event did you mean?",
      blocks: [
        {
          type: 'events',
          title: 'Coming up',
          events: events.filter((e) => toDate(e.start) >= now).slice(0, 5),
        },
      ],
      followUps: ['Move my next event an hour later', "What's on today?"],
    })
  }

  const event = target.event
  const length = durationMinutes(event.start, event.end)
  const newStart = resolveNewStart(scope, event)

  if (!newStart) {
    return reply({
      text: `When would you like to move **${event.title}** to? Right now it's ${fmtRelativeDay(event.start)} at ${fmtTimeShort(event.start)}.`,
      blocks: [{ type: 'events', title: 'Current slot', events: [event] }],
      followUps: [`Move ${event.title} an hour later`, `Move ${event.title} to tomorrow morning`],
    })
  }

  const newEnd = addMinutes(newStart, length)
  const clashes = findConflicts(events, newStart, newEnd, event.id)
  const movePreview = {
    type: 'diff',
    event,
    from: { start: event.start, end: event.end },
    to: { start: newStart, end: newEnd },
  }

  if (!clashes.length) {
    const inPast = newStart < now
    return reply({
      text: `Moving **${event.title}** to ${whenPhrase(newStart)} — that slot is clear.${
        inPast ? ' Heads up: that time has already passed.' : ''
      }`,
      blocks: [movePreview],
      actions: [
        action('move', 'Confirm move', { eventId: event.id, start: newStart }, { tone: 'primary' }),
        ...(target.ambiguous && target.alternatives.length
          ? [
              action('clarify', `Actually, I meant "${target.alternatives[0].title}"`, {
                text: `Move ${target.alternatives[0].title} to ${fmtTimeShort(newStart)} ${fmtRelativeDay(newStart)}`,
              }),
            ]
          : []),
      ],
      followUps: ["What's my day look like now?", 'Find me a deep work slot'],
    })
  }

  const alternatives = suggestAlternatives(events, newStart, length, {
    excludeId: event.id,
    ...workingWindow(settings, newStart, newEnd),
    now,
  })

  return reply({
    text: `That clashes — **${clashes[0].title}** already runs ${fmtRange(clashes[0].start, clashes[0].end)}${
      clashes.length > 1 ? `, plus ${clashes.length - 1} more` : ''
    }. Here's what I'd do instead:`,
    blocks: [
      movePreview,
      { type: 'events', title: 'In the way', events: clashes },
      ...(alternatives.length ? [{ type: 'slots', title: 'Clear alternatives', slots: alternatives }] : []),
    ],
    actions: [
      ...alternatives.slice(0, 2).map((alt, i) =>
        action(
          'move',
          `Move to ${fmtTimeShort(alt.start)}${isSameDay(alt.start, newStart) ? '' : ` ${fmtRelativeDay(alt.start)}`}`,
          { eventId: event.id, start: alt.start },
          { tone: i === 0 ? 'primary' : 'ghost', description: alt.reason }
        )
      ),
      action(
        'move',
        `Move anyway (overlap ${clashes.length})`,
        { eventId: event.id, start: newStart },
        { tone: 'danger' }
      ),
    ],
    followUps: [`Move ${clashes[0].title} instead`, "What's free that day?"],
  })
}

function resolveNewStart(scope, event) {
  const { when, now } = scope
  const current = toDate(event.start)

  if (when.isRange && when.end) {
    const dayBase = when.dayExplicit && when.day ? when.day : current
    return atTime(dayBase, when.end.getHours(), when.end.getMinutes())
  }

  const rel = when.text.match(RELATIVE_SHIFT_RE)
  if (rel && !when.times.length) {
    const amount = rel[1] ? parseFloat(rel[1]) : 1
    const unit = rel[2] ?? 'hour'
    const mins = /^h/.test(unit) ? amount * 60 : amount
    const backwards = /earlier|back|sooner/.test(rel[3])
    return addMinutes(current, backwards ? -mins : mins)
  }

  if (when.start) {
    if (!when.times.length && when.day) {
      return atTime(when.day, current.getHours(), current.getMinutes())
    }
    const dayBase = when.dayExplicit && when.day ? when.day : current
    const candidate = atTime(dayBase, when.start.getHours(), when.start.getMinutes())
    if (candidate < now && !when.dayExplicit && current > now) return addDays(candidate, 1)
    return candidate
  }

  if (when.day) return atTime(when.day, current.getHours(), current.getMinutes())
  return null
}

function defaultBlock(settings) {
  const method = getMethod(settings.activeMethod)
  return method?.defaultBlock ?? 60
}

function handleCreate(scope) {
  const { input, events, now, settings, when } = scope
  const title = extractTitle(input) ?? 'New block'
  const categoryId = detectCategory(input) ?? 'deep-work'
  const minutes = when.duration ?? defaultBlock(settings)

  let start = when.start
  let placed = false

  if (!start) {
    const from = when.day ?? startOfDay(now)
    const options = suggestAlternatives(events, atTime(from, preferredHour(categoryId, settings)), minutes, {
      ...workingWindow(settings),
      now,
      searchDays: 5,
      preferMornings: isFocusCategory(categoryId),
    })
    if (!options.length) {
      return reply({
        text: `I couldn't find ${humanDuration(minutes)} free in the next few days for **${title}**. Want me to look further out, or shorten it?`,
        followUps: ['Find me any gap next week', 'Show my week'],
      })
    }
    start = options[0].start
    placed = true
  }

  const end = when.isRange && when.end ? when.end : addMinutes(start, minutes)
  const clashes = findConflicts(events, start, end)
  const draft = { title, categoryId, start, end, source: 'ai' }

  if (!clashes.length) {
    return reply({
      text: placed
        ? `I found a clear ${humanDuration(differenceInMinutes(end, start))} slot for **${title}** — ${whenPhrase(start)}.`
        : `**${title}**, ${whenPhrase(start)}, for ${humanDuration(differenceInMinutes(end, start))}. That slot is free.`,
      blocks: [{ type: 'draft', draft }],
      actions: [action('create', 'Add to calendar', { event: draft }, { tone: 'primary' })],
      followUps: ['Set a 15 minute reminder', "What's on that day?"],
    })
  }

  const alternatives = suggestAlternatives(events, start, differenceInMinutes(end, start), {
    ...workingWindow(settings, start, end),
    now,
    preferMornings: isFocusCategory(categoryId),
  })

  return reply({
    text: `That overlaps **${clashes[0].title}** (${fmtRange(clashes[0].start, clashes[0].end)}). These are clear:`,
    blocks: [
      { type: 'events', title: 'In the way', events: clashes },
      ...(alternatives.length ? [{ type: 'slots', title: 'Open instead', slots: alternatives }] : []),
    ],
    actions: [
      ...alternatives.slice(0, 2).map((alt, i) =>
        action(
          'create',
          `${fmtTimeShort(alt.start)}${isSameDay(alt.start, start) ? '' : ` ${fmtRelativeDay(alt.start)}`}`,
          { event: { ...draft, start: alt.start, end: alt.end } },
          { tone: i === 0 ? 'primary' : 'ghost', description: alt.reason }
        )
      ),
      action('create', 'Add anyway', { event: draft }, { tone: 'danger' }),
    ],
  })
}

function preferredHour(categoryId, settings) {
  if (isFocusCategory(categoryId)) return Math.max(settings.workStartHour ?? 8, 9)
  if (categoryId === 'fitness') return 7
  if (categoryId === 'admin') return 16
  return 12
}

function handleDelete(scope) {
  const { input, events, now, when } = scope

  if (/\bclear\b/.test(when.text) && (when.partOfDay || when.day)) {
    const win = resolveWindow(scope)
    const doomed = eventsInRange(events, win.start, win.end)
    if (!doomed.length) {
      return reply({ text: `Nothing scheduled ${win.label} — already clear.` })
    }
    return reply({
      text: `That would clear ${doomed.length} event${doomed.length > 1 ? 's' : ''} ${win.label}.`,
      blocks: [{ type: 'events', title: 'Will be removed', events: doomed }],
      actions: [
        action(
          'deleteMany',
          `Clear ${doomed.length} event${doomed.length > 1 ? 's' : ''}`,
          { ids: doomed.map((e) => e.id) },
          { tone: 'danger' }
        ),
      ],
    })
  }

  const target = resolveEvent(events, input, { now, near: when.day ?? when.start ?? null })
  if (!target.event) {
    return reply({
      text: "I couldn't find that event. Here's what's coming up — tell me which to cancel.",
      blocks: [
        { type: 'events', title: 'Coming up', events: events.filter((e) => toDate(e.start) >= now).slice(0, 5) },
      ],
    })
  }

  return reply({
    text: `Cancel **${target.event.title}** on ${fmtRelativeDay(target.event.start)} at ${fmtTimeShort(target.event.start)}?`,
    blocks: [{ type: 'events', title: 'To cancel', events: [target.event] }],
    actions: [
      action('delete', 'Cancel it', { eventId: target.event.id }, { tone: 'danger' }),
      ...(target.ambiguous && target.alternatives.length
        ? [action('clarify', `I meant "${target.alternatives[0].title}"`, { text: `Cancel ${target.alternatives[0].title}` })]
        : []),
    ],
  })
}

function handleComplete(scope) {
  const { input, events, now, when } = scope
  const target = resolveEvent(events, input, { now, near: when.day ?? null, includePast: true })

  if (!target.event) {
    const recent = events
      .filter((e) => toDate(e.end) <= now && !e.completed)
      .slice(-5)
      .reverse()
    return reply({
      text: "Which one? Here are the most recent things you haven't ticked off.",
      blocks: recent.length ? [{ type: 'events', title: 'Not yet marked done', events: recent }] : [],
    })
  }

  if (target.event.completed) {
    return reply({ text: `**${target.event.title}** is already marked done. Nice.` })
  }

  return reply({
    text: `Marking **${target.event.title}** (${fmtRelativeDay(target.event.start)}) as done.`,
    blocks: [{ type: 'events', title: 'Completing', events: [target.event] }],
    actions: [action('complete', 'Mark done', { eventId: target.event.id }, { tone: 'primary' })],
    followUps: ['How productive was I this week?', 'Show my streak'],
  })
}

function handleAgenda(scope) {
  const { events, now, when, settings } = scope
  const wantsWeek = when.span === 'week' || /\bweek\b/.test(when.text)

  if (wantsWeek) {
    const anchor = when.day ?? now
    const stats = weekStats(events, anchor, { focusTargetHours: settings.focusTargetHours, now })
    const days = weekDays(anchor)
    const busiest = [...stats.byDay].sort((a, b) => b.planned - a.planned)[0]
    const lightest = [...stats.byDay].sort((a, b) => a.planned - b.planned)[0]

    return reply({
      text: `Week of ${fmtDay(days[0])} — **${stats.plannedCount} events**, ${stats.plannedHours}h scheduled. Busiest day is ${busiest.label} (${busiest.planned}), lightest is ${lightest.label} (${lightest.planned}).`,
      blocks: [
        { type: 'week', days: stats.byDay, weekStart: stats.start },
        {
          type: 'stats',
          items: [
            { label: 'Scheduled', value: `${stats.plannedHours}h` },
            { label: 'Focus hours', value: `${stats.focusHours}h`, hint: `target ${settings.focusTargetHours ?? 20}h` },
            { label: 'Completed', value: `${stats.completedCount}/${stats.dueCount || stats.plannedCount}` },
          ],
        },
      ],
      actions: [action('navigate', 'Open week view', { to: '/calendar?view=week' })],
      followUps: ['Where are my free slots?', 'How can I improve this week?'],
    })
  }

  const day = when.day ?? startOfDay(now)
  const list = eventsOnDay(events, day)
  const clashes = conflictPairs(events, day)
  const gaps = freeSlots(events, day, { ...workingWindow(settings), minMinutes: 45, now })

  if (!list.length) {
    return reply({
      text: `${cap(fmtRelativeDay(day))} is completely clear. ${isSameDay(day, now) ? 'Rare and valuable — want to claim some of it?' : 'Good day to place something that keeps getting bumped.'}`,
      actions: [
        action(
          'create',
          `Add a ${humanDuration(defaultBlock(settings))} focus block`,
          {
            event: {
              title: 'Deep work',
              categoryId: 'deep-work',
              start: atTime(day, 9),
              end: addMinutes(atTime(day, 9), defaultBlock(settings)),
              source: 'ai',
            },
          },
          { tone: 'primary' }
        ),
      ],
    })
  }

  const scheduled = totalMinutes(list)
  const upcoming = list.filter((e) => toDate(e.end) > now)

  return reply({
    text: `${cap(fmtRelativeDay(day))} you have **${list.length} event${list.length > 1 ? 's' : ''}** — ${humanDuration(scheduled)} scheduled, ${
      upcoming.length ? `${upcoming.length} still ahead` : 'all in the past'
    }.${clashes.length ? ` ⚠️ ${clashes.length} overlap${clashes.length > 1 ? 's' : ''} to sort out.` : ''}`,
    blocks: [
      { type: 'events', title: cap(fmtRelativeDay(day)), events: list },
      ...(gaps.length ? [{ type: 'slots', title: 'Open gaps', slots: gaps.slice(0, 3) }] : []),
    ],
    actions: [action('navigate', 'Open in calendar', { to: '/calendar?view=day' })],
    followUps: ['Am I free this evening?', 'Move something later'],
  })
}

function handleFindSlot(scope) {
  const { events, now, settings, when, input } = scope
  const minutes = when.duration ?? defaultBlock(settings)
  const categoryId = detectCategory(input) ?? 'deep-work'
  const from = when.day ?? startOfDay(now)
  const searchDays = when.dayExplicit && when.span !== 'week' ? 1 : 7

  const hours = workingWindow(settings)
  const slots = freeSlotsAcross(events, from, searchDays, { ...hours, minMinutes: minutes, now })

  if (!slots.length) {
    return reply({
      text: `No ${humanDuration(minutes)} gap in the next ${searchDays === 1 ? 'day' : 'week'} inside your ${hours.workStartHour}:00–${hours.workEndHour}:00 window. Something has to give — want me to show the least valuable blocks to move?`,
      followUps: ['How can I improve my week?', 'Show my week'],
    })
  }

  const ranked = suggestAlternatives(events, atTime(from, preferredHour(categoryId, settings)), minutes, {
    ...hours,
    now,
    searchDays,
    limit: 4,
    preferMornings: isFocusCategory(categoryId),
  })
  const best = ranked.length ? ranked : slots.slice(0, 4).map((s) => ({ ...s, reason: 'open gap' }))

  const peak = peakFocusHour(events, { now })
  const peakNote =
    peak && isFocusCategory(categoryId)
      ? ` You historically focus best around ${fmtTimeShort(atTime(now, peak.hour))}, so I've weighted toward that.`
      : ''

  return reply({
    text: `I found ${best.length} clear ${humanDuration(minutes)} window${best.length > 1 ? 's' : ''}.${peakNote}`,
    blocks: [{ type: 'slots', title: 'Best openings', slots: best }],
    actions: best.slice(0, 3).map((slot, i) =>
      action(
        'create',
        `${fmtRelativeDay(slot.start)} ${fmtTimeShort(slot.start)}`,
        {
          event: {
            title: getCategory(categoryId).name,
            categoryId,
            start: slot.start,
            end: addMinutes(slot.start, minutes),
            source: 'ai',
          },
        },
        { tone: i === 0 ? 'primary' : 'ghost', description: slot.reason }
      )
    ),
    followUps: ['Book the first one', 'Plan my week with deep work'],
  })
}

function handleStats(scope) {
  const { events, now, settings, when } = scope
  const anchor = when.day ?? now
  const stats = weekStats(events, anchor, { focusTargetHours: settings.focusTargetHours, now })
  const streak = streaks(events, now)
  const band = scoreLabel(stats.score)
  const previous = weekStats(events, addDays(stats.start, -7), {
    focusTargetHours: settings.focusTargetHours,
    now,
  })
  const delta = stats.score - previous.score

  return reply({
    text: `Your productivity score this week is **${stats.score}/100** — ${band.label.toLowerCase()}${
      previous.plannedCount ? `, ${delta >= 0 ? `up ${delta}` : `down ${Math.abs(delta)}`} from last week` : ''
    }. You've completed **${stats.completedCount}** of ${stats.dueCount} due events and logged **${stats.focusHours}h** of focus work against a ${settings.focusTargetHours ?? 20}h target.`,
    blocks: [
      {
        type: 'stats',
        items: [
          { label: 'Score', value: `${stats.score}`, hint: band.label },
          { label: 'Completed', value: `${stats.completedCount}`, hint: `of ${stats.dueCount} due` },
          { label: 'Focus', value: `${stats.focusHours}h`, hint: `target ${settings.focusTargetHours ?? 20}h` },
          { label: 'Streak', value: `${streak.current}d`, hint: `best ${streak.longest}d` },
        ],
      },
      { type: 'score', components: stats.components },
    ],
    actions: [action('navigate', 'Open analytics', { to: '/analytics' }, { tone: 'primary' })],
    followUps: ['How can I improve next week?', 'When do I focus best?'],
  })
}

function handleSuggest(scope) {
  const { events, now, settings } = scope
  const stats = weekStats(events, now, { focusTargetHours: settings.focusTargetHours, now })
  const days = weekDays(now)
  const findings = []
  const actions = []

  const allClashes = days.flatMap((d) => conflictPairs(events, d))
  if (allClashes.length) {
    const [a, b] = allClashes[0]
    findings.push(
      `**${allClashes.length} overlap${allClashes.length > 1 ? 's' : ''}** this week — "${a.title}" and "${b.title}" collide on ${fmtRelativeDay(a.start)}.`
    )
    const alt = suggestAlternatives(events, toDate(b.start), durationMinutes(b.start, b.end), {
      excludeId: b.id,
      ...workingWindow(settings, toDate(b.start)),
      now,
    })[0]
    if (alt) {
      actions.push(
        action(
          'move',
          `Move "${b.title}" to ${fmtTimeShort(alt.start)}`,
          { eventId: b.id, start: alt.start },
          { tone: 'primary', description: `${fmtRelativeDay(alt.start)} · resolves the clash` }
        )
      )
    }
  }

  const target = settings.focusTargetHours ?? 20
  if (stats.focusHours < target * 0.7) {
    const deficit = Math.round(target - stats.focusHours)
    findings.push(
      `Focus time is **${stats.focusHours}h against a ${target}h target** — roughly ${deficit}h short. Two more deep blocks would close most of it.`
    )
    const method = getMethod(settings.activeMethod)
    const slot = suggestAlternatives(events, atTime(addDays(startOfDay(now), 1), 9), method?.defaultBlock ?? 90, {
      ...workingWindow(settings),
      now,
      searchDays: 5,
      preferMornings: true,
    })[0]
    if (slot) {
      actions.push(
        action(
          'create',
          `Add deep work ${fmtRelativeDay(slot.start)} ${fmtTimeShort(slot.start)}`,
          {
            event: {
              title: 'Deep work',
              categoryId: 'deep-work',
              start: slot.start,
              end: addMinutes(slot.start, method?.defaultBlock ?? 90),
              source: 'ai',
            },
          },
          { tone: actions.length ? 'ghost' : 'primary' }
        )
      )
    }
  }

  const emptyFocusDays = stats.byDay.filter(
    (d) => !d.isFuture && d.planned > 0 && d.focusHours === 0
  )
  if (emptyFocusDays.length >= 2) {
    findings.push(
      `**${emptyFocusDays.map((d) => d.label).join(', ')}** had scheduled time but no completed focus work. Those are the days worth protecting first.`
    )
  }

  if (stats.recoveryHours < 3) {
    findings.push(
      `Only **${stats.recoveryHours}h** of movement or personal time. Recovery is what makes the focus hours repeatable — it is not the thing to cut.`
    )
  }

  const meetingMinutes = totalMinutes(stats.events, (e) => e.categoryId === 'meeting')
  if (meetingMinutes > 480) {
    findings.push(
      `Meetings take **${humanDuration(meetingMinutes)}** this week. Batching them into one window per day would give the rest of your calendar contiguous space.`
    )
  }

  const lateNights = stats.events.filter((e) => toDate(e.start).getHours() >= 22)
  if (lateNights.length >= 2) {
    findings.push(`**${lateNights.length} blocks start after 10 PM.** That usually borrows from tomorrow's focus.`)
  }

  if (!findings.length) {
    findings.push(
      `Honestly, this week looks well built — **${stats.plannedHours}h scheduled**, ${stats.focusHours}h of focus, no overlaps. The main risk now is drift, not design.`
    )
  }

  return reply({
    text: `Here's what stands out in your week:\n\n${findings.map((f, i) => `${i + 1}. ${f}`).join('\n\n')}`,
    blocks: [{ type: 'score', components: stats.components }],
    actions: actions.slice(0, 3),
    followUps: ['Plan my week with time blocking', 'Show my analytics'],
  })
}

function handleApplyMethod(scope) {
  const { input, now, settings, when } = scope
  const methodId = detectMethod(input) ?? settings.activeMethod
  const method = getMethod(methodId)

  if (!method) {
    return reply({
      text: 'Which method would you like to plan with?',
      blocks: [{ type: 'methods', methods: METHODS.map((m) => ({ id: m.id, name: m.name, tagline: m.tagline })) }],
      followUps: METHODS.slice(0, 3).map((m) => `Plan my week with ${m.name.toLowerCase()}`),
    })
  }

  const nextWeek = /\bnext week\b/.test(when.text)
  const weekStart = startOfWeek(nextWeek ? addDays(now, 7) : now, WEEK_OPTS)
  const drafts = method.buildWeek(weekStart)

  return reply({
    text: `**${method.name}** — ${method.tagline}\n\nApplying it to the week of ${fmtDay(weekStart)} adds **${drafts.length} blocks**. ${method.guidance}`,
    blocks: [{ type: 'method', methodId: method.id }, { type: 'template', drafts, weekStart }],
    actions: [
      action(
        'applyMethod',
        `Add ${drafts.length} blocks`,
        { methodId: method.id, weekStart, replace: false },
        { tone: 'primary', description: 'Keeps your existing events' }
      ),
      action(
        'applyMethod',
        'Replace the week',
        { methodId: method.id, weekStart, replace: true },
        { tone: 'danger', description: 'Clears the week first' }
      ),
      action('setMethod', `Make ${method.name} my default`, { methodId: method.id }),
    ],
    followUps: ['Show my week', 'How can I improve this week?'],
  })
}

function handleExplainMethod(scope) {
  const { input } = scope
  const methodId = detectMethod(input)
  const method = getMethod(methodId)

  if (!method) {
    return reply({
      text: 'There are six methods built in. Pick whichever matches the problem you actually have:',
      blocks: [
        {
          type: 'methods',
          methods: METHODS.map((m) => ({ id: m.id, name: m.name, tagline: m.tagline, bestFor: m.bestFor })),
        },
      ],
      actions: [action('navigate', 'Compare all methods', { to: '/methods' }, { tone: 'primary' })],
    })
  }

  return reply({
    text: `**${method.name}** — ${method.tagline}\n\n${method.principles.map((p) => `• ${p}`).join('\n')}\n\n*Best for:* ${method.bestFor}\n\n*Watch out:* ${method.watchOut}`,
    blocks: [{ type: 'method', methodId: method.id }],
    actions: [
      action('navigate', 'Read the full method', { to: `/methods?m=${method.id}` }),
      action('setMethod', `Use ${method.name}`, { methodId: method.id }, { tone: 'primary' }),
    ],
    followUps: [`Plan my week with ${method.name.toLowerCase()}`],
  })
}

function handleAdvice(scope) {
  const entry = lookupKnowledge(scope.input)
  if (!entry) return handleFallback(scope)
  return reply({ text: entry.answer, followUps: entry.followUps })
}

function handleGreeting(scope) {
  const { events, now, settings } = scope
  const next = nextUpcoming(events, now)
  const stats = weekStats(events, now, { focusTargetHours: settings.focusTargetHours, now })
  const todayCount = eventsOnDay(events, now).length

  return reply({
    text: `Hey${settings.userName ? ` ${settings.userName}` : ''} — you have **${todayCount} event${todayCount === 1 ? '' : 's'}** today and your week is sitting at **${stats.score}/100**.${
      next ? ` Next up: **${next.title}** at ${fmtTimeShort(next.start)} ${fmtRelativeDay(next.start)}.` : ''
    }\n\nAsk me anything about your schedule — I can check it, change it, or plan it.`,
    followUps: ['Am I free tonight at 8?', "What does my week look like?", 'How can I improve this week?'],
  })
}

function handleHelp() {
  return reply({
    text: "I'm your scheduling assistant. I read your calendar, check for conflicts, and only change things once you confirm. Here's what I'm good at:",
    blocks: [{ type: 'capabilities', items: CAPABILITIES }],
    followUps: ['Am I free tomorrow morning?', 'Move my next event an hour later', 'Plan my week with deep work'],
  })
}

function handleFallback(scope) {
  const { events, now, input } = scope
  const knowledge = lookupKnowledge(input)
  if (knowledge) return reply({ text: knowledge.answer, followUps: knowledge.followUps })

  const guess = resolveEvent(events, input, { now })
  if (guess.event && guess.score > 2) {
    const e = guess.event
    return reply({
      text: `I found **${e.title}** — ${fmtRelativeDay(e.start)} at ${fmtTimeShort(e.start)}. What would you like to do with it?`,
      blocks: [{ type: 'events', title: 'Closest match', events: [e] }],
      followUps: [`Move ${e.title} an hour later`, `Cancel ${e.title}`, `Mark ${e.title} as done`],
    })
  }

  return reply({
    text: "I didn't quite catch that. I'm best at reading and reshaping your calendar — try one of these:",
    blocks: [{ type: 'capabilities', items: CAPABILITIES.slice(0, 5) }],
    followUps: ['Am I free tonight at 8?', 'Move my DSA session to 8 PM', "What's on tomorrow?"],
  })
}

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1)

export function applyAction(actionToRun, api) {
  const { kind, payload } = actionToRun

  switch (kind) {
    case 'create': {
      const created = api.addEvent(payload.event)
      return { summary: `Added "${created.title}"`, detail: `${fmtRelativeDay(created.start)} at ${fmtTimeShort(created.start)}` }
    }
    case 'move': {
      const event = api.getEvents().find((e) => e.id === payload.eventId)
      api.moveEvent(payload.eventId, payload.start)
      return {
        summary: `Moved "${event?.title ?? 'event'}"`,
        detail: `now ${fmtRelativeDay(payload.start)} at ${fmtTimeShort(payload.start)}`,
      }
    }
    case 'delete': {
      const event = api.getEvents().find((e) => e.id === payload.eventId)
      api.removeEvent(payload.eventId)
      return { summary: `Cancelled "${event?.title ?? 'event'}"` }
    }
    case 'deleteMany': {
      api.removeEvents(payload.ids)
      return { summary: `Cleared ${payload.ids.length} events` }
    }
    case 'complete': {
      const event = api.getEvents().find((e) => e.id === payload.eventId)
      if (event && !event.completed) api.toggleComplete(payload.eventId)
      return { summary: `Marked "${event?.title ?? 'event'}" done` }
    }
    case 'applyMethod': {
      const method = getMethod(payload.methodId)
      if (!method) return { summary: 'Unknown method' }
      const weekStart = toDate(payload.weekStart)
      if (payload.replace) {
        const end = addDays(weekStart, 7)
        const ids = api
          .getEvents()
          .filter((e) => toDate(e.start) >= weekStart && toDate(e.start) < end)
          .map((e) => e.id)
        if (ids.length) api.removeEvents(ids)
      }
      const drafts = method.buildWeek(weekStart).map((d) => ({ ...d, method: method.id, source: 'template' }))
      api.addEvents(drafts)
      return {
        summary: `Applied ${method.name}`,
        detail: `${drafts.length} blocks · week of ${fmtDay(weekStart)}`,
      }
    }
    default:
      return null
  }
}
