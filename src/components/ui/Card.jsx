import { motion } from 'framer-motion'
import { cn } from '@/lib/cn'

export function Card({ as: Tag = 'div', className, children, ...props }) {
  return (
    <Tag className={cn('surface-card rounded-card', className)} {...props}>
      {children}
    </Tag>
  )
}

export function MotionCard({ className, delay = 0, children, ...props }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      className={cn('surface-card rounded-card', className)}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export function CardHeader({ title, subtitle, icon: Icon, action, className }) {
  return (
    <div className={cn('flex items-start justify-between gap-3', className)}>
      <div className="flex min-w-0 items-start gap-3">
        {Icon ? (
          <span className="surface-inset mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl text-accent">
            <Icon size={16} strokeWidth={2} />
          </span>
        ) : null}
        <div className="min-w-0">
          <h3 className="truncate text-body-md font-semibold tracking-tight text-ink">{title}</h3>
          {subtitle ? <p className="mt-1 text-label-sm text-muted">{subtitle}</p> : null}
        </div>
      </div>
      {action}
    </div>
  )
}

export default Card
