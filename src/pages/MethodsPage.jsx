import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  AlertTriangle,
  CalendarPlus,
  Check,
  ChevronRight,
  ListChecks,
  PenLine,
  Search,
  SlidersHorizontal,
  Sparkles,
  Star,
  X,
} from 'lucide-react'
import MethodCard, {
  DifficultyPill,
  FeaturedMethodCard,
  METHOD_ICONS,
} from '@/components/methods/MethodCard'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { CategoryBadge } from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import { METHODS, getMethod } from '@/data/methods'
import { getWorksheet } from '@/data/worksheets'
import { useEvents } from '@/store/EventsContext'
import { useSettings } from '@/store/SettingsContext'
import { useToast } from '@/store/ToastContext'
import { recommendMethods } from '@/lib/insights'
import { alpha } from '@/lib/color'
import { addDays, fmtDay, format, humanDuration, startOfWeek, toDate, WEEK_OPTS } from '@/lib/date'
import { cn } from '@/lib/cn'

const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced']

export function MethodsPage() {
  const [params, setParams] = useSearchParams()
  const { events, addEvents, removeEvents, undo } = useEvents()
  const { settings, update } = useSettings()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [query, setQuery] = useState('')
  const [difficulty, setDifficulty] = useState(null)
  const [detailId, setDetailId] = useState(() =>
    getMethod(params.get('m')) ? params.get('m') : null
  )

  const recommended = useMemo(() => recommendMethods(events, settings, new Date()), [events, settings])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return METHODS.filter((m) => {
      if (difficulty && m.difficulty !== difficulty) return false
      if (!q) return true
      return [m.name, m.tagline, m.bestFor, m.theme].join(' ').toLowerCase().includes(q)
    })
  }, [query, difficulty])

  const openDetail = (id) => {
    setDetailId(id)
    params.set('m', id)
    setParams(params, { replace: true })
  }

  const closeDetail = () => {
    setDetailId(null)
    params.delete('m')
    setParams(params, { replace: true })
  }

  const apply = (methodId, weekOffset = 0, replace = false) => {
    const method = getMethod(methodId)
    if (!method) return
    const weekStart = addDays(startOfWeek(new Date(), WEEK_OPTS), weekOffset * 7)
    const drafts = method.buildWeek(weekStart).map((d) => ({ ...d, method: method.id }))

    if (replace) {
      const end = addDays(weekStart, 7)
      const ids = events
        .filter((e) => toDate(e.start) >= weekStart && toDate(e.start) < end)
        .map((e) => e.id)
      if (ids.length) removeEvents(ids)
    }
    addEvents(drafts)

    toast({
      tone: 'success',
      title: `${method.name} applied`,
      description: `${drafts.length} blocks · week of ${fmtDay(weekStart)}`,
      action: { label: 'Undo', onClick: undo },
    })
    navigate('/calendar?view=week')
  }

  const openSheet = (methodId) => navigate(`/methods/${methodId}/worksheet`)

  const start = (methodId) => {
    if (getWorksheet(methodId)) openSheet(methodId)
    else apply(methodId, 0, false)
  }

  const detail = getMethod(detailId)

  return (
    <div className="space-y-10">
      <header>
        <nav className="flex items-center gap-1.5 text-label-sm text-faint" aria-label="Breadcrumb">
          <span>Library</span>
          <ChevronRight size={12} strokeWidth={2.2} />
          <span className="text-muted">Methods</span>
        </nav>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-5">
          <div className="max-w-2xl">
            <h2 className="text-headline-lg text-ink">Productivity methods</h2>
            <p className="mt-3 text-body-lg text-muted">
              {METHODS.length} frameworks that solve different failure modes. Whichever you set as
              active shapes how the assistant suggests and blocks out your time — and most come with
              a sheet you can fill in.
            </p>
          </div>

          <div className="surface-inset flex items-center gap-2.5 rounded-full px-4 py-2.5">
            <Search size={14} strokeWidth={2} className="shrink-0 text-faint" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search methods…"
              aria-label="Search methods"
              className="w-36 bg-transparent text-body-md text-ink placeholder:text-faint focus:outline-none sm:w-44"
            />
            {query ? (
              <button type="button" onClick={() => setQuery('')} aria-label="Clear search">
                <X size={13} strokeWidth={2.2} className="text-faint hover:text-ink" />
              </button>
            ) : null}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <SlidersHorizontal size={13} strokeWidth={2} className="text-faint" />
          <button
            type="button"
            onClick={() => setDifficulty(null)}
            className={cn(
              'rounded-full px-3 py-1.5 text-label-sm transition-colors',
              difficulty === null ? 'bg-accent-soft font-medium' : 'text-muted hover:text-ink'
            )}
          >
            All levels
          </button>
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDifficulty(difficulty === d ? null : d)}
              className={cn(
                'rounded-full px-3 py-1.5 text-label-sm transition-colors',
                difficulty === d ? 'bg-accent-soft font-medium' : 'text-muted hover:text-ink'
              )}
            >
              {d}
            </button>
          ))}
          <span className="ml-auto text-label-sm text-faint">
            {filtered.length} of {METHODS.length} frameworks
          </span>
        </div>
      </header>

      {recommended.length && !query && !difficulty ? (
        <section>
          <p className="eyebrow flex items-center gap-2">
            <Sparkles size={12} strokeWidth={2.4} className="text-accent" />
            Recommended for you
          </p>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {recommended.map((r, i) => (
              <FeaturedMethodCard
                key={r.method.id}
                method={r.method}
                reason={r.reason}
                index={i}
                onApply={start}
                onSelect={openDetail}
              />
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <p className="eyebrow">All frameworks</p>
        {filtered.length ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((m, i) => (
              <MethodCard
                key={m.id}
                method={m}
                index={i}
                selected={m.id === detailId}
                isDefault={m.id === settings.activeMethod}
                onSelect={openDetail}
                onOpenSheet={openSheet}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Search}
            title="No frameworks match"
            description="Try a different search term or clear the level filter."
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setQuery('')
                  setDifficulty(null)
                }}
              >
                Reset filters
              </Button>
            }
          />
        )}
      </section>

      <MethodDetailDialog
        method={detail}
        open={Boolean(detail)}
        onClose={closeDetail}
        isDefault={detail?.id === settings.activeMethod}
        onMakeDefault={() => {
          update({ activeMethod: detail.id })
          toast({ tone: 'success', title: `${detail.name} is now your default` })
        }}
        onApply={apply}
        onOpenSheet={openSheet}
      />
    </div>
  )
}

