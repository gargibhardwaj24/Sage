import { addDays, setHours, setMinutes, setSeconds, startOfDay, startOfWeek } from 'date-fns'

const WEEKDAY_NAMES = {
  sunday: 0,
  sun: 0,
  monday: 1,
  mon: 1,
  tuesday: 2,
  tues: 2,
  tue: 2,
  wednesday: 3,
  weds: 3,
  wed: 3,
  thursday: 4,
  thurs: 4,
  thur: 4,
  thu: 4,
  friday: 5,
  fri: 5,
  saturday: 6,
  sat: 6,
}

const MONTH_NAMES = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
}

export const PART_OF_DAY_HOURS = {
  morning: 9,
  afternoon: 14,
  evening: 19,
  tonight: 20,
  night: 21,
}

export const PART_OF_DAY_WINDOW = {
  morning: [6, 12],
  afternoon: [12, 17],
  evening: [17, 21],
  tonight: [17, 23],
  night: [20, 23],
}

const PREPOSITIONS = new Set([
  'at', 'from', 'to', 'till', 'until', 'by', 'around', 'about', 'after',
  'before', 'starting', 'start', 'between', 'and', 'past',
])

export function normalize(text) {
  return String(text)
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/\bo'?clock\b/g, '')
    .replace(/\ba\.m\.?\b/g, 'am')
    .replace(/\bp\.m\.?\b/g, 'pm')
    .replace(/\btmrw?\b|\btmr\b/g, 'tomorrow')
    .replace(/\bmorn\b/g, 'morning')
    .replace(/\bnoon\b|\bmidday\b/g, '12pm')
    .replace(/\bmidnight\b/g, '12am')
    .replace(/\bhalf an hour\b/g, '30 minutes')
    .replace(/\ban hour\b/g, '60 minutes')
    .replace(/\bcouple of hours\b|\bcouple hours\b/g, '2 hours')
    .replace(/\s+/g, ' ')
    .trim()
}

const DURATION_RE =
  /\b(?:for\s+)?(\d+(?:\.\d+)?)\s*(hours?|hrs?|h|minutes?|mins?|m)\b(?!\s*(?:am|pm))/g

export function extractDuration(text) {
  let minutes = null
  let cleaned = text

  cleaned = cleaned.replace(DURATION_RE, (match, value, unit, offset, whole) => {
    const isHour = /^h/.test(unit)
    const before = whole.slice(Math.max(0, offset - 6), offset)
    const looksLikeDuration = isHour || /\bfor\s*$/.test(before) || /^(minutes?|mins?)$/.test(unit)
    if (!looksLikeDuration) return match
    if (minutes === null) minutes = Math.round(parseFloat(value) * (isHour ? 60 : 1))
    return ' '
  })

  return { minutes, text: cleaned.replace(/\s+/g, ' ').trim() }
}

const TIME_RE = /(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/g

export function extractTimeTokens(text) {
  const tokens = []
  TIME_RE.lastIndex = 0
  let match

  while ((match = TIME_RE.exec(text)) !== null) {
    const [raw, hourStr, minuteStr, meridiem] = match
    const hour = parseInt(hourStr, 10)
    if (hour > 24) continue

    const before = text.slice(0, match.index).trim().split(' ')
    const prevWord = before[before.length - 1] ?? ''
    const after = text.slice(match.index + raw.length).trim()
    const nextWord = after.split(' ')[0] ?? ''

    const hasPrep = PREPOSITIONS.has(prevWord)
    const hasColon = Boolean(minuteStr)
    const hasMeridiem = Boolean(meridiem)
    const isRangeDash = /[-–]\s*$/.test(text.slice(0, match.index))
    const opensRange = /^(to|till|until)\b/.test(nextWord) || /^[-–]/.test(after)

    if (!hasPrep && !hasColon && !hasMeridiem && !isRangeDash && !opensRange) continue

    tokens.push({
      hour,
      minute: minuteStr ? parseInt(minuteStr, 10) : 0,
      meridiem: meridiem ?? null,
      index: match.index,
      length: raw.length,
      prevWord,
      isRangeDash,
    })
  }
  return tokens
}

export function resolveHour(token, context = {}) {
  const { hour, minute, meridiem } = token
  const { eveningContext = false, morningContext = false } = context

  if (meridiem === 'am') return { hour: hour === 12 ? 0 : hour, minute }
  if (meridiem === 'pm') return { hour: hour === 12 ? 12 : hour + 12, minute }
  if (hour === 0 || hour > 12) return { hour: hour % 24, minute }
  if (hour === 12) return { hour: 12, minute }

  if (eveningContext) return { hour: hour < 12 ? hour + 12 : hour, minute }
  if (morningContext) return { hour, minute }
  return hour <= 7 ? { hour: hour + 12, minute } : { hour, minute }
}

export function extractDay(text, now) {
  const today = startOfDay(now)

  const iso = text.match(/\b(\d{4})-(\d{2})-(\d{2})\b/)
  if (iso) {
    return {
      day: new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3])),
      explicit: true,
      phrase: iso[0],
    }
  }

  if (/\bday after tomorrow\b/.test(text)) {
    return { day: addDays(today, 2), explicit: true, phrase: 'day after tomorrow' }
  }
  if (/\btomorrow\b/.test(text)) return { day: addDays(today, 1), explicit: true, phrase: 'tomorrow' }
  if (/\byesterday\b/.test(text)) return { day: addDays(today, -1), explicit: true, phrase: 'yesterday' }
  if (/\btonight\b|\bthis evening\b|\btoday\b|\bthis morning\b|\bthis afternoon\b/.test(text)) {
    return { day: today, explicit: true, phrase: 'today' }
  }

  const inDays = text.match(/\bin (\d+) days?\b/)
  if (inDays) {
    return { day: addDays(today, Number(inDays[1])), explicit: true, phrase: inDays[0] }
  }

  const inWeeks = text.match(/\bin (\d+) weeks?\b/)
  if (inWeeks) {
    return { day: addDays(today, Number(inWeeks[1]) * 7), explicit: true, phrase: inWeeks[0] }
  }

  const monthFirst = text.match(
    /\b(jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|sept|september|oct|october|nov|november|dec|december)\s+(\d{1,2})(?:st|nd|rd|th)?\b/
  )
  const dayFirst = text.match(
    /\b(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?(jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|sept|september|oct|october|nov|november|dec|december)\b/
  )
  if (monthFirst || dayFirst) {
    const month = MONTH_NAMES[(monthFirst ? monthFirst[1] : dayFirst[2])]
    const dayNum = Number(monthFirst ? monthFirst[2] : dayFirst[1])
    let candidate = new Date(now.getFullYear(), month, dayNum)
    if (candidate < addDays(today, -180)) candidate = new Date(now.getFullYear() + 1, month, dayNum)
    return { day: candidate, explicit: true, phrase: (monthFirst ?? dayFirst)[0] }
  }

  const weekday = text.match(
    /\b(this|next|coming|on)?\s*(sunday|sun|monday|mon|tuesday|tues|tue|wednesday|weds|wed|thursday|thurs|thur|thu|friday|fri|saturday|sat)\b/
  )
  if (weekday) {
    const target = WEEKDAY_NAMES[weekday[2]]
    let delta = (target - now.getDay() + 7) % 7
    if (delta === 0) delta = 7
    return { day: addDays(today, delta), explicit: true, phrase: weekday[0].trim() }
  }

  if (/\bnext week\b/.test(text)) {
    return {
      day: addDays(startOfWeek(today, { weekStartsOn: 1 }), 7),
      explicit: true,
      phrase: 'next week',
    }
  }
  if (/\bthis week\b/.test(text)) {
    return { day: today, explicit: true, phrase: 'this week', span: 'week' }
  }

  return { day: null, explicit: false, phrase: null }
}

