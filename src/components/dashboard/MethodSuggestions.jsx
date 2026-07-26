import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { FeaturedMethodCard } from '@/components/methods/MethodCard'
import { recommendMethods } from '@/lib/insights'

export function MethodSuggestions({ events, settings, now, delay = 0 }) {
  const navigate = useNavigate()

  const recommended = useMemo(
    () => recommendMethods(events, settings, now),
    [events, settings, now]
  )

  const handleApply = (methodId) => {
    // If they click apply, take them to the method details page or worksheet
    navigate(`/methods?m=${methodId}`)
  }

  const handleSelect = (methodId) => {
    navigate(`/methods?m=${methodId}`)
  }

  if (!recommended.length) return null

  // Show only the top recommendation to fit nicely in the dashboard layout
  const topRecommendation = recommended[0]

  return (
    <div className="flex flex-col">
      <p className="eyebrow mb-3 flex items-center gap-2">
        <Sparkles size={12} strokeWidth={2.4} className="text-accent" />
        Recommended for you
      </p>
      <FeaturedMethodCard
        method={topRecommendation.method}
        reason={topRecommendation.reason}
        onApply={handleApply}
        onSelect={handleSelect}
        index={0}
      />
    </div>
  )
}

export default MethodSuggestions
