const store = new Map()
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear(),
}

const cache = await import('../src/lib/eventCache.js')
const {
  readCache, writeCache, clearCache,
  readOutbox, writeOutbox, enqueue, clearOutbox,
  readLegacyEvents, clearLegacyEvents,
  isOfflineError, CACHE_VERSION, LEGACY_KEY,
} = cache

let failures = 0
const check = (label, cond, detail) => {
  if (cond) console.log(`  ✓ ${label}`)
  else { failures += 1; console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`) }
}
const section = (n) => console.log(`\n▸ ${n}`)

const ev = (id, title) => ({ id, title, start: '2026-07-27T09:00:00.000Z', end: '2026-07-27T10:00:00.000Z' })

section('cache is per user and versioned')
{
  writeCache('user-a', [ev('1', 'A meeting')])
  writeCache('user-b', [ev('2', 'B meeting'), ev('3', 'B other')])

  check('reads back what it wrote', readCache('user-a').events.length === 1)
  check('keeps users separate', readCache('user-b').events.length === 2)
  check('a user with no cache reads null', readCache('user-c') === null)
  check('stamps a version', readCache('user-a').version === CACHE_VERSION)
  check('records when it was saved', typeof readCache('user-a').savedAt === 'number')

  store.set('sage.events.cache.user-a', JSON.stringify({ version: 1, userId: 'user-a', events: [ev('9', 'old')] }))
  check('rejects an old cache version', readCache('user-a') === null)

  store.set('sage.events.cache.user-a', JSON.stringify({ version: CACHE_VERSION, userId: 'someone-else', events: [ev('9', 'leak')] }))
  check('rejects a cache belonging to another user', readCache('user-a') === null)

  store.set('sage.events.cache.user-a', JSON.stringify({ version: CACHE_VERSION, userId: 'user-a', events: 'not-an-array' }))
  check('rejects a malformed payload', readCache('user-a') === null)

  writeCache('user-a', [ev('1', 'A meeting')])
  clearCache('user-a')
  check('clears cleanly', readCache('user-a') === null)
  check('clearing one user leaves the other', readCache('user-b').events.length === 2)
}

section('outbox queues offline writes')
{
  clearOutbox('user-a')
  check('starts empty', readOutbox('user-a').length === 0)

  enqueue('user-a', { kind: 'insert', events: [ev('10', 'queued')] })
  enqueue('user-a', { kind: 'delete', ids: ['11'] })
  const q = readOutbox('user-a')

  check('queues in order', q.length === 2 && q[0].kind === 'insert' && q[1].kind === 'delete')
  check('stamps each op', typeof q[0].at === 'number')
  check('queues are per user', readOutbox('user-b').length === 0)

  writeOutbox('user-a', [q[1]])
  check('can be rewritten after a partial flush', readOutbox('user-a').length === 1)

  writeOutbox('user-a', [])
  check('writing an empty queue removes the key', readOutbox('user-a').length === 0)
}

section('offline detection')
{
  check('TypeError counts as offline', isOfflineError(new TypeError('Failed to fetch')))
  check('network wording counts', isOfflineError(new Error('NetworkError when attempting to fetch')))
  check('timeouts count', isOfflineError(new Error('timeout of 5000ms exceeded')))
  check('a permission error does not', !isOfflineError(new Error('new row violates row-level security policy')))
  check('a constraint error does not', !isOfflineError(new Error('duplicate key value violates unique constraint')))

  globalThis.navigator = { onLine: false }
  check('a browser reporting offline counts, whatever the error', isOfflineError(new Error('anything')))
  globalThis.navigator = { onLine: true }
  check('back online, a plain error does not count', !isOfflineError(new Error('bad request')))
}

section('legacy local events feed the first-login import')
{
  check('absent by default', readLegacyEvents().length === 0)
  store.set(`sage.${LEGACY_KEY}`, JSON.stringify([ev('20', 'local one'), ev('21', 'local two')]))
  check('found when present', readLegacyEvents().length === 2)
  clearLegacyEvents()
  check('cleared after import', readLegacyEvents().length === 0)

  store.set(`sage.${LEGACY_KEY}`, JSON.stringify({ not: 'an array' }))
  check('malformed legacy data is ignored', readLegacyEvents().length === 0)
}

console.log(failures === 0 ? '\n✅ cache, outbox and offline detection behave' : `\n❌ ${failures} check(s) failed`)
process.exit(failures === 0 ? 0 : 1)
