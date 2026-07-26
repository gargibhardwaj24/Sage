import { useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowRight, CalendarCheck, ChevronRight, Info, RotateCcw, TriangleAlert } from 'lucide-react'
import TimeboxSheet from '@/components/methods/TimeboxSheet'
import RowsSheet from '@/components/methods/RowsSheet'
import ThemesSheet from '@/components/methods/ThemesSheet'
import FrogSheet from '@/components/methods/FrogSheet'
import MatrixSheet from '@/components/methods/MatrixSheet'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { CategoryBadge } from '@/components/ui/Badge'
import { getMethod } from '@/data/methods'
import { getWorksheet } from '@/data/worksheets'
import { useEvents } from '@/store/EventsContext'
import { useAuth } from '@/store/AuthContext'
import { useSettings } from '@/store/SettingsContext'
import { useToast } from '@/store/ToastContext'
import { storage } from '@/lib/storage'
import { buildDrafts, draftConflicts, plannedMinutes, SHEET_KINDS } from '@/lib/worksheet'
import {
  addDays,
  dayKey,
  fmtDay,
  fmtDayLong,
  fmtRange,
  humanDuration,
  startOfDay,
  startOfWeek,
  toDate,
  WEEK_OPTS,
} from '@/lib/date'

const SHEET_VIEWS = {
  timebox: TimeboxSheet,
  rows: RowsSheet,
  themes: ThemesSheet,
  frog: FrogSheet,
  matrix: MatrixSheet,
}

const parseDay = (raw) => {
  if (!raw) return startOfDay(new Date())
  const parsed = new Date(`${raw}T00:00:00`)
  return Number.isNaN(parsed.getTime()) ? startOfDay(new Date()) : parsed
}

export function WorksheetPage() {
  const { methodId } = useParams()
  const [params, setParams] = useSearchParams()
  const { userId } = useAuth()
  const navigate = useNavigate()

  const method = getMethod(methodId)
  const sheet = getWorksheet(methodId)

  const [date, setDate] = useState(() => parseDay(params.get('date')))

  const storageKey = useMemo(() => {
    const scopeKey =
      sheet?.scope === 'week' ? dayKey(startOfWeek(toDate(date), WEEK_OPTS)) : dayKey(date)
    return `worksheet.${methodId}.${userId ?? 'local'}.${scopeKey}`
  }, [methodId, userId, date, sheet])

  if (!method || !sheet || !SHEET_VIEWS[sheet.kind]) return <Navigate to="/methods" replace />

  const pickDate = (raw) => {
    const next = parseDay(raw)
    setDate(next)
    params.set('date', dayKey(next))
    setParams(params, { replace: true })
  }

  const weekStart = startOfWeek(toDate(date), WEEK_OPTS)
  const isWeek = sheet.scope === 'week'

  return (
    <div className="space-y-6">
      <header>
        <nav className="flex items-center gap-1.5 text-label-sm text-faint" aria-label="Breadcrumb">
          <span>Library</span>
          <ChevronRight size={12} strokeWidth={2.2} />
          <button
            type="button"
            onClick={() => navigate(`/methods?m=${method.id}`)}
            className="transition-colors hover:text-ink"
          >
            Methods
          </button>
          <ChevronRight size={12} strokeWidth={2.2} />
          <span className="text-muted">{sheet.title}</span>
        </nav>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-5">
          <div className="max-w-xl">
            <h2 className="text-headline-lg text-ink">{sheet.title}</h2>
            <p className="mt-3 text-body-lg leading-relaxed text-muted">{sheet.intro}</p>
          </div>

          <label className="shrink-0">
            <span className="eyebrow mb-2 block">{isWeek ? 'Week of' : 'Date'}</span>
            <Input
              type="date"
              value={dayKey(date)}
              onChange={(e) => pickDate(e.target.value)}
              className="w-[11rem]"
            />
            {isWeek ? (
              <span className="mt-2 block text-label-sm text-faint">
                {fmtDay(weekStart)} – {fmtDay(addDays(weekStart, 6))}
              </span>
            ) : null}
          </label>
        </div>
      </header>

      <Worksheet
        key={storageKey}
        storageKey={storageKey}
        sheet={sheet}
        method={method}
        date={date}
      />
    </div>
  )
}

