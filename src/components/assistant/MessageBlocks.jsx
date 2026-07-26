import { ArrowRight, CalendarClock, Check, Clock3, Sparkles } from 'lucide-react'
import { categoryHex, categoryInk, getCategory } from '@/data/categories'
import { getMethod } from '@/data/methods'
import { SCORE_WEIGHTS } from '@/lib/analytics'
import { useTheme } from '@/store/ThemeContext'
import { alpha } from '@/lib/color'
import {
  durationMinutes,
  fmtDay,
  fmtRange,
  fmtRelativeDay,
  fmtTimeShort,
  humanDuration,
} from '@/lib/date'
import { cn } from '@/lib/cn'

function EventRow({ event, muted }) {
  const { isDark } = useTheme()
  const hex = categoryHex(event.categoryId, isDark)

  return (
    <div
      className={cn(
        'flex items-center gap-2.5 rounded-xl px-2.5 py-2',
        muted ? 'opacity-70' : '',
        'surface-inset'
      )}
    >
      <span className="h-7 w-1 shrink-0 rounded-full" style={{ backgroundColor: hex }} />
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'truncate text-[13px] font-medium leading-tight text-ink',
            event.completed && 'line-through opacity-60'
          )}
        >
          {event.title}
        </p>
        <p className="mt-0.5 truncate text-[11px] font-semibold text-muted">
          {fmtRelativeDay(event.start)} · {fmtRange(event.start, event.end)}
        </p>
      </div>
      <span
        className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium"
        style={{
          backgroundColor: alpha(hex, isDark ? 0.18 : 0.13),
          color: categoryInk(event.categoryId, isDark),
        }}
      >
        {getCategory(event.categoryId).short}
      </span>
    </div>
  )
}

function BlockShell({ title, icon: Icon, children }) {
  return (
    <div className="surface-inset rounded-xl p-3">
      {title ? (
        <p className="mb-2 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-widest text-faint">
          {Icon ? <Icon size={11} strokeWidth={2.8} /> : null}
          {title}
        </p>
      ) : null}
      {children}
    </div>
  )
}

function DiffBlock({ block }) {
  const { isDark } = useTheme()
  const hex = categoryHex(block.event.categoryId, isDark)

  return (
    <BlockShell title="Proposed change" icon={CalendarClock}>
      <p className="mb-2 flex items-center gap-2 text-[13px] font-medium text-ink">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: hex }} />
        {block.event.title}
      </p>
      <div className="flex items-center gap-2.5">
        <div className="flex-1 surface-inset rounded-xl px-3 py-2">
          <p className="text-[10px] font-medium uppercase tracking-wider text-faint">
            From
          </p>
          <p className="mt-0.5 text-xs font-medium text-ink-600 line-through dark:text-ink-300">
            {fmtRelativeDay(block.from.start)} · {fmtTimeShort(block.from.start)}
          </p>
        </div>
        <ArrowRight size={15} className="shrink-0 text-accent" strokeWidth={2.2} />
        <div className="flex-1 rounded-xl bg-accent-soft px-3 py-2">
          <p className="text-[10px] font-medium uppercase tracking-wider text-accent">
            To
          </p>
          <p className="mt-0.5 text-xs font-semibold text-accent">
            {fmtRelativeDay(block.to.start)} · {fmtTimeShort(block.to.start)}
          </p>
        </div>
      </div>
    </BlockShell>
  )
}

function SlotsBlock({ block }) {
  return (
    <BlockShell title={block.title ?? 'Open slots'} icon={Clock3}>
      <div className="space-y-1.5">
        {block.slots.map((slot, i) => (
          <div
            key={`${slot.start}-${i}`}
            className="stripes flex items-center gap-2 rounded-xl px-2.5 py-2"
          >
            <span className="text-[13px] font-medium text-ink">
              {fmtRelativeDay(slot.start)}
            </span>
            <span className="text-[12px] font-semibold text-muted">
              {fmtRange(slot.start, slot.end)}
            </span>
            <span className="ml-auto rounded-full surface-card px-2 py-0.5 text-[10px] font-medium text-muted">
              {slot.reason ?? humanDuration(slot.minutes ?? durationMinutes(slot.start, slot.end))}
            </span>
          </div>
        ))}
      </div>
    </BlockShell>
  )
}

