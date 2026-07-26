import { forwardRef } from 'react'
import { cn } from '@/lib/cn'

const VARIANTS = {
  primary: 'bg-primary hover:opacity-90 active:scale-[0.98]',
  accent: 'bg-accent hover:brightness-105 active:scale-[0.98]',
  secondary: 'surface-card text-ink surface-hover active:scale-[0.98]',
  outline: 'border text-muted hover:text-ink hover:border-[rgb(var(--line-strong))]',
  ghost: 'text-muted hover:bg-[rgb(var(--card-high))] hover:text-ink',
  subtle: 'bg-accent-soft hover:brightness-95 dark:hover:brightness-110',
  danger: 'bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 dark:bg-rose-500/15 dark:text-rose-300',
}

const SIZES = {
  xs: 'h-7 gap-1 px-2.5 text-label-sm rounded-xl',
  sm: 'h-9 gap-1.5 px-4 text-body-md rounded-xl',
  md: 'h-11 gap-2 px-5 text-body-md rounded-full',
  lg: 'h-12 gap-2 px-6 text-body-lg rounded-full',
  icon: 'h-10 w-10 justify-center rounded-xl',
  'icon-sm': 'h-8 w-8 justify-center rounded-lg',
}

export const Button = forwardRef(function Button(
  { as: Tag = 'button', variant = 'secondary', size = 'md', className, children, ...props },
  ref
) {
  return (
    <Tag
      ref={ref}
      className={cn(
        'inline-flex select-none items-center font-medium tracking-tight',
        'transition-all duration-200 ease-expo disabled:pointer-events-none disabled:opacity-40',
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  )
})

export default Button
