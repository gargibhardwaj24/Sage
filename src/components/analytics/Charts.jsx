import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import ChartTooltip from './ChartTooltip'
import { TICK_STYLE, useChartTheme } from './chartTheme'
import { categoryHex, getCategory } from '@/data/categories'
import { fmtTimeShort, atTime } from '@/lib/date'

export function ScoreTrendChart({
  data,
  height = 220,
  seriesLabel = 'Weekly score',
  labelFormatter = (l) => `Week of ${l}`,
}) {
  const t = useChartTheme()

  const shaped = data.map((d, i) => {
    const prior = data.slice(0, i + 1).filter((p) => p.score != null)
    return {
      ...d,
      baseline: prior.length
        ? Math.round(prior.reduce((n, p) => n + p.score, 0) / prior.length)
        : null,
    }
  })

  return (
    <>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={shaped} margin={{ top: 8, right: 6, left: -18, bottom: 0 }}>
          <CartesianGrid stroke={t.grid} vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ ...TICK_STYLE, fill: t.tick }}
            axisLine={{ stroke: t.axis }}
            tickLine={false}
            dy={6}
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tick={{ ...TICK_STYLE, fill: t.tick }}
            axisLine={false}
            tickLine={false}
            width={44}
          />
          <Tooltip
            content={<ChartTooltip labelFormatter={labelFormatter} />}
            cursor={{ stroke: t.accent, strokeWidth: 1, strokeDasharray: '4 4' }}
          />
          <Area
            type="monotone"
            dataKey="baseline"
            name="Running average"
            stroke={t.neutral}
            strokeWidth={1.5}
            strokeDasharray="3 3"
            fill="none"
            dot={false}
            activeDot={false}
          />
          <Area
            type="monotone"
            dataKey="score"
            name="Score"
            stroke={t.accent}
            strokeWidth={2}
            fill={t.accent}
            fillOpacity={0.1}
            dot={{ r: 3, fill: t.accent, strokeWidth: 2, stroke: t.surface }}
            activeDot={{ r: 5, strokeWidth: 2, stroke: t.surface }}
          />
        </AreaChart>
      </ResponsiveContainer>

      <Legend
        items={[
          { label: seriesLabel, color: t.accent },
          { label: 'Running average', color: t.neutral, dashed: true },
        ]}
      />
    </>
  )
}

export function WeeklyLoadChart({ data, height = 220 }) {
  const t = useChartTheme()

  return (
    <>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 8, right: 6, left: -18, bottom: 0 }} barCategoryGap="28%">
          <CartesianGrid stroke={t.grid} vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ ...TICK_STYLE, fill: t.tick }}
            axisLine={{ stroke: t.axis }}
            tickLine={false}
            dy={6}
          />
          <YAxis
            tick={{ ...TICK_STYLE, fill: t.tick }}
            axisLine={false}
            tickLine={false}
            width={44}
            unit="h"
          />
          <Tooltip content={<ChartTooltip unit="h" />} cursor={{ fill: t.cursor }} />
          <Bar
            dataKey="focusHours"
            name="Focus"
            stackId="a"
            fill={t.accent}
            stroke={t.surface}
            strokeWidth={2}
            isAnimationActive={false}
          />
          <Bar
            dataKey="otherHours"
            name="Everything else"
            stackId="a"
            fill={t.neutral}
            stroke={t.surface}
            strokeWidth={2}
            isAnimationActive={false}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>

      <Legend
        items={[
          { label: 'Focus', color: t.accent },
          { label: 'Everything else', color: t.neutral },
        ]}
      />
    </>
  )
}

export function CategoryRadar({ data, height = 220 }) {
  const t = useChartTheme()
  const total = data.reduce((n, d) => n + d.hours, 0)

  const shaped = data.map((d) => ({
    ...d,
    name: getCategory(d.id).name,
    short: getCategory(d.id).short,
  }))
  const shortOf = new Map(shaped.map((d) => [d.name, d.short]))

  const renderDot = ({ cx, cy, payload, index }) => {
    const id = payload?.id ?? payload?.payload?.id
    return (
      <circle
        key={`${id ?? 'dot'}-${index ?? `${cx}-${cy}`}`}
        cx={cx}
        cy={cy}
        r={3.5}
        fill={categoryHex(id, t.isDark)}
        stroke={t.surface}
        strokeWidth={1.5}
      />
    )
  }

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="shrink-0" style={{ width: height, height }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={shaped} outerRadius="70%" margin={{ top: 6, right: 10, bottom: 6, left: 10 }}>
            <PolarGrid stroke={t.grid} />
            <PolarAngleAxis
              dataKey="name"
              tickFormatter={(v) => shortOf.get(v) ?? v}
              tick={{ ...TICK_STYLE, fill: t.tick }}
            />
            <PolarRadiusAxis domain={[0, 'auto']} tick={false} axisLine={false} />
            <Radar
              dataKey="hours"
              name="Scheduled"
              stroke={t.accent}
              strokeWidth={2}
              fill={t.accent}
              fillOpacity={0.16}
              dot={renderDot}
              isAnimationActive={false}
            />
            <Tooltip content={<ChartTooltip unit="h" />} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="w-full min-w-0 flex-1">
        <div className="mb-3 flex items-baseline gap-2">
          <p className="text-2xl font-semibold tracking-tight text-ink">{Math.round(total)}h</p>
          <p className="text-[10px] font-medium uppercase tracking-widest text-faint">scheduled</p>
        </div>

        <ul className="space-y-1.5">
          {shaped.map((entry) => (
            <li key={entry.id} className="flex items-center gap-2.5">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: categoryHex(entry.id, t.isDark) }}
              />
              <span className="min-w-0 flex-1 truncate text-xs font-medium text-ink">
                {entry.name}
              </span>
              <span className="font-mono text-xs font-semibold tabular-nums text-ink">
                {entry.hours}h
              </span>
              <span className="w-10 shrink-0 text-right font-mono text-[10px] font-medium tabular-nums text-faint">
                {total ? Math.round((entry.hours / total) * 100) : 0}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export function FocusByHourChart({ data, height = 180 }) {
  const t = useChartTheme()
  const shaped = data
    .filter((d) => d.hour >= 5 && d.hour <= 23)
    .map((d) => ({ ...d, label: fmtTimeShort(atTime(new Date(), d.hour)), hours: d.minutes / 60 }))

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={shaped} margin={{ top: 8, right: 6, left: -18, bottom: 0 }} barCategoryGap="18%">
        <CartesianGrid stroke={t.grid} vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ ...TICK_STYLE, fill: t.tick, fontSize: 9 }}
          axisLine={{ stroke: t.axis }}
          tickLine={false}
          interval={2}
          dy={6}
        />
        <YAxis
          tick={{ ...TICK_STYLE, fill: t.tick }}
          axisLine={false}
          tickLine={false}
          width={44}
          unit="h"
        />
        <Tooltip content={<ChartTooltip unit="h" />} cursor={{ fill: t.cursor }} />
        <Bar
          dataKey="hours"
          name="Focus logged"
          fill={t.accent}
          radius={[4, 4, 0, 0]}
          isAnimationActive={false}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}

function Legend({ items }) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-1.5">
          {item.dashed ? (
            <span className="w-3.5 border-t border-dashed" style={{ borderColor: item.color }} />
          ) : (
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
          )}
          <span className="text-[11px] font-medium text-muted">{item.label}</span>
        </span>
      ))}
    </div>
  )
}
