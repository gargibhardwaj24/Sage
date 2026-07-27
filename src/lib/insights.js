import {
  addDays,
  differenceInMinutes,
  durationMinutes,
  format,
  fmtRelativeDay,
  fmtTimeShort,
  humanDuration,
  startOfDay,
  startOfWeek,
  toDate,
  WEEK_OPTS,
} from '@/lib/date'
import { conflictPairs, totalMinutes } from '@/lib/schedule'
import { isFocusCategory, getCategory } from '@/data/categories'
import { METHODS } from '@/data/methods'
import { peakFocusHour, streaks, weekStats } from '@/lib/analytics'

const WEEKDAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function peakFocusDay(events, { weeks = 6, now = new Date() } = {}) {
  const since = addDays(startOfDay(now), -weeks * 7)
  const totals = Array(7).fill(0)

  for (const e of events) {
    if (!e.completed || !isFocusCategory(e.categoryId)) continue
    const start = toDate(e.start)
    if (start < since) continue
    totals[start.getDay()] += durationMinutes(e.start, e.end)
  }

  const best = totals.reduce((bi, v, i) => (v > totals[bi] ? i : bi), 0)
  if (!totals[best]) return null
  return { day: best, label: WEEKDAY_LABELS[best], minutes: totals[best] }
}

