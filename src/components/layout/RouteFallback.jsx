import { motion } from 'framer-motion'

export function RouteFallback({ label = 'Loading' }) {
  return (
    <div className="surface-card flex min-h-[420px] flex-col items-center justify-center rounded-card">
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-2 w-2 rounded-full bg-[rgb(var(--accent))]"
            animate={{ opacity: [0.25, 1, 0.25], y: [0, -4, 0] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
      <p className="mt-4 text-xs font-medium uppercase tracking-widest text-faint">{label}</p>
    </div>
  )
}

export default RouteFallback
