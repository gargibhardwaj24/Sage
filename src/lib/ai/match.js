
const STOPWORDS = new Set([
  'move', 'reschedule', 'shift', 'push', 'pull', 'change', 'switch', 'swap',
  'cancel', 'delete', 'remove', 'drop', 'clear', 'scrap',
  'add', 'schedule', 'book', 'create', 'set', 'put', 'block', 'plan', 'make',
  'mark', 'complete', 'completed', 'finish', 'finished', 'done', 'tick',
  'find', 'show', 'tell', 'list', 'give', 'get',
  'my', 'me', 'i', 'the', 'a', 'an', 'is', 'are', 'am', 'was', 'do', 'does',
  'can', 'could', 'would', 'will', 'please', 'to', 'from', 'at', 'on', 'in',
  'for', 'of', 'and', 'or', 'it', 'that', 'this', 'up', 'out', 'about',
  'session', 'sessions', 'event', 'events', 'thing', 'slot', 'time', 'entry',
  'appointment', 'calendar', 'what', 'when', 'where', 'have', 'has', 'got',
  'free', 'busy', 'any', 'anything', 'all', 'some', 'over', 'back', 'again',
  'today', 'tonight', 'tomorrow', 'yesterday', 'morning', 'afternoon',
  'evening', 'night', 'week', 'weekend', 'day', 'days', 'weeks', 'next',
  'later', 'earlier', 'now', 'soon', 'am', 'pm', 'oclock',
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
  'mon', 'tue', 'tues', 'wed', 'weds', 'thu', 'thur', 'thurs', 'fri', 'sat', 'sun',
  'hour', 'hours', 'minute', 'minutes', 'min', 'mins',
])

export function keywords(phrase) {
  return String(phrase)
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOPWORDS.has(w) && !/^\d+$/.test(w))
}

function tokenScore(token, titleWords, title) {
  if (titleWords.includes(token)) return 3
  if (title.includes(token)) return 2
  const prefixed = titleWords.find((w) => w.startsWith(token) || token.startsWith(w))
  if (prefixed && Math.min(prefixed.length, token.length) >= 3) return 1.5
  const initials = titleWords.map((w) => w[0]).join('')
  if (token.length >= 2 && initials.includes(token)) return 1.5
  return 0
}

export function findEventMatches(events, phrase, options = {}) {
  const { now = new Date(), near = null, includePast = false, limit = 5 } = options
  const tokens = keywords(phrase)
  if (!tokens.length) return []

  const scored = []

  for (const event of events) {
    const title = event.title.toLowerCase()
    const titleWords = title.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean)

    let score = tokens.reduce((sum, t) => sum + tokenScore(t, titleWords, title), 0)
    if (score <= 0) continue

    score = score / Math.sqrt(tokens.length)

    const start = new Date(event.start)
    const hoursAway = (start - now) / 3600000

    if (hoursAway < 0) {
      if (!includePast) score -= 3
      score -= Math.min(4, Math.abs(hoursAway) / 48)
    } else {
      score -= Math.min(3, hoursAway / 72)
    }

    if (near) {
      const dayDelta = Math.abs(start - near) / 86400000
      if (dayDelta < 1) score += 3
      else if (dayDelta < 2) score += 1.2
    }

    if (event.completed) score -= 1.5

    scored.push({ event, score })
  }

  return scored.sort((a, b) => b.score - a.score).slice(0, limit)
}

export function resolveEvent(events, phrase, options = {}) {
  const matches = findEventMatches(events, phrase, options)
  if (!matches.length) return { event: null, ambiguous: false, alternatives: [] }

  const [best, second] = matches
  const ambiguous = Boolean(second && best.score - second.score < 1.2)

  return {
    event: best.event,
    score: best.score,
    ambiguous,
    alternatives: matches.slice(1, 4).map((m) => m.event),
  }
}