export function buildInsights(events, settings = {}, now = new Date()) {
  if (!events.length) {
    return [
      {
        id: 'empty',
        weight: 100,
        tone: 'neutral',
        headline: 'Your calendar is empty',
        body: 'There is nothing to read into yet. Add your first block, or ask Sage to lay out a week around a method and confirm what you like.',
        evidence: 'No events scheduled',
        prompt: 'Plan my week with deep work',
      },
    ]
  }

  const stats = weekStats(events, now, { focusTargetHours: settings.focusTargetHours, now })
  const previous = weekStats(events, addDays(startOfWeek(now, WEEK_OPTS), -7), {
    focusTargetHours: settings.focusTargetHours,
    now,
  })
  const streak = streaks(events, now)
  const peakHour = peakFocusHour(events, { now })
  const peakDay = peakFocusDay(events, { now })
  const target = settings.focusTargetHours ?? 20

  const out = []

  if (peakDay && peakHour) {
    out.push({
      id: 'peak',
      weight: 70,
      tone: 'neutral',
      headline: `You do your best focus work on ${peakDay.label} mornings`,
      body: `Around ${fmtTimeShort(new Date(0, 0, 0, peakHour.hour))} is when you actually complete deep work. Schedule the hard things there instead of hoping for a good afternoon.`,
      evidence: `${humanDuration(peakDay.minutes)} of completed focus work on ${peakDay.label}s`,
      prompt: `When can I fit 90 minutes of deep work on ${peakDay.label}?`,
    })
  }

  const clashes = Array.from({ length: 7 }, (_, i) =>
    conflictPairs(events, addDays(startOfWeek(now, WEEK_OPTS), i))
  ).flat()
  if (clashes.length) {
    const [a, b] = clashes[0]
    out.push({
      id: 'conflicts',
      weight: 95,
      tone: 'warning',
      headline: `${clashes.length} overlap${clashes.length > 1 ? 's' : ''} still unresolved this week`,
      body: `"${a.title}" and "${b.title}" collide ${fmtRelativeDay(a.start)}. One of them will lose, and it will not be the one you meant.`,
      evidence: `First clash ${fmtRelativeDay(a.start)} at ${fmtTimeShort(a.start)}`,
      prompt: `Move ${b.title} to a free slot`,
    })
  }

  if (stats.focusHours < target * 0.7) {
    out.push({
      id: 'focus-deficit',
      weight: 80,
      tone: 'warning',
      headline: `Focus time is ${Math.round(target - stats.focusHours)}h short of target`,
      body: `You've logged ${stats.focusHours}h against a ${target}h goal. Two more protected blocks would close most of the gap.`,
      evidence: `${stats.focusHours}h of ${target}h`,
      prompt: 'When can I fit 90 minutes of deep work this week?',
    })
  }

  const meetingMinutes = totalMinutes(stats.events, (e) => e.categoryId === 'meeting')
  if (meetingMinutes > 420) {
    out.push({
      id: 'meetings',
      weight: 65,
      tone: 'neutral',
      headline: `Meetings are taking ${humanDuration(meetingMinutes)} this week`,
      body: 'Batching them into a single daily window would give the rest of your calendar contiguous space to work in.',
      evidence: `${humanDuration(meetingMinutes)} across ${stats.events.filter((e) => e.categoryId === 'meeting').length} meetings`,
      prompt: 'How can I improve my schedule this week?',
    })
  }

  if (stats.recoveryHours < 3) {
    out.push({
      id: 'recovery',
      weight: 60,
      tone: 'warning',
      headline: 'Almost no recovery time booked',
      body: `Only ${stats.recoveryHours}h of movement or personal time. Recovery is what makes the focus hours repeatable — it is not the thing to cut.`,
      evidence: `${stats.recoveryHours}h of movement and personal time`,
      prompt: 'Find me time for a workout this week',
    })
  }

  const delta = stats.score - previous.score
  if (previous.plannedCount && Math.abs(delta) >= 5) {
    out.push({
      id: 'trend',
      weight: 55,
      tone: delta > 0 ? 'good' : 'warning',
      headline:
        delta > 0
          ? `You're ${delta} points up on last week`
          : `You're ${Math.abs(delta)} points down on last week`,
      body:
        delta > 0
          ? `Follow-through is carrying it — ${stats.completedCount} of ${stats.dueCount} due events done. Keep the same shape next week.`
          : `Mostly follow-through: ${stats.completedCount} of ${stats.dueCount} due events completed. Worth trimming the plan rather than pushing harder.`,
      evidence: `Score ${stats.score} vs ${previous.score} last week`,
      prompt: 'How productive was I this week?',
    })
  }

  if (streak.current >= 3) {
    out.push({
      id: 'streak',
      weight: 50,
      tone: 'good',
      headline: `${streak.current} days in a row with something finished`,
      body:
        streak.current >= streak.longest
          ? 'That is your best run yet. The rule that protects it: never miss twice.'
          : `Your best is ${streak.longest} days. Never miss twice and this one passes it.`,
      evidence: `Current ${streak.current}d · best ${streak.longest}d`,
      prompt: 'Show my streak',
    })
  }

  if (!out.length) {
    out.push({
      id: 'steady',
      weight: 10,
      tone: 'good',
      headline: 'This week is well built',
      body: `${stats.plannedHours}h scheduled, ${stats.focusHours}h of focus, no overlaps. The risk now is drift, not design.`,
      evidence: `Score ${stats.score}/100`,
      prompt: 'How can I improve my schedule this week?',
    })
  }

  return out.sort((a, b) => b.weight - a.weight)
}