function StatsBlock({ block }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {block.items.map((item) => (
        <div key={item.label} className="surface-inset rounded-xl px-3 py-2.5">
          <p className="text-[10px] font-medium uppercase tracking-widest text-faint">
            {item.label}
          </p>
          <p className="mt-1 text-xl font-semibold tracking-tight text-ink">
            {item.value}
          </p>
          {item.hint ? (
            <p className="mt-0.5 text-[10px] font-semibold text-faint">
              {item.hint}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  )
}

function ScoreBlock({ block }) {
  return (
    <BlockShell title="Score breakdown">
      <div className="space-y-2">
        {SCORE_WEIGHTS.map((w) => {
          const pct = Math.round((block.components[w.key] ?? 0) * 100)
          return (
            <div key={w.key}>
              <div className="mb-1 flex items-baseline justify-between gap-2">
                <span className="text-[11px] font-medium text-ink">{w.label}</span>
                <span className="font-mono text-[11px] font-medium tabular-nums text-muted">
                  {pct}%
                  <span className="ml-1 text-faint">×{w.weight}</span>
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[rgb(var(--line))]">
                <div
                  className="h-full rounded-full bg-[rgb(var(--accent))] transition-[width] duration-700"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </BlockShell>
  )
}

function WeekBlock({ block }) {
  const max = Math.max(1, ...block.days.map((d) => d.planned))
  return (
    <BlockShell title={`Week of ${fmtDay(block.weekStart)}`}>
      <div className="flex items-end justify-between gap-1.5" style={{ height: 84 }}>
        {block.days.map((d) => (
          <div key={d.label} className="flex flex-1 flex-col items-center gap-1.5">
            <div className="flex w-full flex-1 items-end">
              <div
                className={cn(
                  'w-full rounded-t-md transition-all duration-500',
                  d.isFuture
                    ? 'bg-[rgb(var(--accent))]/30'
                    : 'bg-[rgb(var(--accent))]'
                )}
                style={{ height: `${Math.max(6, (d.planned / max) * 100)}%` }}
                title={`${d.label}: ${d.planned} events`}
              />
            </div>
            <span className="text-[9.5px] font-medium text-faint">{d.label}</span>
            <span className="-mt-1 font-mono text-[10px] font-medium tabular-nums text-muted">
              {d.planned}
            </span>
          </div>
        ))}
      </div>
    </BlockShell>
  )
}

function MethodBlock({ block }) {
  const method = getMethod(block.methodId)
  if (!method) return null
  return (
    <div
      className="rounded-xl border p-3"
      style={{ borderColor: alpha(method.accent, 0.35), backgroundColor: alpha(method.accent, 0.09) }}
    >
      <p className="text-[13px] font-semibold text-ink">{method.name}</p>
      <p className="mt-1 text-xs font-medium leading-relaxed text-muted">
        {method.bestFor}
      </p>
    </div>
  )
}

function TemplateBlock({ block }) {
  const { isDark } = useTheme()
  const byCategory = block.drafts.reduce((acc, d) => {
    acc[d.categoryId] = (acc[d.categoryId] ?? 0) + 1
    return acc
  }, {})

  return (
    <BlockShell title={`${block.drafts.length} blocks · week of ${fmtDay(block.weekStart)}`} icon={Sparkles}>
      <div className="flex flex-wrap gap-1.5">
        {Object.entries(byCategory).map(([id, count]) => {
          const hex = categoryHex(id, isDark)
          return (
            <span
              key={id}
              className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
              style={{ backgroundColor: alpha(hex, isDark ? 0.18 : 0.13), color: categoryInk(id, isDark) }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: hex }} />
              {getCategory(id).name} × {count}
            </span>
          )
        })}
      </div>
    </BlockShell>
  )
}

function MethodsBlock({ block }) {
  return (
    <div className="space-y-1.5">
      {block.methods.map((m) => {
        const full = getMethod(m.id)
        return (
          <div key={m.id} className="surface-inset rounded-xl px-3 py-2">
            <p className="text-[13px] font-medium text-ink">{m.name}</p>
            <p className="mt-0.5 text-[11.5px] font-medium text-muted">
              {m.tagline ?? full?.tagline}
            </p>
          </div>
        )
      })}
    </div>
  )
}

function CapabilitiesBlock({ block }) {
  return (
    <div className="space-y-1.5">
      {block.items.map((item) => (
        <div key={item.label} className="flex items-start gap-2.5 rounded-xl px-1 py-1">
          <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-lg bg-accent-soft">
            <Check size={11} strokeWidth={3} />
          </span>
          <div className="min-w-0">
            <p className="text-[12.5px] font-medium text-ink">{item.label}</p>
            <p className="mt-0.5 truncate text-[11px] font-medium italic text-muted">
              “{item.examples[0]}”
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

function DraftBlock({ block }) {
  const { isDark } = useTheme()
  const hex = categoryHex(block.draft.categoryId, isDark)
  return (
    <BlockShell title="New event" icon={CalendarClock}>
      <div className="flex items-center gap-2.5">
        <span className="h-9 w-1 shrink-0 rounded-full" style={{ backgroundColor: hex }} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold text-ink">
            {block.draft.title}
          </p>
          <p className="mt-0.5 text-[11px] font-semibold text-muted">
            {fmtRelativeDay(block.draft.start)} · {fmtRange(block.draft.start, block.draft.end)}
          </p>
        </div>
        <span
          className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium"
          style={{ backgroundColor: alpha(hex, isDark ? 0.18 : 0.13), color: categoryInk(block.draft.categoryId, isDark) }}
        >
          {getCategory(block.draft.categoryId).name}
        </span>
      </div>
    </BlockShell>
  )
}

const RENDERERS = {
  events: ({ block }) => (
    <BlockShell title={block.title}>
      <div className="space-y-1.5">
        {block.events.map((e) => (
          <EventRow key={e.id} event={e} muted={e.completed} />
        ))}
      </div>
    </BlockShell>
  ),
  slots: SlotsBlock,
  diff: DiffBlock,
  stats: StatsBlock,
  score: ScoreBlock,
  week: WeekBlock,
  method: MethodBlock,
  template: TemplateBlock,
  methods: MethodsBlock,
  capabilities: CapabilitiesBlock,
  draft: DraftBlock,
}

export function MessageBlocks({ blocks }) {
  if (!blocks?.length) return null
  return (
    <div className="mt-3 space-y-2">
      {blocks.map((block, i) => {
        const Renderer = RENDERERS[block.type]
        return Renderer ? <Renderer key={`${block.type}-${i}`} block={block} /> : null
      })}
    </div>
  )
}

export default MessageBlocks
