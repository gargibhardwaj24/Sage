import { useMemo } from 'react'
import { Check, History, Sparkles, LayoutTemplate } from 'lucide-react'
import { MotionCard, CardHeader } from '@/components/ui/Card'
import EmptyState from '@/components/ui/EmptyState'
import { categoryHex } from '@/data/categories'
import { useTheme } from '@/store/ThemeContext'
import { recentActivity } from '@/lib/insights'

const KIND_ICON = {
  completed: Check,
  ai: Sparkles,
  template: LayoutTemplate,
}

export function RecentActivity({ events, now, delay = 0 }) {
  const { isDark } = useTheme()
  const items = useMemo(() => recentActivity(events, { now }), [events, now])

  return (
    <MotionCard delay={delay} className="p-5">
      <CardHeader icon={History} title="Recent activity" subtitle="What changed lately" />

      {items.length ? (
        <ol className="relative mt-5 space-y-4">
          <span
            aria-hidden="true"
            className="absolute bottom-2 left-[9px] top-2 w-px bg-[rgb(var(--line))]"
          />
          {items.map((item) => {
            const Icon = KIND_ICON[item.kind] ?? Check
            return (
              <li key={item.id} className="relative flex gap-3">
                <span
                  className="relative z-10 mt-0.5 grid h-[19px] w-[19px] shrink-0 place-items-center rounded-full border-2 border-[rgb(var(--card))]"
                  style={{ backgroundColor: categoryHex(item.categoryId, isDark) }}
                >
                  <Icon size={9} strokeWidth={3} className="text-white" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-body-md text-ink">{item.title}</p>
                  <p className="mt-0.5 text-label-sm text-faint">{item.ago}</p>
                </div>
              </li>
            )
          })}
        </ol>
      ) : (
        <EmptyState
          icon={History}
          title="No activity yet"
          description="Completions and AI changes will show up here."
          className="py-8"
        />
      )}
    </MotionCard>
  )
}

export default RecentActivity
