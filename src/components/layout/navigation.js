import { BarChart3, CalendarDays, LayoutDashboard, Sparkles, Target } from 'lucide-react'

export const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true, blurb: 'Today at a glance' },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays, blurb: 'Day, week and month' },
  { to: '/assistant', label: 'Assistant', icon: Sparkles, blurb: 'Ask, and it reschedules', accent: true },
  { to: '/methods', label: 'Methods', icon: Target, blurb: 'Ways to structure a week' },
  { to: '/analytics', label: 'Analytics', icon: BarChart3, blurb: 'Score, streaks and trends' },
]
