import { LogOut, ShieldAlert } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import AreaManager from './AreaManager'
import { useAreas } from '@/hooks/useAreas'
import { Field, Input, PasswordInput, Select, Switch } from '@/components/ui/Field'
import { useSettings } from '@/store/SettingsContext'
import { useEvents } from '@/store/EventsContext'
import { useAuth } from '@/store/AuthContext'
import { useToast } from '@/store/ToastContext'
import { METHODS, getMethod } from '@/data/methods'
import { fullNameFromUser, nameFromEmail } from '@/lib/identity'
import { fmtTimeShort, atTime } from '@/lib/date'

const HOURS = Array.from({ length: 24 }, (_, h) => h)

const HOLIDAY_SOURCE_LABEL = {
  loading: 'Fetching the latest list from Calendarific…',
  api: 'Live from the Calendarific API, cached for 30 days',
  cache: 'From your cached Calendarific data',
  bundled: 'Using the built-in list (add a Calendarific key for live data)',
  off: 'National holidays and festivals, shown as all-day markers',
}

const GEMINI_MODELS = [
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-2.5-flash',
  'gemini-2.5-pro',
]

export function SettingsDialog({ open, onClose }) {
  const { settings, update } = useSettings()
  const { events, holidaySource, resetToSeed, clearAll, undo } = useEvents()
  const { isDemo, isGuest, configured, user, signOut } = useAuth()
  const { areas, addArea } = useAreas()
  const { toast } = useToast()
  const envKey = Boolean(import.meta.env?.VITE_GEMINI_API_KEY)
  const activeMethod = getMethod(settings.activeMethod)
  const sampleData = isDemo || isGuest

  const accountName = isGuest
    ? 'Guest session'
    : fullNameFromUser(user) || nameFromEmail(user?.email) || 'Signed in'

  const accountDetail = isGuest
    ? 'Nothing here is tied to an account yet'
    : isDemo
      ? 'Demo account · sample data'
      : (user?.email ?? '')

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Preferences"
      description="These shape how the assistant plans and what the score measures."
      footer={
        <Button variant="primary" size="sm" onClick={onClose}>
          Done
        </Button>
      }
    >
      <div className="space-y-4">
        {configured ? (
          <div className="surface-inset flex items-center justify-between gap-3 rounded-xl px-4 py-3">
            <span className="flex min-w-0 items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-label-sm font-semibold uppercase">
                {accountName.charAt(0)}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-ink">{accountName}</span>
                {accountDetail ? (
                  <span className="mt-0.5 block truncate text-[11px] font-medium text-muted">
                    {accountDetail}
                  </span>
                ) : null}
              </span>
            </span>
            <Button variant="secondary" size="xs" onClick={signOut} className="shrink-0">
              <LogOut size={13} strokeWidth={2} />
              {sampleData ? 'End demo' : 'Sign out'}
            </Button>
          </div>
        ) : null}

        <Field label="Your name" htmlFor="set-name">
          <Input
            id="set-name"
            data-autofocus
            value={settings.userName}
            onChange={(e) => update({ userName: e.target.value })}
            placeholder="What should Sage call you?"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Day starts" htmlFor="set-start">
            <Select
              id="set-start"
              value={settings.workStartHour}
              onChange={(e) => update({ workStartHour: Number(e.target.value) })}
            >
              {HOURS.map((h) => (
                <option key={h} value={h}>
                  {fmtTimeShort(atTime(new Date(), h))}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Day ends" htmlFor="set-end">
            <Select
              id="set-end"
              value={settings.workEndHour}
              onChange={(e) => update({ workEndHour: Number(e.target.value) })}
            >
              {HOURS.filter((h) => h > settings.workStartHour).map((h) => (
                <option key={h} value={h}>
                  {fmtTimeShort(atTime(new Date(), h))}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <p className="-mt-2 text-[11px] font-medium text-faint">
          The assistant only proposes slots inside this window — unless you explicitly ask for a time
          outside it.
        </p>

        <Field label="Weekly focus target" htmlFor="set-target" hint="hours">
          <Input
            id="set-target"
            type="number"
            min="1"
            max="60"
            value={settings.focusTargetHours}
            onChange={(e) => update({ focusTargetHours: Math.max(1, Number(e.target.value) || 1) })}
          />
        </Field>

        <Field label="Planning method" htmlFor="set-method">
          <Select
            id="set-method"
            value={settings.activeMethod}
            onChange={(e) => update({ activeMethod: e.target.value })}
          >
            {METHODS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </Select>
          {activeMethod ? (
            <p className="mt-2 text-[11px] font-medium leading-relaxed text-faint">
              {activeMethod.tagline}
            </p>
          ) : null}
        </Field>

        <div className="surface-inset rounded-xl p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-ink">Gemini assistant</p>
              <p className="mt-0.5 text-[11px] font-medium text-muted">
                {envKey
                  ? 'A key is already configured for this deployment.'
                  : 'Add a key to use the live model instead of the built-in engine.'}
              </p>
            </div>
            <Switch
              checked={settings.aiEnabled}
              onChange={(v) => update({ aiEnabled: v })}
              label="Gemini assistant"
            />
          </div>

          {settings.aiEnabled ? (
            <div className="mt-4 space-y-3">
              <Field label="API key" htmlFor="set-key" hint={envKey ? 'overrides the default' : 'optional'}>
                <PasswordInput
                  id="set-key"
                  autoComplete="off"
                  spellCheck="false"
                  value={settings.geminiApiKey}
                  onChange={(e) => update({ geminiApiKey: e.target.value })}
                  placeholder={envKey ? 'Using the configured key' : 'Paste a key'}
                />
              </Field>

              <Field label="Model" htmlFor="set-model">
                <Select
                  id="set-model"
                  value={settings.geminiModel}
                  onChange={(e) => update({ geminiModel: e.target.value })}
                >
                  {GEMINI_MODELS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </Select>
              </Field>

              <p className="flex items-start gap-2 text-[11px] leading-relaxed text-muted">
                <ShieldAlert size={13} strokeWidth={2} className="mt-px shrink-0 text-amber-500" />
                A key you paste here is kept in this browser only, and is never saved to your
                account.
              </p>
            </div>
          ) : (
            <p className="mt-3 text-[11px] leading-relaxed text-muted">
              The offline engine still handles scheduling, conflicts and stats — it just parses
              language with rules rather than a model.
            </p>
          )}
        </div>

        <AreaManager
          areas={areas}
          events={events}
          onAdd={addArea}
          onChange={(next) => update({ customCategories: next })}
        />

        <label className="surface-inset flex cursor-pointer items-center justify-between gap-4 rounded-xl px-4 py-3">
          <span>
            <span className="block text-sm font-medium text-ink">
              Event reminders
            </span>
            <span className="mt-0.5 block text-[11px] font-medium text-muted">
              Toast notifications when a block is about to start
            </span>
          </span>
          <Switch
            checked={settings.remindersEnabled}
            onChange={(v) => update({ remindersEnabled: v })}
            label="Event reminders"
          />
        </label>

        <label className="surface-inset flex cursor-pointer items-center justify-between gap-4 rounded-xl px-4 py-3">
          <span>
            <span className="block text-sm font-medium text-ink">Indian holidays</span>
            <span className="mt-0.5 block text-[11px] font-medium text-muted">
              {HOLIDAY_SOURCE_LABEL[holidaySource] ?? HOLIDAY_SOURCE_LABEL.bundled}
            </span>
          </span>
          <Switch
            checked={settings.showHolidays !== false}
            onChange={(v) => update({ showHolidays: v })}
            label="Indian holidays"
          />
        </label>

        <div className="rounded-xl border border-rose-500/25 bg-rose-500/[0.06] p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-rose-600 dark:text-rose-300">
            Workspace data
          </p>
          <p className="mt-1.5 text-[11.5px] font-medium leading-relaxed text-muted">
            {sampleData
              ? 'This clears every event on your calendar. It can be undone.'
              : 'These change every event on your calendar. Both actions can be undone.'}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {sampleData ? (
              <Button
                variant="secondary"
                size="xs"
                onClick={() => {
                  resetToSeed()
                  toast({
                    tone: 'success',
                    title: 'Sample data restored',
                    action: { label: 'Undo', onClick: undo },
                  })
                }}
              >
                Reset sample data
              </Button>
            ) : null}
            <Button
              variant="danger"
              size="xs"
              onClick={() => {
                clearAll()
                toast({
                  tone: 'danger',
                  title: 'All events cleared',
                  action: { label: 'Undo', onClick: undo },
                })
              }}
            >
              Clear all events
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default SettingsDialog
