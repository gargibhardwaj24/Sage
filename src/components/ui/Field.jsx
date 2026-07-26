import { forwardRef, useId, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/cn'

const controlBase =
  'w-full rounded-xl border bg-[rgb(var(--surface))] px-4 text-body-md text-ink ' +
  'placeholder:text-faint transition-all duration-200 ease-expo ' +
  'focus:border-[rgb(var(--accent))] focus:bg-[rgb(var(--card))] ' +
  'focus:shadow-[0_0_0_4px_rgb(var(--accent)/0.12)] focus:outline-none'

export function Label({ children, htmlFor, hint }) {
  return (
    <div className="mb-2 flex items-baseline justify-between gap-2">
      <label htmlFor={htmlFor} className="eyebrow">
        {children}
      </label>
      {hint ? <span className="text-label-sm text-faint">{hint}</span> : null}
    </div>
  )
}

export const Input = forwardRef(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={cn(controlBase, 'h-11', className)} {...props} />
})

export const PasswordInput = forwardRef(function PasswordInput({ className, ...props }, ref) {
  const [visible, setVisible] = useState(false)
  const hintId = useId()

  return (
    <div className="relative">
      <input
        ref={ref}
        type={visible ? 'text' : 'password'}
        aria-describedby={hintId}
        className={cn(controlBase, 'h-11 pr-11', className)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        title={visible ? 'Hide password' : 'Show password'}
        className="absolute right-1 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-control text-faint transition-colors hover:text-ink"
      >
        {visible ? <EyeOff size={16} strokeWidth={2} /> : <Eye size={16} strokeWidth={2} />}
      </button>
      <span id={hintId} className="sr-only">
        {visible ? 'Password is visible' : 'Password is hidden'}
      </span>
    </div>
  )
})

export const Textarea = forwardRef(function Textarea({ className, ...props }, ref) {
  return <textarea ref={ref} className={cn(controlBase, 'py-3', className)} {...props} />
})

export const Select = forwardRef(function Select({ className, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={cn(controlBase, 'select-chevron h-11 cursor-pointer appearance-none pr-9', className)}
      {...props}
    >
      {children}
    </select>
  )
})

export function Field({ label, hint, htmlFor, children, className }) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor} hint={hint}>
        {label}
      </Label>
      {children}
    </div>
  )
}

export function Switch({ checked, onChange, label, id }) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300',
        checked ? 'bg-[rgb(var(--accent))]' : 'bg-[rgb(var(--line-strong))]'
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow',
          'transition-transform duration-300 ease-expo',
          checked ? 'translate-x-5' : 'translate-x-0'
        )}
      />
    </button>
  )
}

export default Field