export function extractPartOfDay(text) {
  if (/\btonight\b/.test(text)) return 'tonight'
  if (/\b(this )?morning\b/.test(text)) return 'morning'
  if (/\b(this )?afternoon\b/.test(text)) return 'afternoon'
  if (/\b(this )?evening\b/.test(text)) return 'evening'
  if (/\bnight\b/.test(text)) return 'night'
  return null
}

const combine = (day, { hour, minute }) =>
  setSeconds(setMinutes(setHours(startOfDay(day), hour), minute), 0)

export function parseWhen(input, now = new Date()) {
  const text = normalize(input)
  const { minutes: duration, text: withoutDuration } = extractDuration(text)

  const dayInfo = extractDay(withoutDuration, now)
  const partOfDay = extractPartOfDay(withoutDuration)

  const timeSource = dayInfo.phrase
    ? withoutDuration.replace(dayInfo.phrase, ' ')
    : withoutDuration

  const eveningContext = partOfDay === 'evening' || partOfDay === 'tonight' || partOfDay === 'night'
  const morningContext = partOfDay === 'morning'

  const tokens = extractTimeTokens(timeSource)
  const resolved = tokens.map((t) => ({
    ...resolveHour(t, { eveningContext, morningContext }),
    prevWord: t.prevWord,
    meridiem: t.meridiem,
  }))

  if (resolved.length === 2 && !tokens[0].meridiem && tokens[1].meridiem === 'pm') {
    if (tokens[0].hour >= 1 && tokens[0].hour <= 11) resolved[0].hour = tokens[0].hour + 12
  }

  const isRange =
    resolved.length >= 2 &&
    (/\bfrom\b/.test(timeSource) ||
      /\bbetween\b/.test(timeSource) ||
      /[-–]/.test(timeSource) ||
      resolved[1].prevWord === 'to' ||
      resolved[1].prevWord === 'till' ||
      resolved[1].prevWord === 'until')

  const baseDay = dayInfo.day ?? startOfDay(now)
  let start = null
  let end = null

  if (resolved.length) {
    start = combine(baseDay, resolved[0])
    if (!dayInfo.explicit && start < now) start = addDays(start, 1)
    if (isRange) {
      end = combine(startOfDay(start), resolved[1])
      if (end <= start) end = addDays(end, 1)
    } else if (duration) {
      end = new Date(start.getTime() + duration * 60000)
    }
  } else if (partOfDay) {
    start = combine(baseDay, { hour: PART_OF_DAY_HOURS[partOfDay], minute: 0 })
  }

  return {
    text,
    day: dayInfo.day,
    dayExplicit: dayInfo.explicit,
    dayPhrase: dayInfo.phrase,
    span: dayInfo.span ?? null,
    partOfDay,
    times: resolved.map(({ hour, minute }) => ({ hour, minute })),
    start,
    end,
    duration,
    isRange,
  }
}
