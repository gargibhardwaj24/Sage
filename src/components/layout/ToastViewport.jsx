import { AnimatePresence, motion } from 'framer-motion'
import { Bell, Check, Info, Undo2, X } from 'lucide-react'
import { useToast } from '@/store/ToastContext'
import { cn } from '@/lib/cn'

const TONES = {
  default: { icon: Info, ring: 'text-accent bg-accent-soft' },
  success: { icon: Check, ring: 'text-emerald-600 dark:text-emerald-300 bg-emerald-500/12' },
  reminder: { icon: Bell, ring: 'text-amber-600 dark:text-amber-300 bg-amber-500/15' },
  danger: { icon: X, ring: 'text-rose-600 dark:text-rose-300 bg-rose-500/12' },
}

export function ToastViewport() {
  const { toasts, dismiss } = useToast()

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex flex-col items-center gap-2 px-4 lg:bottom-6 lg:right-6 lg:left-auto lg:items-end lg:px-0">
      <AnimatePresence initial={false}>
        {toasts.map((t) => {
          const tone = TONES[t.tone] ?? TONES.default
          const Icon = t.icon ?? tone.icon
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.96 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="surface-raised pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-card p-3.5 pr-3"
            >
              <span className={cn('mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl', tone.ring)}>
                <Icon size={15} strokeWidth={2.4} />
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium leading-tight text-ink">{t.title}</p>
                {t.description ? (
                  <p className="mt-0.5 text-xs leading-relaxed text-muted">{t.description}</p>
                ) : null}
                {t.action ? (
                  <button
                    type="button"
                    onClick={() => {
                      t.action.onClick()
                      dismiss(t.id)
                    }}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-accent-soft px-2.5 py-1 text-xs font-medium transition hover:brightness-95 dark:hover:brightness-110"
                  >
                    <Undo2 size={13} strokeWidth={2.6} />
                    {t.action.label}
                  </button>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss"
                className="shrink-0 rounded-lg p-1 text-faint transition hover:text-ink"
              >
                <X size={14} />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

export default ToastViewport
