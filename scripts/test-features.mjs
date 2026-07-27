import { HOLIDAYS_BY_YEAR, COVERED_YEARS, holidaysForYears } from '../src/data/holidays.js'
import { buildCustomCategory, normalizeCustomCategories, BUILT_IN_CATEGORIES, setCustomCategories, getCategory, getAllCategories } from '../src/data/categories.js'
import { contrastRatio } from '../src/lib/color.js'
import { isTimed, isAllDay, freeSlots, conflictPairs } from '../src/lib/schedule.js'

let failures = 0
const check = (label, cond, detail) => {
  if (cond) console.log(`  ✓ ${label}`)
  else {
    failures += 1
    console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`)
  }
}
const section = (n) => console.log(`\n▸ ${n}`)

section('holiday data — well formed and internally consistent')
{
  check('covers at least two years', COVERED_YEARS.length >= 2, COVERED_YEARS.join(','))

  let bad = []
  for (const [year, list] of Object.entries(HOLIDAYS_BY_YEAR)) {
    for (const h of list) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(h.date)) bad.push(`${h.name}: bad format ${h.date}`)
      else {
        const d = new Date(`${h.date}T00:00:00`)
        if (Number.isNaN(d.getTime())) bad.push(`${h.name}: unparseable ${h.date}`)
        if (String(d.getFullYear()) !== year) bad.push(`${h.name}: ${h.date} not in ${year}`)
      }
      if (!h.name?.trim()) bad.push(`${h.date}: missing name`)
      if (!['national', 'festival', 'observance'].includes(h.type)) bad.push(`${h.name}: bad type`)
    }
  }
  check('every entry has a valid, in-year date and type', bad.length === 0, bad.slice(0, 4).join(' | '))

  const nat2026 = HOLIDAYS_BY_YEAR[2026].filter((h) => h.type === 'national').map((h) => h.date)
  check('2026 has the three national days',
    ['2026-01-26', '2026-08-15', '2026-10-02'].every((d) => nat2026.includes(d)),
    nat2026.join(','))

  const names26 = HOLIDAYS_BY_YEAR[2026].map((h) => h.name)
  check('2026 includes the major festivals',
    ['Holi', 'Diwali', 'Dussehra', 'Janmashtami', 'Christmas Day'].every((n) => names26.includes(n)))

  for (const [year, list] of Object.entries(HOLIDAYS_BY_YEAR)) {
    const byName = Object.fromEntries(list.map((h) => [h.name, h.date]))
    check(`${year} Republic Day is 26 Jan`, byName['Republic Day'] === `${year}-01-26`, byName['Republic Day'])
    check(`${year} Independence Day is 15 Aug`, byName['Independence Day'] === `${year}-08-15`, byName['Independence Day'])
    check(`${year} Gandhi Jayanti is 2 Oct`, byName['Gandhi Jayanti'] === `${year}-10-02`, byName['Gandhi Jayanti'])
  }

  const merged = holidaysForYears([2026, 2027, 2026])
  const keys = merged.map((h) => `${h.date}|${h.name}`)
  check('merging years de-duplicates', new Set(keys).size === keys.length)
  check('merged output is date-sorted', keys.every((_, i) => i === 0 || merged[i - 1].date <= merged[i].date))
}

section('all-day events must never block scheduling')
{
  const day = new Date(2026, 10, 8)
  const mk = (h, m, dur) => {
    const s = new Date(2026, 10, 8, h, m)
    return { id: `t${h}${m}`, start: s.toISOString(), end: new Date(s.getTime() + dur * 60000).toISOString(), completed: false }
  }
  const holiday = {
    id: 'holiday-diwali',
    start: new Date(2026, 10, 8, 0, 0).toISOString(),
    end: new Date(2026, 10, 8, 23, 59).toISOString(),
    completed: false,
    allDay: true,
    source: 'holiday',
  }

  check('holiday is detected as all-day', isAllDay(holiday) && !isTimed(holiday))
  check('normal event is timed', isTimed(mk(9, 0, 60)))

  const withHoliday = freeSlots([holiday, mk(9, 0, 60)], day, { workStartHour: 7, workEndHour: 22, minMinutes: 30, now: new Date(2026, 10, 8, 0, 0) })
  const withoutHoliday = freeSlots([mk(9, 0, 60)], day, { workStartHour: 7, workEndHour: 22, minMinutes: 30, now: new Date(2026, 10, 8, 0, 0) })
  check('an all-day holiday does not consume the day', withHoliday.length === withoutHoliday.length && withHoliday.length > 0,
    `withHoliday=${withHoliday.length} withoutHoliday=${withoutHoliday.length}`)

  const pairs = conflictPairs([holiday, mk(9, 0, 60), mk(14, 0, 60)], day)
  check('an all-day holiday raises no conflicts', pairs.length === 0, `pairs=${pairs.length}`)
}

section('custom areas — colours are computed for contrast')
{
  const area = buildCustomCategory({ name: 'Side Project', hex: '#00875c' })
  check('gets a stable id', typeof area.id === 'string' && area.id.startsWith('area-'))
  check('marked custom', area.custom === true)
  check('derives a short label', Boolean(area.short))

  check('light ink is readable on white', contrastRatio(area.textLight, '#ffffff') >= 4.5,
    contrastRatio(area.textLight, '#ffffff').toFixed(2))
  check('dark ink is readable on the dark surface', contrastRatio(area.textDark, '#12131a') >= 4.5,
    contrastRatio(area.textDark, '#12131a').toFixed(2))

  const swatches = ['#e34948', '#eb6834', '#eda100', '#3f9d54', '#0ea5e9', '#6f4ae8', '#e87ba4', '#5b6b7f']
  const badLight = swatches.filter((h) => contrastRatio(buildCustomCategory({ name: 'x', hex: h }).textLight, '#ffffff') < 4.5)
  const badDark = swatches.filter((h) => contrastRatio(buildCustomCategory({ name: 'x', hex: h }).textDark, '#12131a') < 4.5)
  check('all swatches pass AA on light', badLight.length === 0, badLight.join(','))
  check('all swatches pass AA on dark', badDark.length === 0, badDark.join(','))
}

section('custom area registry')
{
  const before = getAllCategories().length
  setCustomCategories([{ name: 'Errands', hex: '#eda100' }])
  const after = getAllCategories()
  check('registers into the live list', after.length === before + 1, `${before} -> ${after.length}`)

  const added = after.find((c) => c.name === 'Errands')
  check('resolvable via getCategory', getCategory(added.id).name === 'Errands')

  check('rejects entries without a name', normalizeCustomCategories([{ hex: '#fff' }, null, 'x']).length === 0)

  const builtInId = BUILT_IN_CATEGORIES[0].id
  check('cannot shadow a built-in id',
    normalizeCustomCategories([{ id: builtInId, name: 'Hijack', hex: '#000' }]).length === 0)

  const dupes = normalizeCustomCategories([
    { id: 'area-dup', name: 'A', hex: '#111111' },
    { id: 'area-dup', name: 'B', hex: '#222222' },
  ])
  check('de-duplicates ids', dupes.length === 1)

  setCustomCategories([])
  check('clearing restores built-ins only', getAllCategories().length === BUILT_IN_CATEGORIES.length)
  check('unknown id falls back to a real category', Boolean(getCategory('area-gone-forever')?.id))
}

section('area validation — shared by every entry point')
{
  const { validateArea, AREA_NAME_MAX } = await import('../src/lib/areas.js')
  const existing = [buildCustomCategory({ name: 'Freelance', hex: '#eb6834' })]

  check('accepts a good area', validateArea({ name: 'Side Project', hex: '#00875c', existing }) === null)
  check('rejects a blank name', validateArea({ name: '   ', hex: '#00875c', existing }) !== null)
  check('rejects an invalid colour', validateArea({ name: 'Ok', hex: 'nope', existing }) !== null)
  check('rejects a duplicate of a custom area',
    /already exists/.test(validateArea({ name: 'freelance', hex: '#00875c', existing }) ?? ''))
  check('rejects a duplicate of a built-in (case/space insensitive)',
    /already exists/.test(validateArea({ name: '  fitness ', hex: '#00875c', existing }) ?? ''))
  check('rejects an over-long name',
    validateArea({ name: 'x'.repeat(AREA_NAME_MAX + 1), hex: '#00875c', existing }) !== null)
  check('accepts 3-digit hex', validateArea({ name: 'Tri', hex: '#abc', existing }) === null)
}

section('cross-midnight events split across days')
{
  const { daySegments, spansMidnight } = await import('../src/lib/schedule.js')
  const start = new Date(2026, 6, 27, 23, 0)
  const end = new Date(2026, 6, 28, 2, 0)
  const ev = { id: 'night', title: 'Night shift', start: start.toISOString(), end: end.toISOString(), completed: false }

  check('detected as spanning midnight', spansMidnight(ev))
  check('a same-day event is not', !spansMidnight({ ...ev, end: new Date(2026, 6, 27, 23, 59).toISOString() }))

  const mon = daySegments([ev], new Date(2026, 6, 27))
  const tue = daySegments([ev], new Date(2026, 6, 28))
  const wed = daySegments([ev], new Date(2026, 6, 29))

  check('appears on both days', mon.length === 1 && tue.length === 1, `mon=${mon.length} tue=${tue.length}`)
  check('and not on the day after', wed.length === 0)

  check('monday slice runs 23:00 -> midnight', new Date(mon[0].start).getHours() === 23 && new Date(mon[0].end).getDate() === 28)
  check('tuesday slice starts at midnight', new Date(tue[0].start).getHours() === 0)
  check('tuesday slice ends at 02:00', new Date(tue[0].end).getHours() === 2)

  check('monday piece is the head', mon[0].continuesAfter === true && mon[0].continuesBefore === false)
  check('tuesday piece is the tail', tue[0].continuesBefore === true && tue[0].continuesAfter === false)
  check('both keep the real range', mon[0].realStart === tue[0].realStart && mon[0].realEnd === tue[0].realEnd)
  check('segment ids are unique per day', mon[0].segId !== tue[0].segId)
  check('real event id is preserved', mon[0].id === 'night' && tue[0].id === 'night')

  const { freeSlots } = await import('../src/lib/schedule.js')
  const slots = freeSlots([ev], new Date(2026, 6, 28), {
    workStartHour: 0, workEndHour: 8, minMinutes: 30, now: new Date(2026, 6, 28, 0, 0),
  })
  const overlapsSpill = slots.some((s) => s.start < new Date(2026, 6, 28, 2, 0) && s.end > new Date(2026, 6, 28, 0, 0))
  check('next morning is not offered as free', !overlapsSpill,
    slots.map((s) => `${s.start.getHours()}:00-${s.end.getHours()}:00`).join(','))
}

section('display name comes from the identity provider')
{
  const { resolveDisplayName, nameFromEmail, isEmailDerived } = await import('../src/lib/identity.js')

  const googleUser = {
    email: 'gargibhardwaj2430@gmail.com',
    user_metadata: { full_name: 'Gargi Bhardwaj', name: 'Gargi Bhardwaj', avatar_url: 'x' },
  }
  check('prefers the OAuth name over an email-derived profile',
    resolveDisplayName(googleUser, { display_name: 'gargibhardwaj2430' }) === 'Gargi',
    resolveDisplayName(googleUser, { display_name: 'gargibhardwaj2430' }))

  check('works with no profile row at all', resolveDisplayName(googleUser, null) === 'Gargi')
  check('falls back to given_name', resolveDisplayName({ email: 'a@b.com', user_metadata: { given_name: 'Ada', family_name: 'L' } }, null) === 'Ada')
  check('email signup display_name still works',
    resolveDisplayName({ email: 'x@y.com', user_metadata: { display_name: 'Tanishka' } }, null) === 'Tanishka')
  check('a genuine profile name is respected',
    resolveDisplayName({ email: 'x@y.com', user_metadata: {} }, { display_name: 'Real Person' }) === 'Real')
  check('placeholder "there" is ignored',
    resolveDisplayName({ email: 'john.doe@x.com', user_metadata: {} }, { display_name: 'there' }) === 'John')

  check('detects an email-derived name', isEmailDerived('gargibhardwaj2430', 'gargibhardwaj2430@gmail.com'))
  check('does not flag a real name', !isEmailDerived('Gargi', 'gargibhardwaj2430@gmail.com'))
  check('email fallback strips trailing digits', nameFromEmail('gargibhardwaj2430@gmail.com') === 'Gargibhardwaj')
  check('email fallback splits on dots', nameFromEmail('john.doe@x.com') === 'John')
  check('no email yields empty', resolveDisplayName({ user_metadata: {} }, null) === '')
}

section('copy/paste clipboard entry')
{
  const { toClipboardEntry } = await import('../src/hooks/useEventClipboard.js')
  const start = new Date(2026, 6, 27, 14, 30)
  const end = new Date(2026, 6, 27, 16, 0)
  const entry = toClipboardEntry({
    id: 'x', title: 'Standup', categoryId: 'meeting', notes: 'agenda',
    reminderMinutes: 10, start: start.toISOString(), end: end.toISOString(),
  })

  check('captures duration', entry.minutes === 90, String(entry.minutes))
  check('captures clock time for fallback paste', entry.clockMinutes === 14 * 60 + 30, String(entry.clockMinutes))
  check('carries the details worth copying', entry.title === 'Standup' && entry.categoryId === 'meeting' && entry.notes === 'agenda' && entry.reminderMinutes === 10)
  check('does not carry the source id', !('id' in entry))
}

console.log(failures === 0 ? '\n✅ holidays, all-day handling and custom areas behave' : `\n❌ ${failures} check(s) failed`)
process.exit(failures === 0 ? 0 : 1)
