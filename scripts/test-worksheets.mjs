import { buildDrafts, SHEET_KINDS } from '../src/lib/worksheet.js'
import { WORKSHEETS } from '../src/data/worksheets.js'

const SETTINGS = { workStartHour: 7, workEndHour: 22 }

const day = (offset = 0) => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + offset)
  return d
}

const clock = (d) =>
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`

const dayName = (d) => d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })

let failures = 0

function check(label, condition, detail) {
  if (condition) {
    console.log(`  ✓ ${label}`)
    return
  }
  failures += 1
  console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`)
}

function section(name) {
  console.log(`\n▸ ${name}`)
}

const state = (methodId, patch) => {
  const sheet = WORKSHEETS[methodId]
  return { sheet, state: { ...SHEET_KINDS[sheet.kind].init(sheet), ...patch } }
}

const run = (methodId, patch, ctx = {}) => {
  const { sheet, state: s } = state(methodId, patch)
  return buildDrafts(sheet, s, {
    date: day(0),
    methodId,
    events: [],
    settings: SETTINGS,
    ...ctx,
  })
}

section('timebox — contiguous slots merge, gaps do not')
{
  const cell = (text) => ({ text, categoryId: 'deep-work', priority: 'p1' })
  const { drafts } = run('time-boxing', {
    slots: {
      '09:00': cell('Ship it'),
      '09:30': cell('Ship it'),
      '10:00': cell('Ship it'),
      '11:00': cell('Ship it'),
      '14:00': cell('Something else'),
    },
  })

  check('5 filled slots collapse to 3 blocks', drafts.length === 3, `got ${drafts.length}`)
  check(
    'the run of 3 becomes one 90-minute block',
    (drafts[0].end - drafts[0].start) / 60000 === 90,
    `${(drafts[0].end - drafts[0].start) / 60000}m`
  )
  check('the detached 11:00 slot stays 30 minutes', (drafts[1].end - drafts[1].start) / 60000 === 30)
}

section('timebox — a different title breaks the run')
{
  const cell = (text) => ({ text, categoryId: 'deep-work', priority: 'p1' })
  const { drafts } = run('time-boxing', {
    slots: { '09:00': cell('A'), '09:30': cell('B'), '10:00': cell('A') },
  })
  check('adjacent-but-different stays 3 blocks', drafts.length === 3, `got ${drafts.length}`)
}

section('rows — empty titles are skipped, times and lengths honoured')
{
  const { drafts } = run('deep-work', {
    rows: [
      { title: 'Deep work', categoryId: 'deep-work', start: '08:30', minutes: 120, notes: 'done = draft sent' },
      { title: '', categoryId: 'admin', start: '11:00', minutes: 30, notes: '' },
    ],
  })

  check('only the named row is built', drafts.length === 1, `got ${drafts.length}`)
  check('start time comes from the sheet', clock(drafts[0].start) === '08:30', clock(drafts[0].start))
  check('length comes from the sheet', (drafts[0].end - drafts[0].start) / 60000 === 120)
  check('the note rides along', drafts[0].notes === 'done = draft sent')
}

section('themes — one block per named day, blanks skipped')
{
  const { drafts } = run('day-theming', {
    rows: [
      { day: 0, title: 'Deep work', categoryId: 'deep-work', start: '09:00', minutes: 240 },
      { day: 1, title: '', categoryId: 'meeting', start: '09:00', minutes: 240 },
      { day: 2, title: 'Learning', categoryId: 'learning', start: '09:00', minutes: 240 },
    ],
  })

  check('blank days produce nothing', drafts.length === 2, `got ${drafts.length}`)
  check('titles are prefixed', drafts[0].title === 'Theme · Deep work', drafts[0].title)
  check(
    'the two themes land on different days',
    drafts[0].start.getDay() !== drafts[1].start.getDay()
  )
}

section('frog — one frog, reward chained straight after')
{
  const { drafts } = run('eat-the-frog', {
    frog: 'Rewrite the migration',
    firstAction: 'Open the schema file',
    start: '08:30',
    minutes: 90,
  })

  check('frog plus reward', drafts.length === 2, `got ${drafts.length}`)
  check('frog is marked', drafts[0].title.startsWith('🐸'), drafts[0].title)
  check('first action lands in the notes', drafts[0].notes.includes('Open the schema file'))
  check(
    'reward starts exactly when the frog ends',
    drafts[1].start.getTime() === drafts[0].end.getTime()
  )

  const empty = run('eat-the-frog', { frog: '   ' })
  check('an unnamed frog builds nothing', empty.drafts.length === 0)
}

section('matrix — quadrants route differently')
{
  const { drafts, notices } = run('eisenhower', {
    quadrants: {
      q1: [{ title: 'Fire', minutes: 60 }],
      q2: [
        { title: 'Compounding A', minutes: 90 },
        { title: 'Compounding B', minutes: 90 },
        { title: 'Compounding C', minutes: 90 },
      ],
      q3: [{ title: 'Someone else’s urgent' }, { title: 'And another' }],
      q4: [{ title: 'Bookmarks' }],
    },
  })

  const titles = drafts.map((d) => d.title)
  check('Q4 is never scheduled', !titles.includes('Bookmarks'))
  check('Q4 is reported', notices.some((n) => n.includes('Q4')), notices.join(' | '))
  check('Q3 collapses into a single batch', titles.filter((t) => t === 'Q3 batch').length === 1)

  const batch = drafts.find((d) => d.title === 'Q3 batch')
  check('both Q3 items are listed in the batch notes', batch.notes.split('\n').length === 2)

  const q2 = drafts.filter((d) => d.priority === 'q2')
  const q2Days = new Set(q2.map((d) => d.start.toDateString()))
  check('all three Q2 tasks are placed', q2.length === 3, `got ${q2.length}`)
  check(
    'Q2 spreads one per day',
    q2Days.size === 3,
    q2.map((d) => `${dayName(d.start)} ${clock(d.start)}`).join(', ')
  )
}

const fullDay = (offset) => {
  const base = day(offset)
  const out = []
  for (let h = SETTINGS.workStartHour; h < SETTINGS.workEndHour; h += 1) {
    const s = new Date(base)
    s.setHours(h, 0, 0, 0)
    const e = new Date(s)
    e.setHours(h + 1, 0, 0, 0)
    out.push({ id: `busy-${offset}-${h}`, start: s.toISOString(), end: e.toISOString(), completed: false })
  }
  return out
}

section('matrix — a full first day must not collapse Q2 onto one day')
{
  const { drafts } = run(
    'eisenhower',
    {
      quadrants: {
        q2: [
          { title: 'A', minutes: 90 },
          { title: 'B', minutes: 90 },
        ],
      },
    },
    { events: fullDay(0) }
  )

  const days = new Set(drafts.map((d) => d.start.toDateString()))
  check('both still placed', drafts.length === 2, `got ${drafts.length}`)
  check(
    'and on separate days once today is skipped',
    days.size === 2,
    drafts.map((d) => `${dayName(d.start)} ${clock(d.start)}`).join(', ')
  )
}

section('matrix — respects existing events')
{
  const busy = fullDay(0)

  const { drafts, notices } = run(
    'eisenhower',
    { quadrants: { q1: [{ title: 'Fire', minutes: 60 }] } },
    { events: busy }
  )

  check('a full day places nothing', drafts.length === 0, `got ${drafts.length}`)
  check('and says so', notices.some((n) => n.includes('did not fit')), notices.join(' | '))
}

console.log(
  failures === 0 ? '\n✅ all worksheet builders behave' : `\n❌ ${failures} check(s) failed`
)
process.exit(failures === 0 ? 0 : 1)
