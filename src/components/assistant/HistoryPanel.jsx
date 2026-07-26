import { MessageSquare, Trash2 } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import { timeAgo } from '@/lib/insights'
import { cn } from '@/lib/cn'

export function HistoryPanel({ open, onClose, threads, activeId, onSelect, onDelete, onClear }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Conversation history"
      description={`${threads.length} saved thread${threads.length === 1 ? '' : 's'}`}
      footer={
        threads.length ? (
          <Button variant="danger" size="sm" onClick={onClear} className="mr-auto">
            <Trash2 size={14} strokeWidth={2} />
            Clear all
          </Button>
        ) : null
      }
    >
      {threads.length ? (
        <ul className="space-y-2">
          {threads.map((thread) => (
            <li key={thread.id}>
              <div
                className={cn(
                  'surface-inset flex items-start gap-3 rounded-xl p-3.5 transition-colors',
                  thread.id === activeId && 'ring-1 ring-[rgb(var(--accent))]'
                )}
              >
                <button
                  type="button"
                  onClick={() => onSelect(thread.id)}
                  className="flex min-w-0 flex-1 items-start gap-3 text-left"
                >
                  <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-accent-soft">
                    <MessageSquare size={13} strokeWidth={2.2} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-body-md text-ink">{thread.title}</span>
                    <span className="mt-0.5 block text-label-sm text-faint">
                      {thread.messageCount} message{thread.messageCount === 1 ? '' : 's'} ·{' '}
                      {timeAgo(thread.updatedAt)}
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => onDelete(thread.id)}
                  aria-label={`Delete "${thread.title}"`}
                  className="shrink-0 rounded-lg p-1.5 text-faint transition-colors hover:text-rose-500"
                >
                  <Trash2 size={14} strokeWidth={2} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={MessageSquare}
          title="No saved conversations"
          description="Start a new chat and the previous one is archived here automatically."
        />
      )}
    </Modal>
  )
}

export default HistoryPanel
