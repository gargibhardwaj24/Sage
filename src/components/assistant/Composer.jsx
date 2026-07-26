import { useEffect, useRef, useState } from 'react'
import { ArrowUp, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/cn'

export function Composer({ onSend, onReset, disabled, placeholder }) {
  const [value, setValue] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`
  }, [value])

  const submit = () => {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue('')
  }

  return (
    <div className="surface-raised flex items-end gap-2 rounded-card p-2">
      <button
        type="button"
        onClick={onReset}
        title="Clear conversation"
        aria-label="Clear conversation"
        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-faint transition hover:bg-[rgb(var(--card-high))] hover:text-ink"
      >
        <RotateCcw size={16} strokeWidth={2.4} />
      </button>

      <textarea
        ref={ref}
        rows={1}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            submit()
          }
        }}
        placeholder={placeholder ?? 'Ask about your schedule, or tell me what to change…'}
        aria-label="Message the assistant"
        className="max-h-[140px] min-h-[40px] flex-1 resize-none bg-transparent px-1 py-2.5 text-body-md text-ink placeholder:text-faint focus:outline-none"
      />

      <button
        type="button"
        onClick={submit}
        disabled={!value.trim() || disabled}
        aria-label="Send"
        className={cn(
          'grid h-10 w-10 shrink-0 place-items-center rounded-xl transition-all duration-200',
          value.trim() && !disabled
            ? 'bg-primary hover:brightness-110 active:scale-95'
            : 'surface-inset text-faint'
        )}
      >
        <ArrowUp size={17} strokeWidth={2.8} />
      </button>
    </div>
  )
}

export default Composer
