import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { NAV_ITEMS } from './navigation'
import { cn } from '@/lib/cn'

export function MobileNav() {
  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 px-3 pb-3 lg:hidden">
      <div className="surface-raised flex items-center justify-around rounded-full p-1.5">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className="flex-1">
            {({ isActive }) => (
              <span
                className={cn(
                  'relative flex flex-col items-center gap-1 rounded-full px-1 py-2 text-[10px] transition-colors',
                  isActive ? 'font-medium text-ink' : 'text-faint'
                )}
              >
                {isActive ? (
                  <motion.span
                    layoutId="mobile-nav-pill"
                    transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                    className="absolute inset-0 rounded-full bg-[rgb(var(--card-high))]"
                  />
                ) : null}
                <item.icon size={17} strokeWidth={1.9} className="relative z-10" />
                <span className="relative z-10">{item.label}</span>
              </span>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

export default MobileNav
