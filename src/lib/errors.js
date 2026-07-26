const DEV = Boolean(import.meta.env?.DEV)

export function logDev(scope, detail) {
  if (DEV && detail) console.warn(`[sage:${scope}]`, detail)
}

const ASSISTANT_MESSAGES = {
  auth: 'The assistant is unavailable right now.',
  'missing-proxy': 'The assistant is unavailable right now.',
  model: 'The assistant is unavailable right now.',
  config: 'The assistant is unavailable right now.',
  rate: 'The assistant is busy right now. Try again in a moment.',
  network: "Couldn't reach the assistant.",
  server: 'The assistant is having trouble. Try again shortly.',
  request: "The assistant couldn't handle that one. Try rephrasing it.",
}

export const assistantMessage = (kind) =>
  ASSISTANT_MESSAGES[kind] ?? 'The assistant is unavailable right now.'

const AUTH_PATTERNS = [
  [/invalid login credentials|invalid email or password/i, "That email and password don't match."],
  [/email not confirmed/i, 'Check your inbox and confirm your email address first.'],
  [/user already registered|already been registered/i, 'An account with that email already exists.'],
  [/password should be at least|password.*too short/i, 'Please choose a longer password.'],
  [/unable to validate email|invalid email/i, 'That email address looks invalid.'],
  [/rate limit|too many requests/i, 'Too many attempts. Wait a moment and try again.'],
  [
    /disabled|not enabled|unsupported provider|provider is not/i,
    "That sign-in option isn't available right now.",
  ],
]

export function authMessage(error) {
  const raw = typeof error === 'string' ? error : (error?.message ?? '')
  logDev('auth', raw)

  for (const [pattern, message] of AUTH_PATTERNS) {
    if (pattern.test(raw)) return message
  }
  return 'Something went wrong. Please try again.'
}
