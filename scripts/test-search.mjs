const store = new Map()
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear(),
}

const { searchEvents, scoreEvent, tokenize, ALL_CATEGORIES } = await import('../src/lib/eventSearch.js')
const { mapCalendarific } = await import('../src/lib/holidaysApi.js')

let failures = 0
const check = (label, cond, detail) => {
  if (cond) console.log(`  ✓ ${label}`)
  else { failures += 1; console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`) }
}
const section = (n) => console.log(`\n▸ ${n}`)

const NOW = new Date(2026, 6, 27, 12, 0)
const at = (d, h, title, categoryId = 'deep-work', extra = {}) => {
  const s = new Date(2026, 6, d, h, 0)
  return {
    id: `${title}-${d}-${h}`,
    title,
    categoryId,
    notes: '',
    completed: false,
    start: s.toISOString(),
    end: new Date(s.getTime() + 3600000).toISOString(),
    ...extra,
  }
}

const EVENTS = [
  at(27, 9, 'Deep work · Project Atlas'),
  at(28, 14, 'Portfolio site polish', 'learning'),
  at(29, 10, 'Team standup', 'meeting'),
  at(30, 16, 'Gym session', 'fitness', { notes: 'leg day at atlas gym' }),
  at(27, 18, 'Dinner with family', 'personal'),
  at(31, 11, 'Deep work · Reporting', 'deep-work', { completed: true }),
]

section('search matches titles, notes and area names')
{
  check('finds by title word', searchEvents(EVENTS, 'atlas', { now: NOW }).length === 2,
    String(searchEvents(EVENTS, 'atlas', { now: NOW }).length))
  check('title match outranks a note match',
    searchEvents(EVENTS, 'atlas', { now: NOW })[0].title === 'Deep work · Project Atlas')
  check('finds by note text', searchEvents(EVENTS, 'leg day', { now: NOW })[0]?.title === 'Gym session')
  check('finds by area name', searchEvents(EVENTS, 'meetings', { now: NOW })[0]?.title === 'Team standup')
  check('is case insensitive', searchEvents(EVENTS, 'STANDUP', { now: NOW }).length === 1)
  check('blank query returns nothing', searchEvents(EVENTS, '   ', { now: NOW }).length === 0)
  check('nonsense returns nothing', searchEvents(EVENTS, 'zzzz', { now: NOW }).length === 0)
}

section('every term must match (AND, not OR)')
{
  const both = searchEvents(EVENTS, 'deep atlas', { now: NOW })
  check('narrows to events matching both terms', both.length === 1, String(both.length))
  check('and picks the right one', both[0]?.title === 'Deep work · Project Atlas')
  check('one bad term kills the match', searchEvents(EVENTS, 'deep zzz', { now: NOW }).length === 0)
  check('tokenizer splits on whitespace', tokenize('  deep   atlas ').join('|') === 'deep|atlas')
}

section('category filter narrows results')
{
  const all = searchEvents(EVENTS, 'deep', { now: NOW })
  const filtered = searchEvents(EVENTS, 'deep', { now: NOW, categoryId: 'deep-work' })
  const other = searchEvents(EVENTS, 'deep', { now: NOW, categoryId: 'fitness' })

  check('unfiltered finds both deep work items', all.length === 2, String(all.length))
  check('filtering by area keeps them', filtered.length === 2, String(filtered.length))
  check('filtering by another area excludes them', other.length === 0)
  check('ALL_CATEGORIES is the no-filter sentinel', ALL_CATEGORIES === 'all')
}

section('ranking')
{
  const exact = { ...at(27, 8, 'Standup'), id: 'exact' }
  const ranked = searchEvents([...EVENTS, exact], 'standup', { now: NOW })
  check('an exact title beats a partial', ranked[0].id === 'exact', ranked[0].title)

  const done = scoreEvent(EVENTS.find((e) => e.completed), ['deep'], NOW)
  const open = scoreEvent(EVENTS.find((e) => !e.completed && /Deep/.test(e.title)), ['deep'], NOW)
  check('completed events rank below open ones', done < open, `${done} vs ${open}`)

  check('a non-match scores -1', scoreEvent(EVENTS[0], ['zzz'], NOW) === -1)
  check('respects the result limit', searchEvents(EVENTS, 'e', { now: NOW, limit: 2 }).length <= 2)
}

section('Calendarific response mapping')
{
  const payload = [
    { name: 'Republic Day', date: { iso: '2026-01-26' }, type: ['National holiday'], primary_type: 'National holiday' },
    { name: 'Diwali', date: { iso: '2026-11-08T00:00:00+05:30' }, type: ['Religious'], primary_type: 'Hindu' },
    { name: 'Some Season', date: { iso: '2026-03-01' }, type: ['Season'], primary_type: 'Season' },
    { name: 'Republic Day', date: { iso: '2026-01-26' }, type: ['National holiday'] },
    { name: '', date: { iso: '2026-05-05' }, type: ['National holiday'] },
    { name: 'Wrong year', date: { iso: '2025-01-01' }, type: ['National holiday'] },
    { name: 'Bad date', date: { iso: 'nonsense' }, type: ['National holiday'] },
  ]
  const mapped = mapCalendarific(payload, 2026)

  check('keeps the valid entries only', mapped.length === 3, JSON.stringify(mapped.map((m) => m.name)))
  check('strips a timestamp down to the day', mapped.find((m) => m.name === 'Diwali')?.date === '2026-11-08')
  check('classifies a national holiday', mapped.find((m) => m.name === 'Republic Day')?.type === 'national')
  check('classifies a religious festival', mapped.find((m) => m.name === 'Diwali')?.type === 'festival')
  check('anything else is an observance', mapped.find((m) => m.name === 'Some Season')?.type === 'observance')
  check('de-duplicates', mapped.filter((m) => m.name === 'Republic Day').length === 1)
  check('drops other years', !mapped.some((m) => m.name === 'Wrong year'))
  check('sorted by date', mapped.every((_, i) => i === 0 || mapped[i - 1].date <= mapped[i].date))
  check('handles a junk payload', mapCalendarific(null, 2026).length === 0)
}

console.log(failures === 0 ? '\n✅ search and Calendarific mapping behave' : `\n❌ ${failures} check(s) failed`)
process.exit(failures === 0 ? 0 : 1)
