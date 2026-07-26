import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CalendarClock, Gauge, History, Sparkles, SquarePen, Target, Wand2 } from 'lucide-react'
import ChatMessage, { TypingIndicator } from '@/components/assistant/ChatMessage'
import Composer from '@/components/assistant/Composer'
import HistoryPanel from '@/components/assistant/HistoryPanel'
import { Card } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { useEvents } from '@/store/EventsContext'
import { useAuth } from '@/store/AuthContext'
import { useSettings } from '@/store/SettingsContext'
import { useToast } from '@/store/ToastContext'
import { useNow } from '@/hooks/useNow'
import { applyAction, respond } from '@/lib/ai/engine'
import { isRemoteConfigured, respondRemote } from '@/lib/ai/remote'
import { GeminiError } from '@/lib/ai/gemini'
import { assistantMessage, logDev } from '@/lib/errors'
import { getMethod } from '@/data/methods'
import { storage } from '@/lib/storage'
import { uid } from '@/lib/id'
import { weekStats } from '@/lib/analytics'
import { eventsOnDay, freeSlots, nextUpcoming } from '@/lib/schedule'
import { fmtTimeShort, humanDuration } from '@/lib/date'

const MAX_HISTORY = 40
const MAX_THREADS = 20

const chatKeys = (userId) => {
  const scope = userId ? `.${userId}` : ''
  return { chat: `chat.v1${scope}`, threads: `chat.threads.v1${scope}` }
}

const threadTitle = (messages) => {
  const first = messages.find((m) => m.role === 'user')
  if (!first) return 'Untitled conversation'
  return first.text.length > 52 ? `${first.text.slice(0, 52)}…` : first.text
}

const STARTERS = [
  {
    icon: CalendarClock,
    label: 'Check a time',
    prompt: 'Am I free tonight at 8?',
    hint: 'Reads the real calendar',
  },
  {
    icon: Wand2,
    label: 'Reschedule',
    prompt: 'Move my DSA session from 5 PM to 8 PM',
    hint: 'Checks conflicts first',
  },
  {
    icon: Target,
    label: 'Find focus time',
    prompt: 'When can I fit 90 minutes of deep work this week?',
    hint: 'Ranks the openings',
  },
  {
    icon: Gauge,
    label: 'Review the week',
    prompt: 'How can I improve my schedule this week?',
    hint: 'Suggests concrete fixes',
  },
]

