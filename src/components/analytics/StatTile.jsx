import { motion } from 'framer-motion'
import { TrendingDown, TrendingUp } from 'lucide-react'
import { MotionCard } from '@/components/ui/Card'
import { useChartTheme } from './chartTheme'
import { cn } from '@/lib/cn'

function Sparkline({ values, height = 34 }) {
  const t = useChartTheme()
  if (!values?.length) return null

  const width = 100
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const step = width / Math.max(1, values.length - 1)

  const points = values.map((v, i) => [i * step, height - ((v - min) / span) * (height - 6) - 3])
  const line = points.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const area = `${line} L${width},${height} L0,${height} Z`
  const [lastX, lastY] = points[points.length - 1]

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="mt-3 h-[34px] w-full"
      aria-hidden="true"
    >
      <path d={area} fill={t.accent} opacity="0.12" />
      <path d={line} fill="none" stroke={t.accent} strokeWidth="2" vectorEffect="non-scaling-stroke" />
      <circle cx={lastX} cy={lastY} r="2.5" fill={t.accent} />
    </svg>
  )
}

function ProgressMeter({ value }) {
  const t = useChartTheme()
  return (
    <div className="mt-3 h-1.5 overflow-hidden rounded-full" style={{ backgroundColor: t.grid }}>
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: t.accent }}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, Math.max(0, value * 100))}%` }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  )
}

function SegmentMeter({ value, segments = 5 }) {
  const t = useChartTheme()
  const filled = Math.round(value * segments)
  return (
    <div className="mt-3 flex gap-1" aria-hidden="true">
      {Array.from({ length: segments }, (_, i) => (
        <span
          key={i}
          className="h-2 flex-1 rounded-sm transition-colors"
          style={{ backgroundColor: i < filled ? t.accent : t.grid }}
        />
      ))}
    </div>
  )
}

function MiniBars({ values }) {
  const t = useChartTheme()
  const max = Math.max(1, ...values)
  return (
    <div className="mt-3 flex h-[34px] items-end gap-[3px]" aria-hidden="true">
      {values.map((v, i) => (
        <span
          key={i}
          className="flex-1 rounded-sm"
          style={{
            height: `${Math.max(8, (v / max) * 100)}%`,
            backgroundColor: v > 0 ? t.accent : t.grid,
            opacity: v > 0 ? 0.35 + 0.65 * (v / max) : 1,
          }}
        />
      ))}
    </div>
  )
}

const VIZ = { sparkline: Sparkline, progress: ProgressMeter, segments: SegmentMeter, bars: MiniBars }

export function StatTile({ label, value, unit, hint, delta, deltaSuffix = '', viz, vizProps, delay = 0 }) {
  const Viz = viz ? VIZ[viz] : null
  const up = delta > 0
  const hasDelta = typeof delta === 'number' && delta !== 0

  return (
    <MotionCard delay={delay} className="p-4 sm:p-5">
      <p className="eyebrow">{label}</p>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-headline-lg font-semibold leading-none tracking-tight text-ink">
          {value}
        </span>
        {unit ? <span className="text-body-md text-faint">{unit}</span> : null}

        {hasDelta ? (
          <span
            className={cn(
              'ml-auto flex items-center gap-0.5 text-label-sm font-medium',
              up ? 'text-accent' : 'text-amber-600 dark:text-amber-400'
            )}
          >
            {up ? <TrendingUp size={12} strokeWidth={2.4} /> : <TrendingDown size={12} strokeWidth={2.4} />}
            {up ? '+' : ''}
            {delta}
            {deltaSuffix}
          </span>
        ) : null}
      </div>

      {Viz ? <Viz {...vizProps} /> : null}

      {hint ? <p className="mt-2.5 text-label-sm text-faint">{hint}</p> : null}
    </MotionCard>
  )
}

export default StatTile
