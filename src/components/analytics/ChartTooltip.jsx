export function ChartTooltip({ active, payload, label, unit = '', labelFormatter }) {
  if (!active || !payload?.length) return null

  return (
    <div className="surface-raised rounded-xl px-3 py-2.5 shadow-[var(--shadow-ambient-lg)]">
      <p className="text-[10px] font-medium uppercase tracking-widest text-faint">
        {labelFormatter ? labelFormatter(label) : label}
      </p>
      <div className="mt-1.5 space-y-1">
        {payload.map((entry) => (
          <div key={entry.dataKey ?? entry.name} className="flex items-center gap-2">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: entry.color ?? entry.payload?.fill }}
            />
            <span className="text-[11px] font-semibold text-muted">
              {entry.name}
            </span>
            <span className="ml-auto font-mono text-[11px] font-semibold tabular-nums text-ink">
              {typeof entry.value === 'number' ? Math.round(entry.value * 10) / 10 : entry.value}
              {unit}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ChartTooltip