export function AssistantPage() {
  const { events, ...eventsApi } = useEvents()
  const { settings, update: updateSettings } = useSettings()
  const { toast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const now = useNow()

  const { userId } = useAuth()
  const KEYS = useMemo(() => chatKeys(userId), [userId])

  const [messages, setMessages] = useState(() => storage.get(chatKeys(userId).chat, []) ?? [])
  const [threads, setThreads] = useState(() => storage.get(chatKeys(userId).threads, []) ?? [])
  const [historyOpen, setHistoryOpen] = useState(false)
  const [activeThreadId, setActiveThreadId] = useState(null)
  const [thinking, setThinking] = useState(false)
  const scrollRef = useRef(null)
  const lastPrompt = useRef(null)

  useEffect(() => {
    storage.set(KEYS.chat, messages.slice(-MAX_HISTORY))
  }, [messages])

  useEffect(() => {
    storage.set(KEYS.threads, threads.slice(0, MAX_THREADS))
  }, [threads])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, thinking])

  const eventsRef = useRef(events)
  eventsRef.current = events

  const messagesRef = useRef(messages)
  messagesRef.current = messages

  const send = useCallback(
    async (text) => {
      const trimmed = text.trim()
      if (!trimmed) return

      const history = messagesRef.current
      setMessages((list) => [
        ...list,
        { id: uid('msg'), role: 'user', text: trimmed, createdAt: new Date().toISOString() },
      ])
      setThinking(true)

      const ctx = { events: eventsRef.current, settings, now: new Date() }
      const useRemote = isRemoteConfigured(settings)

      let answer = null
      let notice = null

      if (useRemote) {
        try {
          answer = await respondRemote(trimmed, ctx, history)
        } catch (error) {
          logDev('assistant', error?.detail ?? error?.message)
          notice =
            error instanceof GeminiError
              ? error.message
              : assistantMessage(error?.kind ?? 'request')
        }
      }

      if (!answer) {
        await new Promise((r) =>
          setTimeout(r, useRemote ? 0 : 380 + Math.min(600, trimmed.length * 8))
        )
        answer = respond(trimmed, ctx)
        answer.source = 'local'
        if (notice) answer.notice = `${notice} Answered with the built-in engine instead.`
      }

      setMessages((list) => [...list, answer])
      setThinking(false)
    },
    [settings]
  )

  useEffect(() => {
    const incoming = location.state?.prompt
    const stamp = location.state?.at
    if (!incoming || lastPrompt.current === stamp) return
    lastPrompt.current = stamp
    send(incoming)
    navigate(location.pathname, { replace: true, state: null })
  }, [location.state, location.pathname, navigate, send])

  const handleAction = (action, message) => {
    if (action.kind === 'navigate') {
      navigate(action.payload.to)
      return
    }
    if (action.kind === 'clarify') {
      send(action.payload.text)
      return
    }
    if (action.kind === 'setMethod') {
      updateSettings({ activeMethod: action.payload.methodId })
      const method = getMethod(action.payload.methodId)
      markResolved(message.id, action.id, `${method?.name} is now your default method`)
      toast({ tone: 'success', title: 'Method updated', description: method?.name })
      return
    }

    const result = applyAction(action, { ...eventsApi, getEvents: () => eventsRef.current })
    if (!result) return

    markResolved(message.id, action.id, [result.summary, result.detail].filter(Boolean).join(' · '))
    toast({
      tone: 'success',
      title: result.summary,
      description: result.detail,
      action: { label: 'Undo', onClick: eventsApi.undo },
    })
  }

  const markResolved = (messageId, actionId, resolution) => {
    setMessages((list) =>
      list.map((m) => (m.id === messageId ? { ...m, resolvedActionId: actionId, resolution } : m))
    )
  }

  const startNewThread = () => {
    if (messages.some((m) => m.role === 'user')) {
      const snapshot = {
        id: activeThreadId ?? uid('thread'),
        title: threadTitle(messages),
        messages: messages.slice(-MAX_HISTORY),
        messageCount: messages.length,
        updatedAt: new Date().toISOString(),
      }
      setThreads((list) =>
        [snapshot, ...list.filter((t) => t.id !== snapshot.id)].slice(0, MAX_THREADS)
      )
    }
    setMessages([])
    setActiveThreadId(null)
    storage.remove(KEYS.chat)
  }

  const openThread = (id) => {
    const thread = threads.find((t) => t.id === id)
    if (!thread) return
    if (messages.some((m) => m.role === 'user') && id !== activeThreadId) startNewThread()
    setMessages(thread.messages)
    setActiveThreadId(thread.id)
    setHistoryOpen(false)
  }

  const deleteThread = (id) => setThreads((list) => list.filter((t) => t.id !== id))

  const clearThreads = () => {
    setThreads([])
    storage.remove(KEYS.threads)
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
      <Card className="flex h-[calc(100vh-13rem)] min-h-[540px] flex-col overflow-hidden p-0 lg:h-[calc(100vh-11rem)]">
        <ChatHeader
          // count={messages.filter((m) => m.role === 'user').length}
          threadCount={threads.length}
          remote={isRemoteConfigured(settings)}
          // model={settings.geminiModel}
          onOpenHistory={() => setHistoryOpen(true)}
          onNewThread={startNewThread}
        />

        <div ref={scrollRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6">
          {messages.length === 0 ? (
            <WelcomePanel onPick={send} name={settings.userName} />
          ) : (
            messages.map((m, i) => (
              <ChatMessage
                key={m.id}
                message={m}
                isLast={i === messages.length - 1 && !thinking}
                onAction={handleAction}
                onFollowUp={send}
              />
            ))
          )}
          {thinking ? <TypingIndicator /> : null}
        </div>

        <div className="border-t p-3 sm:p-4">
          <Composer onSend={send} onReset={startNewThread} disabled={thinking} />
          <p className="mt-2 px-2 text-[10.5px] font-medium text-faint">
            Sage never changes your calendar on its own — every edit waits for you to confirm it.
          </p>
        </div>
      </Card>

      <ContextPanel events={events} settings={settings} now={now} />

      <HistoryPanel
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        threads={threads}
        activeId={activeThreadId}
        onSelect={openThread}
        onDelete={deleteThread}
        onClear={clearThreads}
      />
    </div>
  )
}

