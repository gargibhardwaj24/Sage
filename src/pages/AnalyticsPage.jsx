import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Activity,
  ChevronRight,
  Clock3,
  Download,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { MotionCard, CardHeader } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import ProgressRing from '@/components/ui/ProgressRing'
import Segmented from '@/components/ui/Segmented'
import EmptyState from '@/components/ui/EmptyState'
import StatTile from '@/components/analytics/StatTile'
import { EnergyHeatmap, RecentSessions } from '@/components/analytics/Panels'
import {
  CategoryDonut,
  FocusByHourChart,
  ScoreTrendChart,
  WeeklyLoadChart,
} from '@/components/analytics/Charts'
import { useEvents } from '@/store/EventsContext'
import { useSettings } from '@/store/SettingsContext'
import { useToast } from '@/store/ToastContext'
import { useNow } from '@/hooks/useNow'
import {
  dominantCategory,
  focusByHour,
  peakFocusHour,
  SCORE_WEIGHTS,
  scoreLabel,
  scoreTrend,
  streaks,
  weekStats,
} from '@/lib/analytics'
import { downloadCsv, eventsToCsv } from '@/lib/export'
import {
  addDays,
  atTime,
  dayKey,
  fmtDay,
  fmtTimeShort,
  format,
  startOfDay,
  startOfWeek,
  toDate,
  WEEK_OPTS,
} from '@/lib/date'
import { cn } from '@/lib/cn'

const RANGES = [
  { value: 4, label: '4 weeks' },
  { value: 8, label: '8 weeks' },
  { value: 12, label: '12 weeks' },
]