function MethodDetailDialog({
  method,
  open,
  onClose,
  isDefault,
  onMakeDefault,
  onApply,
  onOpenSheet,
}) {
  const weekStart = startOfWeek(new Date(), WEEK_OPTS)
  const drafts = useMemo(() => (method ? method.buildWeek(weekStart) : []), [method, weekStart])

  const byCategory = useMemo(() => {
    const counts = drafts.reduce((acc, d) => {
      acc[d.categoryId] = (acc[d.categoryId] ?? 0) + 1
      return acc
    }, {})
    return Object.entries(counts).sort((a, b) => b[1] - a[1])
  }, [drafts])

  const sampleDay = useMemo(() => {
    const target = format(addDays(weekStart, 1), 'yyyy-MM-dd')
    return drafts
      .filter((d) => format(d.start, 'yyyy-MM-dd') === target)
      .sort((a, b) => a.start - b.start)
  }, [drafts, weekStart])

  if (!method) return null
  const Icon = METHOD_ICONS[method.icon]
  const sheet = getWorksheet(method.id)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={method.name}
      description={method.tagline}
      className="sm:max-w-2xl"
      footer={
        <>
          <Button
            variant={isDefault ? 'outline' : 'subtle'}
            size="sm"
            onClick={onMakeDefault}
            disabled={isDefault}
            className="mr-auto"
          >
            {isDefault ? (
              <>
                <Check size={14} strokeWidth={2.6} />
                Active method
              </>
            ) : (
              'Make active'
            )}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => onApply(method.id, 0, false)}>
            {sheet ? 'Apply week template' : 'Apply to this week'}
          </Button>
          {sheet ? (
            <Button variant="primary" size="sm" onClick={() => onOpenSheet(method.id)}>
              <PenLine size={14} strokeWidth={2.2} />
              {sheet.cta}
            </Button>
          ) : (
            <Button variant="primary" size="sm" onClick={() => onApply(method.id, 1, false)}>
              Apply to next week
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <span
            className="grid h-12 w-12 shrink-0 place-items-center rounded-xl"
            style={{ backgroundColor: alpha(method.accent, 0.14), color: method.accent }}
          >
            {Icon ? <Icon size={22} strokeWidth={1.8} /> : null}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <DifficultyPill level={method.difficulty} />
            <span className="surface-inset rounded-full px-2.5 py-1 text-[10.5px] font-medium text-muted">
              {method.theme}
            </span>
            <span className="surface-inset rounded-full px-2.5 py-1 text-[10.5px] font-medium text-muted">
              {humanDuration(method.defaultBlock)} blocks
            </span>
          </div>
        </div>

        <Section icon={Star} title="Why it works">
          <ul className="space-y-2">
            {method.principles.map((p) => (
              <li key={p} className="flex gap-2.5 text-body-md leading-relaxed text-muted">
                <span
                  className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: method.accent }}
                />
                {p}
              </li>
            ))}
          </ul>
        </Section>

        <Section icon={ListChecks} title="How to run it">
          <ol className="space-y-2.5">
            {method.steps.map((s, i) => (
              <li key={s} className="flex gap-3 text-body-md leading-relaxed text-muted">
                <span
                  className="grid h-5 w-5 shrink-0 place-items-center rounded-md text-[10px] font-semibold"
                  style={{ backgroundColor: alpha(method.accent, 0.16), color: method.accent }}
                >
                  {i + 1}
                </span>
                {s}
              </li>
            ))}
          </ol>
        </Section>

        <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/25 bg-amber-500/[0.07] p-4">
          <AlertTriangle
            size={14}
            className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400"
            strokeWidth={2.2}
          />
          <p className="text-body-md leading-relaxed text-amber-800 dark:text-amber-200">
            <span className="font-medium">Watch out:</span> {method.watchOut}
          </p>
        </div>

        <Section icon={CalendarPlus} title={`Template · ${drafts.length} blocks per week`}>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {byCategory.map(([id, count]) => (
              <span key={id} className="flex items-center gap-1">
                <CategoryBadge categoryId={id} />
                <span className="text-[10px] text-faint">×{count}</span>
              </span>
            ))}
          </div>

          <div className="surface-inset rounded-card p-4">
            <p className="eyebrow mb-3">A typical Tuesday</p>
            <div className="space-y-2">
              {sampleDay.slice(0, 6).map((d, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="font-mono text-label-sm tabular-nums text-faint">
                    {format(d.start, 'HH:mm')}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-body-md text-ink">{d.title}</span>
                  <span className="shrink-0 text-label-sm text-faint">
                    {humanDuration((d.end - d.start) / 60000)}
                  </span>
                </div>
              ))}
              {sampleDay.length > 6 ? (
                <p className="pt-1 text-label-sm text-faint">+{sampleDay.length - 6} more that day</p>
              ) : null}
            </div>
          </div>
        </Section>
      </div>
    </Modal>
  )
}

function Section({ icon: Icon, title, children }) {
  return (
    <div>
      <p className="eyebrow mb-3 flex items-center gap-1.5">
        <Icon size={11} strokeWidth={2.4} />
        {title}
      </p>
      {children}
    </div>
  )
}

export default MethodsPage
