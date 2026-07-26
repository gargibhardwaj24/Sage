import { motion } from 'framer-motion'
import { Sparkles, TriangleAlert } from 'lucide-react'
import RichText from './RichText'
import MessageBlocks from './MessageBlocks'
import { cn } from '@/lib/cn'

const ACTION_TONES = {
  primary: 'bg-primary hover:brightness-110',
  ghost:
    'surface-inset text-ink hover:bg-[rgb(var(--card-high))]',
  danger:
    'bg-rose-500/10 text-rose-600 hover:bg-rose-500/18 dark:bg-rose-500/15 dark:text-rose-300',
}

export function ChatMessage({ message, onAction, onFollowUp, isLast }) {
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="flex justify-end"
      >
        <div className="surface-inset max-w-[85%] rounded-card rounded-br-lg px-4 py-2.5 text-body-md leading-relaxed text-ink sm:max-w-[75%]">
          {message.text}
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="flex gap-3"
    >
      <span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-accent">
        <Sparkles size={15} strokeWidth={2.4} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="surface-card max-w-full rounded-card rounded-tl-lg px-4 py-3">
          {message.notice ? (
            <p className="mb-3 flex items-start gap-2 rounded-xl bg-amber-500/10 px-3 py-2 text-label-sm leading-relaxed text-amber-700 dark:text-amber-300">
              <TriangleAlert size={13} strokeWidth={2.2} className="mt-px shrink-0" />
              {message.notice}
            </p>
          ) : null}

          <RichText text={message.text} className="text-body-md text-muted" />
          <MessageBlocks blocks={message.blocks} />

          {message.actions?.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {message.actions.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => onAction(action, message)}
                  disabled={message.resolvedActionId && message.resolvedActionId !== action.id}
                  className={cn(
                    'group flex flex-col items-start rounded-xl px-3.5 py-2 text-left transition-all duration-200',
                    'disabled:cursor-not-allowed disabled:opacity-35',
                    ACTION_TONES[action.tone] ?? ACTION_TONES.ghost,
                    message.resolvedActionId === action.id && 'ring-2 ring-emerald-400'
                  )}
                >
                  <span className="text-xs font-semibold tracking-tight">{action.label}</span>
                  {action.description ? (
                    <span className="mt-0.5 text-[10px] font-semibold opacity-75">
                      {action.description}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          ) : null}

          {message.resolution ? (
            <p className="mt-3 rounded-xl bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-700 dark:bg-emerald-400/12 dark:text-emerald-300">
              ✓ {message.resolution}
            </p>
          ) : null}
        </div>

        {isLast && message.followUps?.length ? (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {message.followUps.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => onFollowUp(f)}
                className="rounded-full border px-3 py-1.5 text-[11.5px] font-medium text-muted transition hover:border-[rgb(var(--accent))] hover:text-accent"
              >
                {f}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </motion.div>
  )
}

export function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-accent">
        <Sparkles size={15} strokeWidth={2.4} />
      </span>
      <div className="surface-card flex items-center gap-1.5 rounded-card rounded-tl-lg px-4 py-4">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-[rgb(var(--accent))]"
            animate={{ opacity: [0.25, 1, 0.25], y: [0, -3, 0] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
    </div>
  )
}

export default ChatMessage
