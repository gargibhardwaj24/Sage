import { cn } from '@/lib/cn'
import { alpha } from '@/lib/color'
import { categoryHex, categoryInk, getCategory } from '@/data/categories'
import { useTheme } from '@/store/ThemeContext'

export function CategoryBadge({ categoryId, className, showDot = true }) {
  const { isDark } = useTheme()
  const category = getCategory(categoryId)
  const hex = categoryHex(categoryId, isDark)

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium tracking-wide',
        className
      )}
      style={{
        backgroundColor: alpha(hex, isDark ? 0.16 : 0.13),
        color: categoryInk(categoryId, isDark),
      }}
    >
      {showDot ? (
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: hex }}
          aria-hidden="true"
        />
      ) : null}
      {category.name}
    </span>
  )
}

export default CategoryBadge
