import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import HeroBanner from '@/components/dashboard/HeroBanner'
import FocusSession from '@/components/dashboard/FocusSession'
import SageInsight from '@/components/dashboard/SageInsight'
import TodayOverview, { UnclaimedTimeCard } from '@/components/dashboard/TodayOverview'
import ActionItems from '@/components/dashboard/ActionItems'
import RecentActivity from '@/components/dashboard/RecentActivity'
import QuickAdd from '@/components/dashboard/QuickAdd'
import MethodSuggestions from '@/components/dashboard/MethodSuggestions'
import { useEvents } from '@/store/EventsContext'
import { useSettings } from '@/store/SettingsContext'
import { useEventDialog } from '@/store/DialogContext'
import { useToast } from '@/store/ToastContext'
import { useNow } from '@/hooks/useNow'
import { streaks, weekStats } from '@/lib/analytics'
import { eventsOnDay, freeSlots } from '@/lib/schedule'
import { getMethod } from '@/data/methods'
import { addMinutes, fmtRelativeDay, fmtTimeShort, snapToSlot } from '@/lib/date'

export function DashboardPage() {
  const { events, addEvent, toggleComplete, undo } = useEvents()
  const { settings } = useSettings()
  const dialog = useEventDialog()
  const { toast } = useToast()
  const navigate = useNavigate()
  const now = useNow()

  const method = getMethod(settings.activeMethod)

  const data = useMemo(() => {
    const stats = weekStats(events, now, { focusTargetHours: settings.focusTargetHours, now })
    const gaps = freeSlots(events, now, {
      workStartHour: settings.workStartHour,
      workEndHour: settings.workEndHour,
      minMinutes: 30,
      now,
    })
    return {
      stats,
      streak: streaks(events, now),
      today: eventsOnDay(events, now),
      gaps,
      freeMinutes: gaps.reduce((n, g) => n + g.minutes, 0),
    }
  }, [events, settings, now])

  const handleQuickAdd = (draft) => {
    addEvent(draft)
    toast({
      tone: 'success',
      title: 'Event added',
      description: `${draft.title} · ${fmtRelativeDay(draft.start)} at ${fmtTimeShort(draft.start)}`,
      action: { label: 'Undo', onClick: undo },
    })
  }

  const planWeek = () =>
    navigate(`/methods`, {
      state: {
        prompt: `Plan my week with ${(method?.name ?? 'deep work').toLowerCase()}`,
        at: Date.now(),
      },
    })

  return (
    <div className="space-y-5 sm:space-y-6">
      <HeroBanner
        name={settings.userName}
        score={data.stats.score}
        streak={data.streak.current}
        focusHours={data.stats.focusHours}
        focusTarget={settings.focusTargetHours}
        now={now}
        method={method}
        onPlanWeek={planWeek}
      />

      <FocusSession events={events} onOpen={dialog.openEdit} delay={0.02} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] sm:gap-5">
        <SageInsight events={events} settings={settings} now={now} delay={0.05} />
        <UnclaimedTimeCard
          slots={data.gaps}
          freeMinutes={data.freeMinutes}
          delay={0.08}
          onFill={(start) =>
            dialog.openNew({
              start,
              end: addMinutes(start, method?.defaultBlock ?? 60),
              categoryId: 'deep-work',
            })
          }
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] sm:gap-5">
        <TodayOverview
          events={data.today}
          now={now}
          delay={0.1}
          onToggle={toggleComplete}
          onOpen={dialog.openEdit}
          onCreate={() =>
            dialog.openNew({
              start: snapToSlot(addMinutes(now, 30)),
              end: addMinutes(snapToSlot(addMinutes(now, 30)), method?.defaultBlock ?? 60),
            })
          }
        />

        <div className="space-y-4 sm:space-y-5">
          <ActionItems
            events={events}
            now={now}
            delay={0.13}
            onToggle={toggleComplete}
            onOpen={dialog.openEdit}
          />
          <QuickAdd events={events} onAdd={handleQuickAdd} delay={0.16} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] sm:gap-5">
        <MethodSuggestions
          events={events}
          settings={settings}
          now={now}
          delay={0.19}
        />
        <RecentActivity events={events} now={now} delay={0.22} />
      </div>
    </div>
  )
}

export default DashboardPage
