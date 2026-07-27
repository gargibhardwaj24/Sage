import { getCategory } from '@/data/categories'
import { differenceInCalendarDays, toDate } from '@/lib/date'

export const ALL_CATEGORIES = 'all'
export const DEFAULT_LIMIT = 60

const norm = (value) => String(value ?? '').toLowerCase()

export const tokenize = (query) => norm(query).trim().split(/\s+/).filter(Boolean)

export function scoreEvent(event, terms, now) {
  const title = norm(event.title)
  const notes = norm(event.notes)
  const category = norm(getCategory(event.categoryId).name)

  let score = 0

  for (const term of terms) {
    if (title === term) score += 14
    else if (title.startsWith(term)) score += 10
    else if (title.includes(term)) score += 7
    else if (category.includes(term)) score += 4
    else if (notes.includes(term)) score += 2
    else return -1
  }

  const distance = Math.abs(differenceInCalendarDays(toDate(event.start), now))
  score += Math.max(0, 4 - distance / 45)

  if (event.completed) score -= 1.5

  return score
}

export function searchEvents(events, query, options = {}) {
  const { categoryId = ALL_CATEGORIES, limit = DEFAULT_LIMIT, now = new Date() } = options
  const terms = tokenize(query)
  if (!terms.length) return []

  const hits = []

  for (const event of events) {
    if (categoryId !== ALL_CATEGORIES && event.categoryId !== categoryId) continue
    const score = scoreEvent(event, terms, now)
    if (score < 0) continue
    hits.push({ event, score })
  }

  hits.sort((a, b) => b.score - a.score || a.event.start.localeCompare(b.event.start))

  return hits.slice(0, limit).map((hit) => hit.event)
}

export function countByCategory(events) {
  const counts = new Map()
  for (const event of events) {
    counts.set(event.categoryId, (counts.get(event.categoryId) ?? 0) + 1)
  }
  return counts
}