function ChatHeader({ count, threadCount, remote, model, onOpenHistory, onNewThread }) {
  return (
    <div className="flex items-center gap-3 border-b px-4 py-3.5 sm:px-6">
      <span className="relative grid h-10 w-10 place-items-center rounded-xl bg-accent">
        <Sparkles size={17} strokeWidth={2.4} />
        <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-400 dark:border-ink-900" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-body-md font-medium tracking-tight text-ink">Sage AI</p>
        <p className="flex items-center gap-1.5 text-label-sm text-muted">
          {/* <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> */}
          {/* <span className="truncate">
            {remote ? model || 'Gemini' : 'Offline engine'} · {count} question
            {count === 1 ? '' : 's'} this session
          </span> */}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <Button variant="secondary" size="sm" onClick={onOpenHistory}>
          <History size={14} strokeWidth={2} />
          History
          {threadCount ? (
            <span className="ml-0.5 rounded-full bg-accent-soft px-1.5 py-0.5 font-mono text-[10px] tabular-nums">
              {threadCount}
            </span>
          ) : null}
        </Button>
        <button
          type="button"
          onClick={onNewThread}
          aria-label="New conversation"
          title="New conversation"
          className="grid h-9 w-9 place-items-center rounded-xl text-muted transition-colors hover:bg-[rgb(var(--card-high))] hover:text-ink"
        >
          <SquarePen size={15} strokeWidth={2} />
        </button>
      </div>
    </div>
  )
}

function WelcomePanel({ onPick, name }) {
  return (
    <div className="flex h-full flex-col justify-center py-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="text-center"
      >
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-accent">
          <Sparkles size={24} strokeWidth={2.2} />
        </span>
        <h2 className="mt-5 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          What should we <span className="text-accent">rearrange</span>
          {name ? `, ${name}` : ''}?
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-relaxed text-muted">
          Ask in plain English. Sage reads your actual calendar, checks for conflicts, proposes a
          change — and waits for your confirmation before touching anything.
        </p>
      </motion.div>

      <div className="mx-auto mt-8 grid w-full max-w-2xl gap-2.5 sm:grid-cols-2">
        {STARTERS.map((starter, i) => (
          <motion.button
            key={starter.prompt}
            type="button"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08 * i, ease: [0.22, 1, 0.36, 1] }}
            onClick={() => onPick(starter.prompt)}
            className="surface-inset group rounded-xl p-3.5 text-left transition hover:border-[rgb(var(--accent))]"
          >
            <span className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-widest text-accent">
              <starter.icon size={12} strokeWidth={2.8} />
              {starter.label}
            </span>
            <p className="mt-2 text-[13px] font-medium leading-snug text-ink">
              “{starter.prompt}”
            </p>
            <p className="mt-1 text-[11px] font-semibold text-faint">{starter.hint}</p>
          </motion.button>
        ))}
      </div>
    </div>
  )
}

function ContextPanel({ events, settings, now }) {
  const summary = useMemo(() => {
    const today = eventsOnDay(events, now)
    const stats = weekStats(events, now, { focusTargetHours: settings.focusTargetHours, now })
    const gaps = freeSlots(events, now, {
      workStartHour: settings.workStartHour,
      workEndHour: settings.workEndHour,
      minMinutes: 45,
      now,
    })
    return {
      today,
      next: nextUpcoming(events, now),
      stats,
      freeMinutes: gaps.reduce((n, g) => n + g.minutes, 0),
      method: getMethod(settings.activeMethod),
    }
  }, [events, settings, now])

  const rows = [
    { label: "Today's events", value: `${summary.today.length}` },
    {
      label: 'Next up',
      value: summary.next ? `${fmtTimeShort(summary.next.start)}` : '—',
      hint: summary.next?.title,
    },
    { label: 'Free left today', value: humanDuration(summary.freeMinutes) },
    { label: 'Week score', value: `${summary.stats.score}` },
    { label: 'Focus logged', value: `${summary.stats.focusHours}h` },
  ]

  return (
    <Card className="hidden h-fit flex-col p-5 xl:flex">
      <p className="eyebrow">What Sage can see</p>

      <div className="mt-4 space-y-3">
        {rows.map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-3">
            <span className="text-xs font-semibold text-muted">{row.label}</span>
            <span className="text-right">
              <span className="font-mono text-sm font-semibold tabular-nums text-ink">
                {row.value}
              </span>
              {row.hint ? (
                <span className="block max-w-[130px] truncate text-[10px] font-semibold text-faint">
                  {row.hint}
                </span>
              ) : null}
            </span>
          </div>
        ))}
      </div>

      {summary.method ? (
        <div className="surface-inset mt-5 rounded-xl p-3.5">
          <p className="eyebrow">Planning method</p>
          <p className="mt-1.5 text-sm font-semibold text-ink">{summary.method.name}</p>
          <p className="mt-1 text-[11px] font-medium leading-relaxed text-muted">
            {summary.method.tagline}
          </p>
          <p className="mt-2 text-[10.5px] font-semibold text-accent">
            Default block · {humanDuration(summary.method.defaultBlock)}
          </p>
        </div>
      ) : null}

      <p className="mt-5 text-[11px] leading-relaxed text-faint">
        Suggestions are shaped by your active method and your {settings.workStartHour}:00–
        {settings.workEndHour}:00 working window.
      </p>
    </Card>
  )
}

export default AssistantPage
