import { Plus, Trash2 } from 'lucide-react'
import { MinutesSelect } from '@/components/methods/sheetControls'
import { categoryHex, categoryInk } from '@/data/categories'
import { useTheme } from '@/store/ThemeContext'
import { alpha } from '@/lib/color'
import { cn } from '@/lib/cn'

const NEUTRAL = { light: '#5b6b7f', dark: '#93a2b3' }

export function MatrixSheet({ sheet, state, onChange }) {
  const { isDark } = useTheme()
  const quadrants = state.quadrants ?? {}

  const setTasks = (id, tasks) =>
    onChange({ quadrants: { ...quadrants, [id]: tasks } })

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {sheet.quadrants.map((quadrant) => {
        const tasks = quadrants[quadrant.id] ?? []
        const drops = quadrant.mode === 'drop'
        const hex = drops
          ? isDark
            ? NEUTRAL.dark
            : NEUTRAL.light
          : categoryHex(quadrant.categoryId, isDark)
        const ink = drops ? hex : categoryInk(quadrant.categoryId, isDark)
        const sized = quadrant.mode === 'today' || quadrant.mode === 'spread'

        const patch = (index, values) =>
          setTasks(
            quadrant.id,
            tasks.map((t, i) => (i === index ? { ...t, ...values } : t))
          )

        return (
          <section
            key={quadrant.id}
            className="surface-card flex flex-col rounded-card p-5"
            style={{ borderColor: alpha(hex, 0.3) }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="eyebrow" style={{ color: ink }}>
                  {quadrant.label}
                </p>
                <p className="mt-2 text-label-sm leading-relaxed text-faint">{quadrant.hint}</p>
              </div>
              <span
                className="shrink-0 rounded-full px-2.5 py-1 text-[10.5px] font-medium"
                style={{ backgroundColor: alpha(hex, 0.14), color: ink }}
              >
                {quadrant.action}
              </span>
            </div>

            <div className="mt-4 space-y-2">
              {tasks.map((task, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: hex }}
                  />
                  <input
                    value={task.title}
                    onChange={(e) => patch(index, { title: e.target.value })}
                    placeholder="Name this task"
                    aria-label={`${quadrant.label} task ${index + 1}`}
                    className={cn(
                      'h-9 min-w-0 flex-1 rounded-control border bg-[rgb(var(--surface))] px-3',
                      'text-body-md text-ink placeholder:text-faint',
                      'transition-all duration-200 ease-expo focus:border-[rgb(var(--accent))]',
                      'focus:bg-[rgb(var(--card))] focus:outline-none',
                      drops && 'line-through decoration-1'
                    )}
                  />
                  {sized ? (
                    <MinutesSelect
                      value={task.minutes ?? quadrant.minutes}
                      onChange={(minutes) => patch(index, { minutes })}
                      label="Length"
                      className="w-[4.75rem]"
                    />
                  ) : null}
                  <button
                    type="button"
                    onClick={() =>
                      setTasks(
                        quadrant.id,
                        tasks.filter((_, i) => i !== index)
                      )
                    }
                    aria-label={`Remove ${task.title || 'this task'}`}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-control text-faint transition-colors hover:bg-rose-500/10 hover:text-rose-500"
                  >
                    <Trash2 size={14} strokeWidth={2} />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() =>
                setTasks(quadrant.id, [
                  ...tasks,
                  { title: '', minutes: quadrant.minutes ?? 30 },
                ])
              }
              className={cn(
                'mt-3 flex items-center gap-1.5 self-start rounded-full px-3 py-1.5',
                'text-label-sm font-medium transition-colors'
              )}
              style={{ backgroundColor: alpha(hex, 0.12), color: ink }}
            >
              <Plus size={12} strokeWidth={2.6} />
              Add
            </button>
          </section>
        )
      })}
    </div>
  )
}

export default MatrixSheet
