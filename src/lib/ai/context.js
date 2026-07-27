import { getAllCategories } from '@/data/categories'
import { METHODS, getMethod } from '@/data/methods'
import { addDays, format, startOfDay, toDate } from '@/lib/date'
import { streaks, weekStats } from '@/lib/analytics'

const DAYS_BACK = 3
const DAYS_FORWARD = 14

export function serializeEvent(event) {
  const start = toDate(event.start)
  const end = toDate(event.end)
  return [
    event.id,
    event.title,
    event.categoryId,
    `${format(start, 'yyyy-MM-dd HH:mm')}-${format(end, 'HH:mm')}`,
    event.completed ? 'done' : 'open',
  ].join(' | ')
}

export function buildSnapshot(events, now) {
  const from = addDays(startOfDay(now), -DAYS_BACK)
  const to = addDays(startOfDay(now), DAYS_FORWARD)

  return events
    .filter((e) => {
      const start = toDate(e.start)
      return start >= from && start < to
    })
    .sort((a, b) => a.start.localeCompare(b.start))
    .map(serializeEvent)
}

export function buildSystemInstruction(events, settings, now) {
  const stats = weekStats(events, now, { focusTargetHours: settings.focusTargetHours, now })
  const streak = streaks(events, now)
  const method = getMethod(settings.activeMethod)
  const snapshot = buildSnapshot(events, now)

  const categoryList = getAllCategories().map((c) => `${c.id} (${c.name})`).join(', ')
  const methodList = METHODS.map((m) => `${m.id} (${m.name}, ${m.defaultBlock}min blocks)`).join(', ')

  return `You are Sage, a scheduling assistant built into a calendar app. You help exactly one user read, understand and reshape their own calendar.

CURRENT CONTEXT
Now: ${format(now, "EEEE d MMMM yyyy, HH:mm")} (local time)
User's name: ${settings.userName || 'the user'}
Working window: ${settings.workStartHour}:00 to ${settings.workEndHour}:00
Active productivity method: ${method ? `${method.name} — ${method.guidance}` : 'none'}
Weekly focus target: ${settings.focusTargetHours}h. Logged so far this week: ${stats.focusHours}h.
This week's productivity score: ${stats.score}/100. Completed ${stats.completedCount} of ${stats.dueCount} due events.
Current streak: ${streak.current} days (best ${streak.longest}).

CATEGORIES
${categoryList}

METHODS
${methodList}

SCHEDULE (${format(addDays(startOfDay(now), -DAYS_BACK), 'MMM d')} to ${format(addDays(startOfDay(now), DAYS_FORWARD), 'MMM d')})
Format: id | title | category | YYYY-MM-DD HH:mm-HH:mm | status
${snapshot.length ? snapshot.join('\n') : '(nothing scheduled in this window)'}

HOW YOU WORK
You never change the calendar yourself. When the user wants something changed, you call the matching tool, which creates a proposal the user confirms with a button. Never claim an edit is done, already applied, or saved. Say what you are proposing, not what you have done.

Use the read tools whenever you need information beyond the snapshot above, or when you want to confirm a slot is genuinely free before proposing something. Prefer checking over guessing.

Always reference existing events by their exact id from the snapshot. If the user's wording matches more than one event, ask which one rather than picking blindly.

All times you pass to tools must be local ISO strings shaped YYYY-MM-DDTHH:mm:ss with no timezone suffix.

STYLE
Reply in two or three short sentences. Be concrete and specific: name the event, the day and the time. Never invent events, times, or statistics that are not in the data you were given. If something is outside the calendar's scope, say so briefly and offer what you can do instead.

You may also answer general productivity questions, but keep them to a short paragraph and tie them back to what you can see in this user's schedule.`
}
