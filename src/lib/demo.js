const RESEED_FLAG = 'sage.demo.reseed'

export const DEMO_EMAIL = (import.meta.env?.VITE_DEMO_EMAIL ?? '').trim().toLowerCase()
const DEMO_PASSWORD = import.meta.env?.VITE_DEMO_PASSWORD ?? ''

export const isDemoConfigured = Boolean(DEMO_EMAIL && DEMO_PASSWORD)

export const demoCredentials = () => ({ email: DEMO_EMAIL, password: DEMO_PASSWORD })

export const isDemoUser = (user) =>
  Boolean(DEMO_EMAIL && user?.email && user.email.trim().toLowerCase() === DEMO_EMAIL)

export function requestReseed() {
  try {
    sessionStorage.setItem(RESEED_FLAG, '1')
  } catch {
    /* ignore */
  }
}

export function consumeReseed() {
  try {
    const pending = sessionStorage.getItem(RESEED_FLAG) === '1'
    if (pending) sessionStorage.removeItem(RESEED_FLAG)
    return pending
  } catch {
    return false
  }
}
