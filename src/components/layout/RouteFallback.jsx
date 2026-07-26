import RoseLoader from '@/components/ui/RoseLoader'

export function RouteFallback({ label = 'Loading' }) {
  return (
    <div className="surface-card flex min-h-[420px] flex-col items-center justify-center rounded-card">
      <RoseLoader size={96} />
      <p className="mt-5 text-xs font-medium uppercase tracking-widest text-faint">{label}</p>
    </div>
  )
}

export default RouteFallback
