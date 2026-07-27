import { storage } from '@/lib/storage'

export const CACHE_VERSION = 2

const scope = (userId) => userId ?? 'local'
const cacheKey = (userId) => `events.cache.${scope(userId)}`
const outboxKey = (userId) => `events.outbox.${scope(userId)}`

export const LEGACY_KEY = 'events.v1'

export function readCache(userId) {
  const raw = storage.get(cacheKey(userId))
  if (!raw || typeof raw !== 'object') return null
  if (raw.version !== CACHE_VERSION) return null
  if (raw.userId !== scope(userId)) return null
  if (!Array.isArray(raw.events)) return null
  return raw
}

export function writeCache(userId, events) {
  return storage.set(cacheKey(userId), {
    version: CACHE_VERSION,
    userId: scope(userId),
    savedAt: Date.now(),
    events,
  })
}

export const clearCache = (userId) => storage.remove(cacheKey(userId))

export const readOutbox = (userId) => {
  const raw = storage.get(outboxKey(userId))
  return Array.isArray(raw) ? raw : []
}

export const writeOutbox = (userId, ops) =>
  ops.length ? storage.set(outboxKey(userId), ops) : storage.remove(outboxKey(userId))

export function enqueue(userId, op) {
  const queue = readOutbox(userId)
  queue.push({ ...op, at: Date.now() })
  writeOutbox(userId, queue)
  return queue.length
}

export const clearOutbox = (userId) => storage.remove(outboxKey(userId))

export function readLegacyEvents() {
  const raw = storage.get(LEGACY_KEY)
  return Array.isArray(raw) ? raw : []
}

export const clearLegacyEvents = () => storage.remove(LEGACY_KEY)

export const browserIsOffline = () =>
  typeof navigator !== 'undefined' && navigator.onLine === false

export function isOfflineError(error) {
  if (browserIsOffline()) return true
  if (error instanceof TypeError) return true
  if (error?.name === 'TimeoutError') return true
  const message = String(error?.message ?? '')
  return /failed to fetch|networkerror|network request failed|load failed|timed? ?out/i.test(message)
}
