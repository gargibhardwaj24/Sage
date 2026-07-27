import { storage } from '@/lib/storage'
import { logDev } from '@/lib/errors'
import { withTimeout } from '@/lib/retry'

const ENDPOINT = 'https://calendarific.com/api/v2/holidays'
const CACHE_VERSION = 1
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000
const REQUEST_TIMEOUT_MS = 8000

const cacheKey = (country, year) => `holidays.${country}.${year}`

const rawKey = () => String(import.meta.env?.VITE_CALENDARIFIC_API_KEY ?? '').trim()

export function hasCalendarificKey() {
  const key = rawKey()
  return key.length > 16 && !/^your[_-]?/i.test(key) && !/^<.*>$/.test(key)
}

const NATIONAL = /national holiday|national day/i
const FESTIVAL = /religious|hindu|muslim|christian|sikh|jain|buddhist|observance holiday/i

function classify(entry) {
  const types = Array.isArray(entry.type) ? entry.type.join(' ') : String(entry.type ?? '')
  const primary = String(entry.primary_type ?? '')
  const blob = `${types} ${primary}`

  if (NATIONAL.test(blob)) return 'national'
  if (FESTIVAL.test(blob)) return 'festival'
  return 'observance'
}

export function mapCalendarific(list, year) {
  const seen = new Set()
  const out = []

  for (const entry of Array.isArray(list) ? list : []) {
    const iso = entry?.date?.iso
    const name = String(entry?.name ?? '').trim()
    if (!iso || !name) continue

    const date = iso.slice(0, 10)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue
    if (String(year) && !date.startsWith(String(year))) continue

    const key = `${date}|${name}`
    if (seen.has(key)) continue
    seen.add(key)

    out.push({ date, name, type: classify(entry) })
  }

  return out.sort((a, b) => a.date.localeCompare(b.date))
}

export function readHolidayCache(country, year) {
  const raw = storage.get(cacheKey(country, year))
  if (!raw || raw.version !== CACHE_VERSION || !Array.isArray(raw.holidays)) return null
  if (Date.now() - (raw.fetchedAt ?? 0) > CACHE_TTL_MS) return null
  return raw.holidays
}

export const writeHolidayCache = (country, year, holidays) =>
  storage.set(cacheKey(country, year), {
    version: CACHE_VERSION,
    country,
    year,
    fetchedAt: Date.now(),
    holidays,
  })

export async function fetchHolidayYear(year, country = 'IN', signal) {
  if (!hasCalendarificKey()) throw new Error('calendarific:no-key')

  const url = `${ENDPOINT}?api_key=${encodeURIComponent(rawKey())}&country=${country}&year=${year}`
  const response = await withTimeout(fetch(url, { signal }), REQUEST_TIMEOUT_MS)

  if (!response.ok) throw new Error(`calendarific:http-${response.status}`)

  const payload = await response.json()
  const code = payload?.meta?.code
  if (code !== 200) throw new Error(`calendarific:api-${code ?? 'unknown'}`)

  return mapCalendarific(payload?.response?.holidays, year)
}

export async function loadHolidayYear(year, country = 'IN', signal) {
  const cached = readHolidayCache(country, year)
  if (cached) return { holidays: cached, source: 'cache' }

  try {
    const holidays = await fetchHolidayYear(year, country, signal)
    if (holidays.length) writeHolidayCache(country, year, holidays)
    return { holidays, source: 'api' }
  } catch (error) {
    logDev('holidays', error?.message ?? error)
    throw error
  }
}
