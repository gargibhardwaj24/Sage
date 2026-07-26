import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
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
  const { events, addEvent, updateEvent, removeEvent, undo } = useEvents()
  const dialog = useEventDialog()
  const { toast } = useToast()
  const [settingsOpen, setSettingsOpen] = useState(false)

  const reminder = useReminders()

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

          <AnimatePresence mode="wait">
            <motion.main
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <Outlet />
            </motion.main>
          </AnimatePresence>
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