export function AnalyticsPage() {
  const { events } = useEvents()
  const { settings } = useSettings()
  const { toast } = useToast()
  const now = useNow(60_000)
  const [range, setRange] = useState(8)

  const data = useMemo(() => {
    const options = { focusTargetHours: settings.focusTargetHours, now }
    const stats = weekStats(events, now, options)
    const previous = weekStats(events, addDays(startOfWeek(now, WEEK_OPTS), -7), options)
    const trend = scoreTrend(events, range, options)

    const done = new Set(events.filter((e) => e.completed).map((e) => dayKey(e.start)))
    const activity = Array.from({ length: 14 }, (_, i) =>
      done.has(dayKey(addDays(startOfDay(now), i - 13))) ? 1 : 0
    )

    return {
      stats,
      previous,
      delta: stats.score - previous.score,
      trend,
      streak: streaks(events, now),
      hours: focusByHour(events, { weeks: range, now }),
      peak: peakFocusHour(events, { weeks: range, now }),
      top: dominantCategory(stats),
      activity,
      focusSeries: trend.map((w) => w.focusHours),
    }
  }, [events, settings, now, range])

  const { stats } = data
  const band = scoreLabel(stats.score)

  const exportReport = () => {
    const since = addDays(startOfDay(now), -range * 7)
    const scoped = events.filter((e) => toDate(e.start) >= since)
    downloadCsv(`sage-report-${format(now, 'yyyy-MM-dd')}.csv`, eventsToCsv(scoped))
    toast({
      tone: 'success',
      title: 'Report exported',
      description: `${scoped.length} events from the last ${range} weeks`,
    })
  }

  if (!events.length) {
    return (
      <MotionCard className="p-6">
        <EmptyState
          icon={Activity}
          title="Nothing to analyse yet"
          description="Add a few events and complete some of them — the score, streaks and trends build from there."
          action={
            <Button as={Link} to="/calendar" variant="primary" size="sm">
              Open the calendar
            </Button>
          }
        />
      </MotionCard>
    )
  }

  const focusDelta = Math.round((stats.focusHours - data.previous.focusHours) * 10) / 10
  const completionPct = Math.round(stats.completionRate * 100)
  const previousPct = Math.round(data.previous.completionRate * 100)

  return (
    <div className="space-y-5 sm:space-y-6">
      <header>
        <nav className="flex items-center gap-1.5 text-label-sm text-faint" aria-label="Breadcrumb">
          <span>Insights</span>
          <ChevronRight size={12} strokeWidth={2.2} />
          <span className="text-muted">Analytics</span>
        </nav>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-headline-lg text-ink">Performance analytics</h2>
            <p className="mt-2.5 text-body-lg text-muted">
              Week of {fmtDay(stats.start)} · {stats.plannedCount} events scheduled
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Segmented options={RANGES} value={range} onChange={setRange} size="sm" layoutId="range" />
            <Button variant="secondary" size="sm" onClick={exportReport}>
              <Download size={14} strokeWidth={2} />
              Export report
            </Button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 sm:gap-4">
        <StatTile
          label="Focus hours"
          value={stats.focusHours}
          unit="h"
          delta={focusDelta}
          deltaSuffix="h"
          hint={`Target ${settings.focusTargetHours}h`}
          viz="sparkline"
          vizProps={{ values: data.focusSeries }}
          delay={0}
        />
        <StatTile
          label="Objectives met"
          value={`${completionPct}%`}
          delta={completionPct - previousPct}
          deltaSuffix="%"
          hint={`${stats.completedCount} of ${stats.dueCount} due`}
          viz="progress"
          vizProps={{ value: stats.completionRate }}
          delay={0.05}
        />
        <StatTile
          label="Consistency"
          value={(stats.components.consistency * 10).toFixed(1)}
          unit="/ 10"
          hint="Days you finished something"
          viz="segments"
          vizProps={{ value: stats.components.consistency }}
          delay={0.1}
        />
        <StatTile
          label="Current streak"
          value={data.streak.current}
          unit={data.streak.current === 1 ? 'day' : 'days'}
          hint={`Personal best ${data.streak.longest} days`}
          viz="bars"
          vizProps={{ values: data.activity }}
          delay={0.15}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] sm:gap-5">
        <MotionCard className="flex flex-col items-center p-6">
          <ProgressRing value={stats.score} sublabel="This week" size={168} />

          <p className="mt-4 text-body-lg font-medium tracking-tight text-ink">{band.label}</p>
          <DeltaPill delta={data.delta} hasPrevious={data.previous.plannedCount > 0} />

          <div className="mt-6 w-full space-y-4">
            {SCORE_WEIGHTS.map((w) => {
              const pct = Math.round((stats.components[w.key] ?? 0) * 100)
              return (
                <div key={w.key}>
                  <div className="mb-1.5 flex items-baseline justify-between gap-2">
                    <span className="text-body-md text-ink">{w.label}</span>
                    <span className="font-mono text-label-sm tabular-nums text-muted">
                      {pct}%<span className="ml-1 text-faint">×{w.weight}</span>
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-[rgb(var(--line))]">
                    <motion.div
                      className="h-full rounded-full bg-[rgb(var(--accent))]"
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </div>
                  <p className="mt-1.5 text-label-sm leading-snug text-faint">{w.hint}</p>
                </div>
              )
            })}
          </div>
        </MotionCard>

        <MotionCard delay={0.1} className="p-5 sm:p-6">
          <CardHeader
            icon={TrendingUp}
            title="Flow state velocity"
            subtitle={`Weekly score against its running average · last ${range} weeks`}
          />
          <div className="mt-4">
            <ScoreTrendChart data={data.trend} height={260} />
          </div>
        </MotionCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 sm:gap-5">
        <EnergyHeatmap events={events} weeks={range} now={now} delay={0.15} />

        <MotionCard delay={0.18} className="p-5 sm:p-6">
          <CardHeader
            icon={Clock3}
            title="Time allocation"
            subtitle={
              data.top
                ? `${data.top.category.name} leads with ${data.top.hours}h`
                : 'Scheduled hours by category'
            }
          />
          <div className="mt-4">
            {stats.byCategory.length ? (
              <CategoryDonut data={stats.byCategory} />
            ) : (
              <EmptyState title="No events this week" description="Nothing scheduled to break down yet." />
            )}
          </div>
        </MotionCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 sm:gap-5">
        <MotionCard delay={0.2} className="p-5 sm:p-6">
          <CardHeader
            icon={Activity}
            title="Completed hours by day"
            subtitle="This week · focus work separated from everything else"
          />
          <div className="mt-4">
            <WeeklyLoadChart data={stats.byDay} />
          </div>
        </MotionCard>

        <RecentSessions events={events} now={now} delay={0.22} />
      </div>

      <MotionCard delay={0.25} className="p-5 sm:p-6">
        <CardHeader
          icon={Sparkles}
          title="When you actually focus"
          subtitle={
            data.peak
              ? `Completed deep work and learning · you peak around ${fmtTimeShort(atTime(now, data.peak.hour))}`
              : `Completed deep work and learning over the last ${range} weeks`
          }
          action={
            <Button as={Link} to="/assistant" variant="ghost" size="xs">
              Ask about this
            </Button>
          }
        />
        <div className="mt-4">
          <FocusByHourChart data={data.hours} />
        </div>
      </MotionCard>
    </div>
  )
}

function DeltaPill({ delta, hasPrevious }) {
  if (!hasPrevious) {
    return <p className="mt-1.5 text-label-sm text-faint">No prior week to compare</p>
  }
  const up = delta >= 0
  const Icon = up ? TrendingUp : TrendingDown
  return (
    <span
      className={cn(
        'mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-label-sm font-medium',
        up ? 'bg-accent-soft' : 'bg-amber-500/12 text-amber-700 dark:text-amber-300'
      )}
    >
      <Icon size={12} strokeWidth={2.4} />
      {up ? '+' : ''}
      {delta} vs last week
    </span>
  )
}

export default AnalyticsPage