function Worksheet({ storageKey, sheet, method, date }) {
  const { events, addEvents, removeEvents, undo } = useEvents()
  const { settings } = useSettings()
  const { toast } = useToast()
  const navigate = useNavigate()

  const kind = SHEET_KINDS[sheet.kind]
  const View = SHEET_VIEWS[sheet.kind]

  const [state, setState] = useState(() => storage.get(storageKey) ?? kind.init(sheet))
  const [pending, setPending] = useState(null)

  const update = (patch) => {
    const next = typeof patch === 'function' ? patch(state) : { ...state, ...patch }
    setState(next)
    storage.set(storageKey, next)
  }

  const reset = () => update(kind.init(sheet))

  const { drafts, notices } = useMemo(
    () => buildDrafts(sheet, state, { date, methodId: method.id, events, settings }),
    [sheet, state, date, method.id, events, settings]
  )

  const commit = (replaceIds = []) => {
    if (replaceIds.length) removeEvents(replaceIds)
    addEvents(drafts)
    setPending(null)

    toast({
      tone: 'success',
      title: `${drafts.length} ${drafts.length === 1 ? 'block' : 'blocks'} added`,
      description: sheet.scope === 'week' ? `Week of ${fmtDay(date)}` : fmtDayLong(date),
      action: { label: 'Undo', onClick: undo },
    })

    navigate(
      sheet.scope === 'week'
        ? '/calendar?view=week'
        : `/calendar?view=day&date=${dayKey(date)}`
    )
  }

  const save = () => {
    if (!drafts.length) {
      toast({
        tone: 'danger',
        title: 'Nothing to add yet',
        description: 'Fill in at least one line on the sheet first.',
      })
      return
    }

    const conflicts = draftConflicts(events, drafts)
    if (conflicts.length) {
      setPending(conflicts)
      return
    }
    commit()
  }

  const minutes = plannedMinutes(drafts)

  return (
    <>
      <div className="surface-card rounded-card px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-body-md text-muted">
            {drafts.length ? (
              <>
                <span className="font-medium text-ink">
                  {drafts.length} {drafts.length === 1 ? 'block' : 'blocks'}
                </span>{' '}
                · {humanDuration(minutes)} planned
              </>
            ) : (
              <>Nothing planned yet.</>
            )}
          </p>

          <span className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={reset}>
              <RotateCcw size={14} strokeWidth={2} />
              Reset sheet
            </Button>
            <Button variant="primary" size="sm" onClick={save} disabled={!drafts.length}>
              <CalendarCheck size={15} strokeWidth={2} />
              Add to calendar
              <ArrowRight size={14} strokeWidth={2.2} />
            </Button>
          </span>
        </div>

        {notices.length ? (
          <ul className="mt-3 space-y-1.5 border-t border-[rgb(var(--line))] pt-3">
            {notices.map((notice) => (
              <li key={notice} className="flex items-start gap-2 text-label-sm text-faint">
                <Info size={12} strokeWidth={2.2} className="mt-0.5 shrink-0" />
                {notice}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <View sheet={sheet} state={state} onChange={update} date={date} />

      <ConflictDialog
        conflicts={pending ?? []}
        open={Boolean(pending)}
        onClose={() => setPending(null)}
        onKeep={() => commit()}
        onReplace={() => commit((pending ?? []).map((e) => e.id))}
      />
    </>
  )
}

function ConflictDialog({ conflicts, open, onClose, onKeep, onReplace }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="That time already has plans"
      description={`${conflicts.length} existing ${conflicts.length === 1 ? 'event overlaps' : 'events overlap'} your blocks.`}
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} className="mr-auto">
            Back to the sheet
          </Button>
          <Button variant="secondary" size="sm" onClick={onKeep}>
            Keep both
          </Button>
          <Button variant="danger" size="sm" onClick={onReplace}>
            Replace them
          </Button>
        </>
      }
    >
      <div className="space-y-2">
        <p className="flex items-start gap-2.5 rounded-xl border border-amber-500/25 bg-amber-500/[0.07] p-3.5 text-body-md leading-relaxed text-amber-800 dark:text-amber-200">
          <TriangleAlert size={14} strokeWidth={2.2} className="mt-0.5 shrink-0" />
          Replacing removes these events. Both options can be undone.
        </p>

        {conflicts.map((e) => (
          <div
            key={e.id}
            className="surface-inset flex items-center gap-3 rounded-xl px-3.5 py-2.5"
          >
            <CategoryBadge categoryId={e.categoryId} />
            <span className="min-w-0 flex-1 truncate text-body-md text-ink">{e.title}</span>
            <span className="shrink-0 text-label-sm tabular-nums text-faint">
              {fmtDay(e.start)} · {fmtRange(e.start, e.end)}
            </span>
          </div>
        ))}
      </div>
    </Modal>
  )
}

export default WorksheetPage
