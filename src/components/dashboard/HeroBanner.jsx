import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CalendarRange, Flame, Sparkles } from 'lucide-react'
import ProgressRing from '@/components/ui/ProgressRing'
import Button from '@/components/ui/Button'
import { greeting, fmtDayLong } from '@/lib/date'
import { scoreLabel } from '@/lib/analytics'

export function HeroBanner({ name, score, streak, focusHours, focusTarget, now, method, onPlanWeek }) {
  const band = scoreLabel(score)

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col gap-10 pb-2 lg:flex-row lg:items-center lg:justify-between lg:gap-16"
    >
      <div className="max-w-2xl">
        <p className="eyebrow flex items-center gap-2.5">
          <span className="h-px w-8 bg-[rgb(var(--line-strong))]" />
          {greeting(now)}
          {name ? `, ${name}` : ''}
        </p>

        <h1 className="mt-5 text-display-sm text-ink sm:text-display">
          Become the version of yourself{' '}
          <span className="text-muted">you&apos;re working toward.</span>
        </h1>

        <p className="mt-5 max-w-xl text-body-lg text-muted">
          {fmtDayLong(now)}. You&apos;ve logged{' '}
          <span className="font-medium text-ink">{focusHours}h</span> of focus work this week
          against a {focusTarget}h target
          {streak > 0 ? (
            <>
              , and you&apos;re{' '}
              <span className="font-medium text-ink">
                {streak} day{streak === 1 ? '' : 's'}
              </span>{' '}
              into a streak
            </>
          ) : null}
          .
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-2.5">
          <Button variant="primary" size="md" onClick={onPlanWeek}>
            <CalendarRange size={16} strokeWidth={2} />
            Plan my week
          </Button>
          <Button as={Link} to="/assistant" variant="accent" size="md">
            <Sparkles size={16} strokeWidth={2} />
            Ask Sage
          </Button>
          {streak > 0 ? (
            <span className="ml-1 inline-flex items-center gap-1.5 px-2 py-1.5 text-label-sm text-muted">
              <Flame size={13} strokeWidth={2} className="text-accent" />
              {streak} day streak
            </span>
          ) : null}
        </div>

        {method ? (
          <p className="mt-4 text-label-sm text-faint">
            Planning with <span className="text-accent">{method.name}</span> ·{' '}
            {method.tagline.toLowerCase()}
          </p>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-5">
        <ProgressRing value={score} sublabel="Score" size={140} />
        <div className="max-w-[160px]">
          <p className="text-body-md font-medium tracking-tight text-ink">{band.label}</p>
          <p className="mt-1.5 text-label-sm leading-relaxed text-muted">
            Weighted across follow-through, focus, consistency and recovery.
          </p>
        </div>
      </div>
    </motion.section>
  )
}

export default HeroBanner
