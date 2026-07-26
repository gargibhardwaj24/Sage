import { parseWhen } from '../src/lib/ai/datetime.js'

const NOW = new Date(2026, 6, 25, 14, 0, 0)

const f = (d) =>
  d ? `${d.toDateString()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` : '—'

const cases = [
  'am I free tonight at 8?',
  'move my DSA session from 5 PM to 8 PM',
  'am I free tomorrow at 10am?',
  'schedule deep work tomorrow 9 to 11',
  'add gym on monday at 7am for 45 minutes',
  'block 2 hours for revision on wednesday',
  'what does my week look like',
  'free slots this afternoon',
  'move standup to 3:30pm',
  'cancel my 5pm',
  'add a call july 28 at 4pm',
  'reschedule mock interview to friday morning',
  'i need 90 minutes of deep work tomorrow',
  'anything on the 30th of july',
  'in 3 days at 6pm',
  'book lunch at 12pm for 45 mins',
  'am I busy between 2 and 4 tomorrow',
  'next monday at 9',
  'move gym to 6:45',
  'plan next week',
]

for (const c of cases) {
  const w = parseWhen(c, NOW)
  console.log(
    `${c}\n  day=${w.day ? w.day.toDateString() : '—'} part=${w.partOfDay ?? '—'} range=${w.isRange} dur=${w.duration ?? '—'}\n  start=${f(w.start)}  end=${f(w.end)}\n`
  )
}
