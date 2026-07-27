import { CloudOff, CloudUpload, RefreshCw, WifiOff } from 'lucide-react'
import Button from '@/components/ui/Button'

function Strip({ tone = 'amber', icon: Icon, children, action }) {
  const palette =
    tone === 'accent'
      ? 'border-[rgb(var(--accent))]/30 bg-[rgb(var(--accent))]/[0.08] text-ink'
      : 'border-amber-500/30 bg-amber-500/[0.08] text-amber-800 dark:text-amber-200'

  const iconTone = tone === 'accent' ? 'text-accent' : 'text-amber-600 dark:text-amber-400'

  return (
    <div className={`mb-4 flex flex-wrap items-center gap-3 rounded-card border px-4 py-3 ${palette}`}>
      <Icon size={16} strokeWidth={2} className={`shrink-0 ${iconTone}`} />
      <p className="flex-1 text-body-md">{children}</p>
      {action}
    </div>
  )
}

export function SyncBanner({ status, queued = 0, onRetry, pendingImport, onImport, onDismissImport }) {
  if (pendingImport?.length) {
    return (
      <Strip
        tone="accent"
        icon={CloudUpload}
        action={
          <span className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onDismissImport}>
              No thanks
            </Button>
            <Button variant="primary" size="sm" onClick={onImport}>
              Import {pendingImport.length}
            </Button>
          </span>
        }
      >
        <span className="font-medium">
          {pendingImport.length} event{pendingImport.length === 1 ? '' : 's'} saved on this device.
        </span>{' '}
        Move them into your account so they sync everywhere?
      </Strip>
    )
  }

  if (status === 'offline') {
    return (
      <Strip
        icon={CloudOff}
        action={
          <Button variant="secondary" size="sm" onClick={onRetry}>
            <RefreshCw size={14} strokeWidth={2.2} />
            Reconnect
          </Button>
        }
      >
        <span className="font-medium">Offline — working from your cached calendar.</span>{' '}
        {queued
          ? `${queued} change${queued === 1 ? '' : 's'} will upload when you're back.`
          : 'Anything you change is saved here and will sync automatically.'}
      </Strip>
    )
  }

  if (status === 'error') {
    return (
      <Strip
        icon={WifiOff}
        action={
          <Button variant="secondary" size="sm" onClick={onRetry}>
            <RefreshCw size={14} strokeWidth={2.2} />
            Retry now
          </Button>
        }
      >
        <span className="font-medium">Couldn&apos;t load your calendar.</span> Your events are safe —
        this is just the connection. Retrying automatically…
      </Strip>
    )
  }

  return null
}

export default SyncBanner
