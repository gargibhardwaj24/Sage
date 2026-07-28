import { useMemo } from 'react'
import { Activity, ListMusic } from 'lucide-react'
import { MotionCard, CardHeader } from '@/components/ui/Card'
import EmptyState from '@/components/ui/EmptyState'
import { useChartTheme } from './chartTheme'
import { categoryHex } from '@/data/categories'
import { energyHeatmap, recentSessions } from '@/lib/insights'
import { fmtTimeShort, atTime, humanDuration } from '@/lib/date'

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

export function EnergyHeatmap({ events, weeks, now, delay = 0 }) {
  const t = useChartTheme()
  const { grid, max } = useMemo(
    () => energyHeatmap(events, { weeks, now, fromHour: 6, toHour: 22 }),
    [events, weeks, now]
  )

  const rows = grid.filter((r) => r.hour % 2 === 0)

  return (
    <MotionCard delay={delay} surface={false} className="p-5 sm:p-6">
      <CardHeader
        icon={Activity}
        title="Energy heatmap"
        subtitle={`Completed work by day and hour · last ${weeks} weeks`}
      />

      <div className="mt-5">
        <div className="flex gap-2">
          <div className="w-10 shrink-0" />
          <div className="grid flex-1 grid-cols-7 gap-1">
            {DAY_LABELS.map((d, i) => (
              <span key={i} className="text-center text-label-sm text-faint">
                {d}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-2 space-y-1">
          {rows.map((row) => (
            <div key={row.hour} className="flex items-center gap-2">
              <span className="w-10 shrink-0 text-right font-mono text-[10px] tabular-nums text-faint">
                {fmtTimeShort(atTime(now, row.hour))}
              </span>
              <div className="grid flex-1 grid-cols-7 gap-1">
                {row.days.map((minutes, i) => {
                  const intensity = minutes / max
                  return (
                    <span
                      key={i}
                      title={`${DAY_LABELS[i]} ${fmtTimeShort(atTime(now, row.hour))} — ${
                        minutes ? humanDuration(minutes) : 'nothing logged'
                      }`}
                      className="h-4 rounded-[3px] transition-colors"
                      style={{
                        backgroundColor: minutes ? t.accent : t.grid,
                        opacity: minutes ? 0.2 + intensity * 0.8 : 1,
                      }}
                    />
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <span className="text-label-sm text-faint">Less</span>
          {[0.2, 0.45, 0.7, 1].map((o) => (
            <span
              key={o}
              className="h-3 w-3 rounded-[3px]"
              style={{ backgroundColor: t.accent, opacity: o }}
            />
          ))}
          <span className="text-label-sm text-faint">More</span>
        </div>
      </div>
    </MotionCard>
  )
}

export function RecentSessions({ events, now, delay = 0 }) {
  const t = useChartTheme()
  const sessions = useMemo(() => recentSessions(events, { now, limit: 5 }), [events, now])

  return (
    <MotionCard delay={delay} className="p-5 sm:p-6">
      <CardHeader icon={ListMusic} title="Recent sessions" subtitle="Your last completed blocks" />

      {sessions.length ? (
        <ul className="mt-5 space-y-2">
          {sessions.map((s) => (
            <li key={s.id} className="surface-inset flex items-center gap-3 rounded-xl px-3 py-2.5">
              <span
                className="h-8 w-1 shrink-0 rounded-full"
                style={{ backgroundColor: categoryHex(s.categoryId, t.isDark) }}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-body-md text-ink">{s.title}</p>
                <p className="mt-0.5 text-label-sm uppercase tracking-wide text-faint">
                  {humanDuration(s.minutes)} · {s.categoryName}
                </p>
              </div>
              <span className="shrink-0 text-label-sm text-faint">{s.when}</span>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title="No completed sessions yet"
          description="Tick something off and it will show up here."
          className="py-8"
        />
      )}
    </MotionCard>
  )
}
