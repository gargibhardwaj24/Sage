import { cn } from '@/lib/cn'

export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-12 text-center', className)}>
      {Icon ? (
        <span className="surface-inset mb-4 grid h-14 w-14 place-items-center rounded-2xl text-accent">
          <Icon size={22} strokeWidth={1.8} />
        </span>
      ) : null}
      <p className="text-body-md font-medium text-ink">{title}</p>
      {description ? <p className="mt-2 max-w-xs text-body-md text-muted">{description}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  )
}

export default EmptyState
