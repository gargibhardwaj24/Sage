import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Mail, Sparkles, TriangleAlert } from 'lucide-react'
import Button from '@/components/ui/Button'
import { Field, Input, PasswordInput } from '@/components/ui/Field'
import { useAuth } from '@/store/AuthContext'
import { authMessage } from '@/lib/errors'

const HIGHLIGHTS = [
  'Ask in plain English — Sage reads your real calendar',
  'Every AI change is checked for conflicts, then waits for you',
  'Six productivity methods that generate a real weekly plan',
]

export function AuthPage() {
  const { signIn, signUp, signInAsDemo, signInWithGoogle, demoAvailable } = useAuth()
  const [mode, setMode] = useState('signin')
  const [form, setForm] = useState({ email: '', password: '', displayName: '' })
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(null)
  const [confirmed, setConfirmed] = useState(null)

  const set = (patch) => setForm((f) => ({ ...f, ...patch }))

  const run = async (label, fn) => {
    setError(null)
    setBusy(label)
    try {
      await fn()
    } catch (e) {
      setError(authMessage(e))
    } finally {
      setBusy(null)
    }
  }

  const submit = (e) => {
    e.preventDefault()
    if (mode === 'signin') {
      run('form', () => signIn(form.email.trim(), form.password))
    } else {
      run('form', async () => {
        await signUp(form.email.trim(), form.password, form.displayName.trim())
        setConfirmed(form.email.trim())
      })
    }
  }

  if (confirmed) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="surface-card w-full max-w-md rounded-card p-8 text-center"
        >
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-accent">
            <Mail size={24} strokeWidth={2.2} />
          </span>
          <h2 className="mt-5 text-headline tracking-tight text-ink">
            Check your inbox
          </h2>
          <p className="mx-auto mt-3 max-w-sm text-body-md leading-relaxed text-muted">
            We sent a confirmation link to{' '}
            <span className="font-medium text-ink">{confirmed}</span>.{' '}
            Click the link in the email to activate your account.
          </p>
          <p className="mt-4 text-label-sm text-faint">
            Didn't get it? Check your spam folder or try signing up again.
          </p>
          <Button
            variant="primary"
            size="md"
            className="mt-6 w-full justify-center"
            onClick={() => {
              setConfirmed(null)
              setMode('signin')
            }}
          >
            Back to sign in
            <ArrowRight size={16} strokeWidth={2} />
          </Button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="grid w-full max-w-4xl gap-8 lg:grid-cols-2 lg:gap-14"
      >
        <div className="flex flex-col justify-center">
          <span className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-control bg-primary">
              <svg viewBox="0 0 64 64" className="h-4 w-4" aria-hidden="true">
                <rect
                  x="14"
                  y="20"
                  width="36"
                  height="30"
                  rx="8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="5"
                />
                <path
                  d="M20 14v8M44 14v8"
                  stroke="currentColor"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
                <path
                  d="M23 37.5l5.5 5.5L42 30"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="5.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className="text-headline-md font-semibold tracking-tight text-ink">Sage</span>
          </span>

          <h1 className="mt-8 text-display-sm text-ink">
            Become the version of yourself{' '}
            <span className="text-muted">you&apos;re working toward.</span>
          </h1>

          {/* <ul className="mt-8 space-y-3">
            {HIGHLIGHTS.map((h) => (
              <li key={h} className="flex items-start gap-2.5 text-body-md text-muted">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[rgb(var(--accent))]" />
                {h}
              </li>
            ))}
          </ul> */}
        </div>

        <div className="surface-card rounded-card p-6 sm:p-8">
          <p className="eyebrow">{mode === 'signin' ? 'Welcome back' : 'Create your account'}</p>
          <h2 className="mt-3 text-headline tracking-tight text-ink">
            {mode === 'signin' ? 'Sign in to Sage' : 'Start planning with Sage'}
          </h2>

          {demoAvailable ? (
            <>
              <Button
                variant="accent"
                size="md"
                className="mt-6 w-full justify-center"
                disabled={busy !== null}
                onClick={() => run('demo', signInAsDemo)}
              >
                {busy === 'demo' ? 'Setting up your week…' : 'Try the demo'}
              </Button>
              <p className="mt-2 text-center text-label-sm text-faint">
                A full calendar, freshly generated. No signup.
              </p>

              <div className="my-6 flex items-center gap-3">
                <span className="h-px flex-1 bg-[rgb(var(--line))]" />
                <span className="text-label-sm text-faint">or</span>
                <span className="h-px flex-1 bg-[rgb(var(--line))]" />
              </div>
            </>
          ) : null}

          <form onSubmit={submit} className="space-y-3">
            {mode === 'signup' ? (
              <Field label="Name" htmlFor="auth-name">
                <Input
                  id="auth-name"
                  value={form.displayName}
                  onChange={(e) => set({ displayName: e.target.value })}
                  placeholder="What should Sage call you?"
                  autoComplete="name"
                />
              </Field>
            ) : null}

            <Field label="Email" htmlFor="auth-email">
              <Input
                id="auth-email"
                type="email"
                required
                value={form.email}
                onChange={(e) => set({ email: e.target.value })}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </Field>

            <Field label="Password" htmlFor="auth-password" hint="8+ characters">
              <PasswordInput
                id="auth-password"
                required
                minLength={8}
                value={form.password}
                onChange={(e) => set({ password: e.target.value })}
                placeholder="••••••••"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              />
            </Field>

            {error ? (
              <p className="flex items-start gap-2 rounded-control bg-rose-500/10 px-3 py-2 text-label-sm leading-relaxed text-rose-600 dark:text-rose-300">
                <TriangleAlert size={13} strokeWidth={2.2} className="mt-px shrink-0" />
                {error}
              </p>
            ) : null}

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full justify-center"
              disabled={busy !== null}
            >
              {busy === 'form'
                ? 'Working…'
                : mode === 'signin'
                  ? 'Sign in'
                  : 'Create account'}
              <ArrowRight size={16} strokeWidth={2} />
            </Button>
          </form>

          <Button
            variant="secondary"
            size="md"
            className="mt-3 w-full justify-center"
            disabled={busy !== null}
            onClick={() => run('google', signInWithGoogle)}
          >
            Continue with Google
          </Button>

          <button
            type="button"
            onClick={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin')
              setError(null)
            }}
            className="mt-6 w-full text-center text-label-sm text-muted transition-colors hover:text-ink"
          >
            {mode === 'signin'
              ? "New here? Create an account"
              : 'Already have an account? Sign in'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default AuthPage
