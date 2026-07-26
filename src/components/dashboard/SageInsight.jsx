import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import { MotionCard } from '@/components/ui/Card'
import { buildInsights } from '@/lib/insights'
import { cn } from '@/lib/cn'

const TONES = {
  good: 'text-accent',
  warning: 'text-amber-600 dark:text-amber-400',
  neutral: 'text-accent',
}

export function SageInsight({ events, settings, now, delay = 0 }) {
  const navigate = useNavigate()
  const [index, setIndex] = useState(0)

  const insights = useMemo(() => buildInsights(events, settings, now), [events, settings, now])
  const insight = insights[index % insights.length]
  if (!insight) return null

  const go = (dir) => setIndex((i) => (i + dir + insights.length) % insights.length)

  return (
    <MotionCard delay={delay} className="flex flex-col p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded-lg bg-accent">
            <Sparkles size={12} strokeWidth={2.4} />
          </span>
          <span className="eyebrow">Sage insight</span>
        </span>

        {insights.length > 1 ? (
          <span className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous insight"
              className="grid h-7 w-7 place-items-center rounded-lg text-faint transition-colors hover:bg-[rgb(var(--card-high))] hover:text-ink"
            >
              <ChevronLeft size={14} strokeWidth={2} />
            </button>
            <span className="font-mono text-[10px] tabular-nums text-faint">
              {(index % insights.length) + 1}/{insights.length}
            </span>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next insight"
              className="grid h-7 w-7 place-items-center rounded-lg text-faint transition-colors hover:bg-[rgb(var(--card-high))] hover:text-ink"
            >
              <ChevronRight size={14} strokeWidth={2} />
            </button>
          </span>
        ) : null}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={insight.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="mt-4"
        >
          <p className={cn('text-headline-md tracking-tight text-ink', TONES[insight.tone])}>
            {insight.headline}
          </p>
          <p className="mt-2 text-body-md leading-relaxed text-muted">{insight.body}</p>

          <p className="mt-3 flex items-center gap-2 text-label-sm text-faint">
            <span className="h-1 w-1 rounded-full bg-[rgb(var(--accent))]" />
            {insight.evidence}
          </p>

          <button
            type="button"
            onClick={() => navigate('/assistant', { state: { prompt: insight.prompt, at: Date.now() } })}
            className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3.5 py-2 text-label-sm font-medium transition hover:brightness-95 dark:hover:brightness-110"
          >
            {insight.prompt}
            <ArrowRight size={13} strokeWidth={2.2} />
          </button>
        </motion.div>
      </AnimatePresence>
    </MotionCard>
  )
}

export default SageInsight
