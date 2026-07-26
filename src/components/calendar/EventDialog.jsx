import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Check, Trash2 } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { CATEGORIES, categoryHex, getCategory } from '@/data/categories'
import { useTheme } from '@/store/ThemeContext'
import { alpha } from '@/lib/color'
import { addMinutes, durationMinutes, format, fmtRange, toDate } from '@/lib/date'
import { findConflicts } from '@/lib/schedule'
import { cn } from '@/lib/cn'

const REMINDER_OPTIONS = [
  { value: '', label: 'No reminder' },
  { value: '5', label: '5 minutes before' },
  { value: '10', label: '10 minutes before' },
  { value: '15', label: '15 minutes before' },
  { value: '30', label: '30 minutes before' },
  { value: '60', label: '1 hour before' },
]

const toDateInput = (d) => format(toDate(d), 'yyyy-MM-dd')
const toTimeInput = (d) => format(toDate(d), 'HH:mm')

function buildForm(source) {
  const start = toDate(source.start ?? new Date())
  const end = toDate(source.end ?? addMinutes(start, 60))
  return {
    title: source.title ?? '',
    categoryId: source.categoryId ?? 'deep-work',
    date: toDateInput(start),
    startTime: toTimeInput(start),
    endTime: toTimeInput(end),
    notes: source.notes ?? '',
    reminderMinutes: source.reminderMinutes == null ? '' : String(source.reminderMinutes),
    completed: Boolean(source.completed),
  }
}

const composeDate = (dateStr, timeStr) => new Date(`${dateStr}T${timeStr}:00`)

