import { useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import AreaForm from '@/components/areas/AreaForm'
import { BUILT_IN_CATEGORIES, categoryHex, categoryInk } from '@/data/categories'
import { useCustomCategories } from '@/hooks/useCategories'
import { useTheme } from '@/store/ThemeContext'
import { alpha } from '@/lib/color'

export function AreaManager({ areas, events = [], onAdd, onChange }) {
  const { isDark } = useTheme()
  const live = useCustomCategories()
  const [adding, setAdding] = useState(false)

  const usage = useMemo(() => {
    const counts = {}
    for (const e of events) counts[e.categoryId] = (counts[e.categoryId] ?? 0) + 1
    return counts
  }, [events])

  const list = Array.isArray(areas) ? areas : live


  return (
    <div className="surface-inset rounded-xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-ink">Your areas</p>
          <p className="mt-0.5 text-[11px] font-medium leading-relaxed text-muted">
            Add your own areas alongside the built-in ones, and pick their colour.
          </p>
        </div>
        {!adding ? (
          <Button variant="secondary" size="xs" onClick={() => setAdding(true)}>
            <Plus size={13} strokeWidth={2.6} />
            New area
          </Button>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {BUILT_IN_CATEGORIES.map((c) => (
          <span
            key={c.id}
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
            style={{
              backgroundColor: alpha(categoryHex(c.id, isDark), isDark ? 0.2 : 0.14),
              color: categoryInk(c.id, isDark),
            }}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: categoryHex(c.id, isDark) }}
            />
            {c.name}
          </span>
        ))}
      </div>

      {list.length ? (
        <ul className="mt-3 space-y-1.5">
          {list.map((area) => {
            const used = usage[area.id] ?? 0
            return (
              <li
                key={area.id}
                className="flex items-center gap-2 rounded-control bg-[rgb(var(--card))] px-2.5 py-2"
              >
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: categoryHex(area.id, isDark) }}
                />
                <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-ink">
                  {area.name}
                </span>
                <span className="shrink-0 text-[10.5px] font-medium text-faint">
                  {used ? `${used} event${used === 1 ? '' : 's'}` : 'unused'}
                </span>
                <button
                  type="button"
                  onClick={() => onChange(list.filter((a) => a.id !== area.id))}
                  aria-label={`Delete ${area.name}`}
                  title={
                    used
                      ? `${used} event${used === 1 ? '' : 's'} will fall back to Deep Work`
                      : `Delete ${area.name}`
                  }
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-control text-faint transition-colors hover:bg-rose-500/10 hover:text-rose-500"
                >
                  <Trash2 size={13} strokeWidth={2.2} />
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}

      {adding ? (
        <AreaForm
          className="mt-3"
          onCancel={() => setAdding(false)}
          onCreate={(input) => {
            const result = onAdd(input)
            if (result?.ok) setAdding(false)
            return result
          }}
        />
      ) : null}
    </div>
  )
}

export default AreaManager
