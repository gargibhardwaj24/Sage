import { motion } from 'framer-motion'
import { cn } from '@/lib/cn'

export function Segmented({ options, value, onChange, size = 'md', className, layoutId = 'seg' }) {
  return (
    <div
      role="tablist"
      className={cn('surface-inset inline-flex rounded-full p-1', className)}
    >
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={active}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              'relative rounded-full transition-colors duration-200 ease-expo',
              size === 'sm' ? 'px-3 py-1 text-label-sm' : 'px-4 py-1.5 text-body-md',
              active ? 'font-medium text-ink' : 'text-muted hover:text-ink'
            )}
          >
            {active ? (
              <motion.span
                layoutId={layoutId}
                transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                className="surface-card absolute inset-0 rounded-full"
              />
            ) : null}
            <span className="relative z-10 flex items-center gap-1.5">
              {opt.icon ? <opt.icon size={size === 'sm' ? 13 : 15} strokeWidth={2} /> : null}
              {opt.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export default Segmented
