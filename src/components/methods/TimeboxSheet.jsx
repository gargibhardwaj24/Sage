import { useEffect, useRef, useState } from 'react'
import { Eraser, Paintbrush, X } from 'lucide-react'
import { Textarea } from '@/components/ui/Field'
import { CategoryPicker } from '@/components/methods/sheetControls'
import { categoryHex, categoryInk } from '@/data/categories'
import { useTheme } from '@/store/ThemeContext'
import { rowsOf } from '@/lib/worksheet'
import { alpha } from '@/lib/color'
import { atTime, format } from '@/lib/date'
import { cn } from '@/lib/cn'

export function TimeboxSheet({ sheet, state, onChange }) {
  const { isDark } = useTheme()
  const [brush, setBrush] = useState(null)
  const strokeRef = useRef(null)
  const rows = rowsOf(sheet)

  const slots = state.slots ?? {}
  const priorities = state.priorities ?? []

  useEffect(() => {
    const stop = () => {
      strokeRef.current = null
    }
    window.addEventListener('pointerup', stop)
    window.addEventListener('pointercancel', stop)
    return () => {
      window.removeEventListener('pointerup', stop)
      window.removeEventListener('pointercancel', stop)
    }
  }, [])

  useEffect(() => {
    if (!brush) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') setBrush(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [brush])

  const activePriority = priorities.find((p) => p.id === brush) ?? null

  const setSlot = (key, value) => {
    const next = { ...slots }
    if (!value || !value.text?.trim()) delete next[key]
    else next[key] = value
    onChange({ slots: next })
  }

  const paint = (key, mode) => {
    if (!activePriority) return
    if (mode === 'erase') setSlot(key, null)
    else {
      setSlot(key, {
        text: activePriority.text.trim(),
        categoryId: activePriority.categoryId,
        priority: activePriority.id,
      })
    }
  }

  const startStroke = (key) => {
    if (!activePriority) return
    const mode = slots[key]?.priority === activePriority.id ? 'erase' : 'fill'
    strokeRef.current = mode
    paint(key, mode)
  }

  const extendStroke = (key) => {
    if (strokeRef.current) paint(key, strokeRef.current)
  }

  const updatePriority = (id, patch) => {
    const nextPriorities = priorities.map((p) => (p.id === id ? { ...p, ...patch } : p))
    const nextSlots = {}

    for (const [key, cell] of Object.entries(slots)) {
      if (cell.priority !== id) {
        nextSlots[key] = cell
        continue
      }
      const text = patch.text !== undefined ? patch.text.trim() : cell.text
      if (!text) continue
      nextSlots[key] = { ...cell, text, categoryId: patch.categoryId ?? cell.categoryId }
    }

    onChange({ priorities: nextPriorities, slots: nextSlots })
  }

  const filled = Object.keys(slots).length

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] lg:items-start">
      <div className="space-y-5">
        <section className="surface-card rounded-card p-5">
          <p className="eyebrow">Priorities</p>
          <p className="mt-2 text-label-sm leading-relaxed text-faint">
            The three things that have to move today. Pick one, then drag across the grid to box it
            in.
          </p>

          <div className="mt-4 space-y-2.5">
            {priorities.map((priority) => {
              const hex = categoryHex(priority.categoryId, isDark)
              const ink = categoryInk(priority.categoryId, isDark)
              const isActive = brush === priority.id
              const ready = Boolean(priority.text.trim())

              return (
                <div key={priority.id} className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={!ready}
                    onClick={() => setBrush(isActive ? null : priority.id)}
                    aria-pressed={isActive}
                    title={
                      ready
                        ? isActive
                          ? 'Stop painting'
                          : `Paint the grid with ${priority.label}`
                        : 'Name this priority first'
                    }
                    className={cn(
                      'grid h-9 w-9 shrink-0 place-items-center rounded-control text-label-sm font-semibold',
                      'transition-all duration-200 ease-expo disabled:opacity-40',
                      isActive && 'ring-2 ring-offset-2 ring-offset-[rgb(var(--card))]'
                    )}
                    style={{
                      backgroundColor: alpha(hex, isActive ? 0.24 : 0.14),
                      color: ink,
                      '--tw-ring-color': hex,
                    }}
                  >
                    {isActive ? <Paintbrush size={14} strokeWidth={2.2} /> : priority.label}
                  </button>

                  <input
                    value={priority.text}
                    onChange={(e) => updatePriority(priority.id, { text: e.target.value })}
                    placeholder={`Priority ${priority.label.slice(1)}`}
                    aria-label={`Priority ${priority.label.slice(1)}`}
                    className={cn(
                      'h-9 min-w-0 flex-1 rounded-control border bg-[rgb(var(--surface))] px-3',
                      'text-body-md text-ink placeholder:text-faint',
                      'transition-all duration-200 ease-expo focus:border-[rgb(var(--accent))]',
                      'focus:bg-[rgb(var(--card))] focus:outline-none'
                    )}
                  />

                  <CategoryPicker
                    value={priority.categoryId}
                    onChange={(categoryId) => updatePriority(priority.id, { categoryId })}
                    label={`Category for priority ${priority.label.slice(1)}`}
                  />
                </div>
              )
            })}
          </div>
        </section>

        <section className="surface-card rounded-card p-5">
          <p className="eyebrow">Notes</p>
          <Textarea
            value={state.notes ?? ''}
            onChange={(e) => onChange({ notes: e.target.value })}
            rows={9}
            placeholder="Brain dump, blockers, anything you do not want taking up head space."
            className="mt-3 resize-y"
          />
          <p className="mt-2 text-label-sm text-faint">
            Kept with this sheet. Notes are not turned into calendar events.
          </p>
        </section>
      </div>

      <section className="surface-card overflow-hidden rounded-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[rgb(var(--line))] px-5 py-4">
          <div>
            <p className="eyebrow">Schedule</p>
            <p className="mt-1.5 text-label-sm text-faint">
              {filled ? `${filled} half-hour slots filled` : 'Click a slot to type, or paint one in'}
            </p>
          </div>

          {activePriority ? (
            <button
              type="button"
              onClick={() => setBrush(null)}
              className="flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1.5 text-label-sm font-medium"
            >
              <Paintbrush size={12} strokeWidth={2.2} />
              Painting {activePriority.label}
              <X size={12} strokeWidth={2.4} />
            </button>
          ) : filled ? (
            <button
              type="button"
              onClick={() => onChange({ slots: {} })}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-label-sm text-faint transition-colors hover:text-ink"
            >
              <Eraser size={12} strokeWidth={2.2} />
              Clear grid
            </button>
          ) : null}
        </div>

        <div className="grid grid-cols-[3.5rem_1fr_1fr] border-b border-[rgb(var(--line))] bg-[rgb(var(--surface))]">
          <span className="px-3 py-2" />
          <span className="border-l border-[rgb(var(--line))] px-3 py-2 text-label-sm font-medium text-faint">
            :00
          </span>
          <span className="border-l border-[rgb(var(--line))] px-3 py-2 text-label-sm font-medium text-faint">
            :30
          </span>
        </div>

        <div className="max-h-[34rem] overflow-y-auto">
          {rows.map((row) => (
            <div
              key={row.hour}
              className="grid grid-cols-[3.5rem_1fr_1fr] border-b border-[rgb(var(--line))] last:border-b-0"
            >
              <span className="flex items-baseline justify-end gap-0.5 px-2 py-2.5">
                <span className="text-body-md font-medium tabular-nums text-muted">
                  {format(atTime(new Date(), row.hour), 'h')}
                </span>
                <span className="text-[9px] font-semibold uppercase text-faint">
                  {format(atTime(new Date(), row.hour), 'a')}
                </span>
              </span>

              {row.keys.map(({ key }) => (
                <SlotCell
                  key={key}
                  slotKey={key}
                  cell={slots[key]}
                  painting={Boolean(activePriority)}
                  onStroke={startStroke}
                  onExtend={extendStroke}
                  onType={(text) =>
                    setSlot(key, { text, categoryId: sheet.defaultCategory, priority: null })
                  }
                />
              ))}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function SlotCell({ slotKey: key, cell, painting, onStroke, onExtend, onType }) {
  const { isDark } = useTheme()

  const tint = cell
    ? {
        backgroundColor: alpha(categoryHex(cell.categoryId, isDark), 0.14),
        color: categoryInk(cell.categoryId, isDark),
      }
    : undefined

  if (painting) {
    return (
      <button
        type="button"
        onPointerDown={(e) => {
          e.preventDefault()
          if (e.target.hasPointerCapture?.(e.pointerId)) {
            e.target.releasePointerCapture(e.pointerId)
          }
          onStroke(key)
        }}
        onPointerEnter={() => onExtend(key)}
        aria-label={`${key} slot`}
        className={cn(
          'h-10 select-none border-l border-[rgb(var(--line))] px-3 text-left',
          'truncate text-body-md transition-colors duration-150',
          cell ? 'font-medium' : 'hover:bg-[rgb(var(--card-high))]'
        )}
        style={tint}
      >
        {cell?.text ?? ''}
      </button>
    )
  }

  return (
    <input
      value={cell?.text ?? ''}
      onChange={(e) => onType(e.target.value)}
      aria-label={`${key} slot`}
      className={cn(
        'h-10 min-w-0 border-l border-[rgb(var(--line))] bg-transparent px-3',
        'text-body-md text-ink placeholder:text-faint',
        'transition-colors duration-150 focus:bg-[rgb(var(--card-high))] focus:outline-none',
        cell && 'font-medium'
      )}
      style={tint}
    />
  )
}

export default TimeboxSheet
