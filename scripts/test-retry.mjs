import { withRetry } from '../src/lib/retry.js'

let failures = 0
const check = (label, cond, detail) => {
  if (cond) console.log(`  ✓ ${label}`)
  else {
    failures += 1
    console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`)
  }
}

console.log('\n▸ withRetry — a read that fails twice then succeeds')
{
  let calls = 0
  const rows = await withRetry(
    async () => {
      calls += 1
      if (calls < 3) throw new TypeError('Failed to fetch')
      return ['event-a', 'event-b']
    },
    3,
    1
  )
  check('recovers on the 3rd attempt', calls === 3, `calls=${calls}`)
  check('returns the real payload, not empty', Array.isArray(rows) && rows.length === 2)
}

console.log('\n▸ withRetry — a persistent failure eventually throws (no silent empty)')
{
  let calls = 0
  let threw = null
  try {
    await withRetry(
      async () => {
        calls += 1
        throw new TypeError('Failed to fetch')
      },
      3,
      1
    )
  } catch (e) {
    threw = e
  }
  check('tries exactly `attempts` times', calls === 3, `calls=${calls}`)
  check('throws instead of resolving to []', threw instanceof Error)
}

console.log('\n▸ withRetry — a first-try success does not retry')
{
  let calls = 0
  const v = await withRetry(async () => {
    calls += 1
    return 42
  })
  check('calls the work once', calls === 1)
  check('passes the value through', v === 42)
}

console.log(failures === 0 ? '\n✅ retry behaves' : `\n❌ ${failures} check(s) failed`)
process.exit(failures === 0 ? 0 : 1)
