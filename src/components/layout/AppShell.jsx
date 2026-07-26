import { Suspense, useEffect, useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { RefreshCw, WifiOff } from 'lucide-react'
import RouteBoundary from './RouteBoundary'
import RouteFallback from './RouteFallback'
import Button from '@/components/ui/Button'
import AuroraBackground from './AuroraBackground'
import Sidebar from './Sidebar'
import MobileNav from './MobileNav'
import Topbar from './Topbar'
import ToastViewport from './ToastViewport'
import SettingsDialog from './SettingsDialog'
import EventDialog from '@/components/calendar/EventDialog'
import ReminderDialog from '@/components/calendar/ReminderDialog'
import { useEvents } from '@/store/EventsContext'
import { useEventDialog } from '@/store/DialogContext'
import { useToast } from '@/store/ToastContext'
import { useReminders } from '@/hooks/useReminders'
import { fmtRelativeDay, fmtTimeShort } from '@/lib/date'

export function AppShell() {
  const location = useLocation()
  const { events, status, sync, retry, addEvent, updateEvent, removeEvent, undo } = useEvents()
  const dialog = useEventDialog()
  const { toast } = useToast()
  const [settingsOpen, setSettingsOpen] = useState(false)

  const reminder = useReminders()

  useEffect(() => {
    const warm = () => {
      import('@/pages/CalendarPage')
      import('@/pages/AssistantPage')
      import('@/pages/MethodsPage')
      import('@/pages/AnalyticsPage')
      import('@/pages/WorksheetPage')
    }
    const schedule = window.requestIdleCallback ?? ((fn) => setTimeout(fn, 300))
    const cancel = window.cancelIdleCallback ?? clearTimeout
    const id = schedule(warm)
    return () => cancel(id)
  }, [])

  const reportedFailures = useRef(sync?.failures ?? 0)

  useEffect(() => {
    const failures = sync?.failures ?? 0
    if (failures === reportedFailures.current) return
    reportedFailures.current = failures

    toast({
      tone: 'danger',
      title: "That didn't save to your account",
      description: sync?.reverted
        ? 'The change has been rolled back. Check your connection and try again.'
        : 'Your last change may not be saved. Reload to see what stuck.',
    })
  }, [sync, toast])

  const handleSave = (payload) => {
    if (payload.id) {
      updateEvent(payload.id, payload)
      toast({
        tone: 'success',
        title: 'Event updated',
        description: `${payload.title} · ${fmtRelativeDay(payload.start)} at ${fmtTimeShort(payload.start)}`,
        action: { label: 'Undo', onClick: undo },
      })
    } else {
      addEvent(payload)
      toast({
        tone: 'success',
        title: 'Event added',
        description: `${payload.title} · ${fmtRelativeDay(payload.start)} at ${fmtTimeShort(payload.start)}`,
        action: { label: 'Undo', onClick: undo },
      })
    }
  }

  const handleDelete = (id) => {
    const target = events.find((e) => e.id === id)
    removeEvent(id)
    toast({
      tone: 'danger',
      title: 'Event deleted',
      description: target?.title,
      action: { label: 'Undo', onClick: undo },
    })
  }

  return (
    <div className="min-h-screen">
      <AuroraBackground />
      <Sidebar onOpenSettings={() => setSettingsOpen(true)} />
      <MobileNav />

      <div className="lg:pl-[248px]">
        <div className="mx-auto w-full max-w-[1400px] px-4 pb-28 sm:px-6 lg:pb-10">
          <Topbar
            onNewEvent={() => dialog.openNew()}
            onOpenSettings={() => setSettingsOpen(true)}
          />

          {status === 'error' ? (
            <div className="mb-4 flex flex-wrap items-center gap-3 rounded-card border border-amber-500/30 bg-amber-500/[0.08] px-4 py-3">
              <WifiOff size={16} strokeWidth={2} className="shrink-0 text-amber-600 dark:text-amber-400" />
              <p className="flex-1 text-body-md text-amber-800 dark:text-amber-200">
                <span className="font-medium">Couldn&apos;t load your calendar.</span> Your events are
                safe — this is just the connection. Retrying automatically…
              </p>
              <Button variant="secondary" size="sm" onClick={retry}>
                <RefreshCw size={14} strokeWidth={2.2} />
                Retry now
              </Button>
            </div>
          ) : null}

          <RouteBoundary routeKey={location.pathname}>
            <Suspense fallback={<RouteFallback />}>
              <motion.main
                key={location.pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              >
                <Outlet />
              </motion.main>
            </Suspense>
          </RouteBoundary>
        </div>
      </div>

      <EventDialog
        open={dialog.open}
        onClose={dialog.close}
        event={dialog.event}
        draft={dialog.draft}
        events={events}
        onSave={handleSave}
        onDelete={handleDelete}
      />
      <ReminderDialog
        event={reminder.active}
        onDismiss={reminder.dismiss}
        onSnooze={reminder.snooze}
        onOpen={dialog.openEdit}
      />
      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <ToastViewport />
    </div>
  )
}

export default AppShell
