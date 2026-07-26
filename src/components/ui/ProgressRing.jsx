import { motion } from 'framer-motion'
import { cn } from '@/lib/cn'

export function ProgressRing({
  value,
  max = 100,
  size = 132,
  stroke = 8,
  label,
  sublabel,
  className,
}) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const pct = Math.max(0, Math.min(1, value / max))

  return (
    <div
      className={cn('relative grid place-items-center', className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          stroke="rgb(var(--line))"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgb(var(--accent))"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - pct) }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>

      <div className="absolute inset-0 grid place-content-center text-center">
        <div className="text-headline-lg font-semibold leading-none tracking-tight text-ink">
          {label ?? Math.round(value)}
        </div>
        {sublabel ? <div className="eyebrow mt-2">{sublabel}</div> : null}
      </div>
    </div>
  )
}

export default ProgressRing