export function recommendMethods(events, settings = {}, now = new Date()) {
  if (!events.length) {
    return METHODS.filter((m) => m.id !== settings.activeMethod)
      .slice(0, 2)
      .map((m) => ({ method: m, score: 0, reason: m.bestFor }))
  }

  const stats = weekStats(events, now, { focusTargetHours: settings.focusTargetHours, now })
  const target = settings.focusTargetHours ?? 20
  const meetingMinutes = totalMinutes(stats.events, (e) => e.categoryId === 'meeting')

  const scores = Object.fromEntries(METHODS.map((m) => [m.id, { score: 0, reason: '' }]))
  const bump = (id, amount, reason) => {
    if (!scores[id]) return
    scores[id].score += amount
    if (amount > 0 && !scores[id].reason) scores[id].reason = reason
  }

  if (stats.completionRate < 0.7) {
    bump('time-boxing', 40, `Only ${Math.round(stats.completionRate * 100)}% of due events got done`)
    bump('eat-the-frog', 30, 'Work keeps slipping to the next day')
  }
  if (stats.focusHours < target * 0.7) {
    bump('deep-work', 45, `Focus time is ${stats.focusHours}h against a ${target}h target`)
    bump('time-blocking', 30, 'Unassigned hours are getting absorbed')
  }
  if (meetingMinutes > 420) {
    bump('time-blocking', 35, `${humanDuration(meetingMinutes)} of meetings to batch`)
  }
  if (stats.components.consistency < 0.7) {
    bump('pomodoro', 35, 'Some days finished nothing at all')
  }
  const q1 = stats.events.filter((e) => e.priority === 'q1').length
  if (q1 > 3) bump('eisenhower', 35, 'A lot of the week is urgent-and-important')
  if (stats.plannedCount > 35) {
    bump('eisenhower', 25, `${stats.plannedCount} events scheduled — worth sorting by quadrant`)
  }

  const ranked = METHODS.filter((m) => m.id !== settings.activeMethod)
    .map((m) => ({
      method: m,
      score: scores[m.id].score,
      reason: scores[m.id].reason || m.bestFor,
    }))
    .sort((a, b) => b.score - a.score)

  return ranked.slice(0, 2)
}

export function recentActivity(events, { limit = 6, now = new Date() } = {}) {
  const items = []

  for (const e of events) {
    const start = toDate(e.start)
    const end = toDate(e.end)

    if (e.completed && end <= now) {
      items.push({
        id: `done-${e.id}`,
        kind: 'completed',
        title: `Completed "${e.title}"`,
        at: end,
        categoryId: e.categoryId,
      })
    }
    if (e.source === 'ai') {
      items.push({
        id: `ai-${e.id}`,
        kind: 'ai',
        title: `Sage scheduled "${e.title}"`,
        at: toDate(e.createdAt ?? e.start),
        categoryId: e.categoryId,
      })
    }
    if (e.source === 'template' && e.method) {
      items.push({
        id: `tpl-${e.id}`,
        kind: 'template',
        title: `Added from a ${e.method.replace(/-/g, ' ')} plan`,
        at: toDate(e.createdAt ?? e.start),
        categoryId: e.categoryId,
      })
    }
  }

  return items
    .filter((i) => i.at <= now)
    .sort((a, b) => b.at - a.at)
    .slice(0, limit)
    .map((i) => ({ ...i, ago: timeAgo(i.at, now) }))
}

export function timeAgo(date, now = new Date()) {
  const mins = Math.max(0, differenceInMinutes(now, toDate(date)))
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days} days ago`
  return format(toDate(date), 'MMM d')
}

export function energyHeatmap(events, { weeks = 6, now = new Date(), fromHour = 6, toHour = 22 } = {}) {
  const since = addDays(startOfDay(now), -weeks * 7)
  const hours = []
  for (let h = fromHour; h <= toHour; h += 1) hours.push(h)

  const grid = hours.map((hour) => ({
    hour,
    days: Array(7).fill(0),
  }))

  for (const e of events) {
    if (!e.completed) continue
    const start = toDate(e.start)
    if (start < since) continue
    const row = grid.find((r) => r.hour === start.getHours())
    if (!row) continue
    const col = (start.getDay() + 6) % 7
    row.days[col] += durationMinutes(e.start, e.end)
  }

  const max = Math.max(1, ...grid.flatMap((r) => r.days))
  return { grid, max, hours }
}

export function recentSessions(events, { limit = 4, now = new Date() } = {}) {
  return events
    .filter((e) => e.completed && toDate(e.end) <= now)
    .sort((a, b) => toDate(b.end) - toDate(a.end))
    .slice(0, limit)
    .map((e) => ({
      id: e.id,
      title: e.title,
      minutes: durationMinutes(e.start, e.end),
      categoryId: e.categoryId,
      categoryName: getCategory(e.categoryId).name,
      isFocus: isFocusCategory(e.categoryId),
      when: fmtRelativeDay(e.start),
    }))
}
