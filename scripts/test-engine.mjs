import { respond, applyAction } from '../src/lib/ai/engine.js'
import { createSeedEvents } from '../src/data/seed.js'
const DEFAULT_SETTINGS = {
  userName: 'Tanishka',
  activeMethod: 'deep-work',
  workStartHour: 7,
  workEndHour: 22,
  focusTargetHours: 20,
  remindersEnabled: true,
}

const now = new Date()
let events = createSeedEvents(now)

const api = {
  getEvents: () => events,
  addEvent: (e) => {
    const ev = { ...e, id: `x${events.length}`, start: new Date(e.start).toISOString(), end: new Date(e.end).toISOString() }
    events = [...events, ev]
    return ev
  },
  addEvents: (list) => list.map(api.addEvent),
  moveEvent: (id, start) => {
    events = events.map((e) => {
      if (e.id !== id) return e
      const len = new Date(e.end) - new Date(e.start)
      const s = new Date(start)
      return { ...e, start: s.toISOString(), end: new Date(s.getTime() + len).toISOString() }
    })
  },
  removeEvent: (id) => {
    events = events.filter((e) => e.id !== id)
  },
  removeEvents: (ids) => {
    events = events.filter((e) => !ids.includes(e.id))
  },
  toggleComplete: (id) => {
    events = events.map((e) => (e.id === id ? { ...e, completed: !e.completed } : e))
  },
}

const QUERIES = [
  'am I free tonight at 8?',
  'move my DSA session from 5 PM to 8 PM',
  "what does my week look like?",
  "what's on today?",
  'when can I fit 90 minutes of deep work this week?',
  'add gym tomorrow at 7am for 45 minutes',
  'how productive was I this week?',
  'how can I improve my schedule?',
  'plan my week with time blocking',
  'what is eat the frog?',
  'how do I stop procrastinating?',
  'cancel my recruiter call',
  'push my next deep work block an hour later',
  'am I busy tomorrow afternoon?',
  'mark DSA practice as done',
  'hey',
  'help',
  'blorp zonk',
]

let failures = 0

for (const q of QUERIES) {
  let r
  try {
    r = respond(q, { events, settings: DEFAULT_SETTINGS, now })
  } catch (err) {
    failures += 1
    console.log(`\n❌ "${q}"\n   THREW: ${err.stack.split('\n').slice(0, 3).join('\n   ')}`)
    continue
  }
  const flat = r.text.replace(/\n+/g, ' ').replace(/\*\*/g, '')
  console.log(`\n▸ "${q}"  [${r.intent} ${Math.round(r.confidence * 100)}%]`)
  console.log(`   ${flat.slice(0, 180)}${flat.length > 180 ? '…' : ''}`)
  if (r.blocks.length) console.log(`   blocks: ${r.blocks.map((b) => b.type).join(', ')}`)
  if (r.actions.length) console.log(`   actions: ${r.actions.map((a) => `${a.kind}:"${a.label}"`).join(' | ')}`)
  if (r.intent === 'unknown' && q !== 'blorp zonk') failures += 1
}

console.log('\n--- action execution ---')
const moveReply = respond('move my DSA session from 5 PM to 8 PM', { events, settings: DEFAULT_SETTINGS, now })
const moveAction = moveReply.actions.find((a) => a.kind === 'move')
if (moveAction) {
  const before = events.find((e) => e.id === moveAction.payload.eventId)
  const res = applyAction(moveAction, api)
  const after = events.find((e) => e.id === moveAction.payload.eventId)
  console.log(`  ${res.summary} — ${res.detail}`)
  console.log(`  ${new Date(before.start).toLocaleString()}  →  ${new Date(after.start).toLocaleString()}`)
  if (new Date(before.start).getTime() === new Date(after.start).getTime()) {
    failures += 1
    console.log('  ❌ move did not change the event')
  }
} else {
  failures += 1
  console.log('  ❌ no move action produced')
}

const tmplReply = respond('plan my week with pomodoro', { events, settings: DEFAULT_SETTINGS, now })
const tmplAction = tmplReply.actions.find((a) => a.kind === 'applyMethod')
if (tmplAction) {
  const n = events.length
  const res = applyAction(tmplAction, api)
  console.log(`  ${res.summary} — ${res.detail} (${events.length - n} events added)`)
  if (events.length === n) failures += 1
} else {
  failures += 1
  console.log('  ❌ no applyMethod action produced')
}

console.log(`\n${failures ? `❌ ${failures} problem(s)` : '✅ all queries handled'}`)
process.exit(failures ? 1 : 0)
