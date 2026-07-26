import { useTheme } from '@/store/ThemeContext'
import { ACCENT } from '@/data/categories'

export function useChartTheme() {
  const { isDark } = useTheme()

  return {
    isDark,
    surface: isDark ? '#1e1f26' : '#ffffff',
    grid: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(18,19,26,0.06)',
    axis: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(18,19,26,0.12)',
    tick: isDark ? '#9a9da6' : '#74777e',
    ink: isDark ? '#e3e1ec' : '#16171c',
    muted: isDark ? '#9a9da6' : '#5b5e66',
    accent: isDark ? ACCENT.dark : ACCENT.light,
    neutral: isDark ? '#41434b' : '#cdd0d6',
    cursor: isDark ? 'rgba(78,222,163,0.1)' : 'rgba(0,165,114,0.07)',
  }
}

export const TICK_STYLE = {
  fontSize: 11,
  fontWeight: 500,
  fontFamily: '"Geist Mono", ui-monospace, monospace',
}

export default useChartTheme