export function EventDialog({ open, onClose, event, draft, events, onSave, onDelete }) {
  const { isDark } = useTheme()
  const isEdit = Boolean(event?.id)
  const source = event ?? draft ?? {}

  const [form, setForm] = useState(() => buildForm(source))
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(buildForm(event ?? draft ?? {}))
      setTouched(false)
    }
  }, [open, event, draft])

  const set = (patch) => setForm((f) => ({ ...f, ...patch }))

  const { start, end, invalidRange } = useMemo(() => {
    const s = composeDate(form.date, form.startTime)
    let e = composeDate(form.date, form.endTime)
    const invalid = !(e > s)
    if (invalid) e = addMinutes(s, 60)
    return { start: s, end: e, invalidRange: invalid }
  }, [form.date, form.startTime, form.endTime])

  const conflicts = useMemo(() => {
    if (!open || Number.isNaN(start.getTime())) return []
    return findConflicts(events ?? [], start, end, event?.id ?? null)
  }, [open, events, start, end, event?.id])

  const submit = (e) => {
    e.preventDefault()
    setTouched(true)
    if (!form.title.trim() || Number.isNaN(start.getTime())) return
    onSave({
      ...(event ?? {}),
      title: form.title.trim(),
      categoryId: form.categoryId,
      notes: form.notes,
      start,
      end,
      reminderMinutes: form.reminderMinutes === '' ? null : Number(form.reminderMinutes),
      completed: form.completed,
      source: event?.source ?? 'user',
    })
    onClose()
  }

  const duration = durationMinutes(start, end)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit event' : 'New event'}
      description={
        Number.isNaN(start.getTime())
          ? undefined
          : `${fmtRange(start, end)} · ${duration >= 60 ? `${Math.round((duration / 60) * 10) / 10}h` : `${duration}m`}`
      }
      footer={
        <>
          {isEdit && onDelete ? (
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                onDelete(event.id)
                onClose()
              }}
              className="mr-auto"
            >
              <Trash2 size={15} />
              Delete
            </Button>
          ) : null}
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" form="event-form">
            <Check size={15} strokeWidth={2.6} />
            {isEdit ? 'Save changes' : 'Add event'}
          </Button>
        </>
      }
    >
      <form id="event-form" onSubmit={submit} className="space-y-4">
        <Field label="Title" htmlFor="ev-title">
          <Input
            id="ev-title"
            data-autofocus
            value={form.title}
            onChange={(e) => set({ title: e.target.value })}
            placeholder="Deep work · Project Atlas"
            aria-invalid={touched && !form.title.trim()}
            className={touched && !form.title.trim() ? 'border-rose-400' : undefined}
          />
          {touched && !form.title.trim() ? (
            <p className="mt-1.5 text-xs font-semibold text-rose-500">Give it a name first.</p>
          ) : null}
        </Field>

        <Field label="Category">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => {
              const active = form.categoryId === c.id
              const hex = categoryHex(c.id, isDark)
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => set({ categoryId: c.id })}
                  aria-pressed={active}
                  className={cn(
                    'flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition',
                    active
                      ? 'border-transparent text-ink'
                      : 'text-muted hover:border-[rgb(var(--line-strong))]'
                  )}
                  style={active ? { backgroundColor: alpha(hex, isDark ? 0.22 : 0.16) } : undefined}
                >
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: hex }} />
                  {c.name}
                </button>
              )
            })}
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Field label="Date" htmlFor="ev-date" className="col-span-2">
            <Input
              id="ev-date"
              type="date"
              value={form.date}
              onChange={(e) => set({ date: e.target.value })}
            />
          </Field>
          <Field label="Start" htmlFor="ev-start">
            <Input
              id="ev-start"
              type="time"
              step="300"
              value={form.startTime}
              onChange={(e) => {
                const length = durationMinutes(start, end)
                const nextStart = composeDate(form.date, e.target.value)
                set({
                  startTime: e.target.value,
                  endTime: Number.isNaN(nextStart.getTime())
                    ? form.endTime
                    : toTimeInput(addMinutes(nextStart, length || 60)),
                })
              }}
            />
          </Field>
          <Field label="End" htmlFor="ev-end">
            <Input
              id="ev-end"
              type="time"
              step="300"
              value={form.endTime}
              onChange={(e) => set({ endTime: e.target.value })}
              className={invalidRange ? 'border-amber-400' : undefined}
            />
          </Field>
        </div>

        {invalidRange ? (
          <p className="-mt-2 text-xs font-semibold text-amber-600 dark:text-amber-400">
            End time must be after the start — defaulting to one hour.
          </p>
        ) : null}

        <Field label="Reminder" htmlFor="ev-reminder">
          <Select
            id="ev-reminder"
            value={form.reminderMinutes}
            onChange={(e) => set({ reminderMinutes: e.target.value })}
          >
            {REMINDER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Notes" htmlFor="ev-notes" hint="optional">
          <Textarea
            id="ev-notes"
            rows={3}
            value={form.notes}
            onChange={(e) => set({ notes: e.target.value })}
            placeholder="What does done look like?"
          />
        </Field>

        {isEdit ? (
          <label className="surface-inset flex cursor-pointer items-center justify-between rounded-xl px-4 py-3">
            <span className="text-sm font-semibold text-ink">
              Mark as completed
            </span>
            <input
              type="checkbox"
              checked={form.completed}
              onChange={(e) => set({ completed: e.target.checked })}
              className="h-5 w-5 rounded-md accent-[rgb(var(--accent))]"
            />
          </label>
        ) : null}

        {conflicts.length ? (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.08] p-3.5">
            <p className="flex items-center gap-2 text-xs font-medium text-amber-700 dark:text-amber-300">
              <AlertTriangle size={14} strokeWidth={2.6} />
              Overlaps {conflicts.length} event{conflicts.length > 1 ? 's' : ''}
            </p>
            <ul className="mt-2 space-y-1">
              {conflicts.slice(0, 3).map((c) => (
                <li key={c.id} className="flex items-center gap-2 text-xs text-muted">
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: categoryHex(c.categoryId, isDark) }}
                  />
                  <span className="truncate font-semibold">{c.title}</span>
                  <span className="shrink-0 text-ink-400">{fmtRange(c.start, c.end)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[11px] text-muted">
              You can still save — {getCategory(form.categoryId).name.toLowerCase()} sometimes
              genuinely doubles up.
            </p>
          </div>
        ) : null}
      </form>
    </Modal>
  )
}

export default EventDialog
