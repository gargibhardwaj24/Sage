const TOPICS = [
  {
    id: 'procrastination',
    match: /\bprocrastinat\w*|\bputting off\b|\bavoid\w* (the )?(work|task)\b|\bcan'?t start\b|\bkeep delaying\b/,
    answer:
      'Procrastination is almost never a time-management problem — it is an emotional one. You are avoiding a feeling (boredom, ambiguity, fear of doing it badly), not the task.\n\nThree things that reliably work:\n\n**1. Shrink the first step until it is embarrassing.** Not "write the report" — "open the doc and write one bad sentence." Starting is the only hard part.\n\n**2. Name the task precisely.** Vague tasks feel infinite. "Fix the auth bug" beats "work on backend."\n\n**3. Put it first.** Willpower is highest before the day starts negotiating with you — that is the whole idea behind Eat the Frog.',
    followUps: ['Apply eat the frog to my week', 'Find me a 90 minute deep work slot'],
  },
  {
    id: 'focus',
    match: /\bfocus\b|\bconcentrat\w*|\bdistract\w*|\battention span\b|\bstay on task\b/,
    answer:
      'Focus is less about trying harder and more about removing exits.\n\n**Remove the exits.** Phone in another room — not face-down on the desk. Notifications off, not on silent. Every exit you leave open is a decision you have to keep re-making.\n\n**Work in defined blocks.** 90 minutes is roughly the ceiling for most people before quality drops. Two protected blocks beat eight distracted hours.\n\n**Define "done" before you start.** Ambiguity is what sends you to another tab.\n\n**Protect your mornings.** Attention is a morning resource for most people — spending it on email is the most expensive habit in knowledge work.',
    followUps: ['When do I focus best?', 'Apply deep work to my week'],
  },
  {
    id: 'burnout',
    match: /\bburn ?out\b|\bexhaust\w*|\boverwhelm\w*|\btoo much\b|\btired all\b|\bdrained\b/,
    answer:
      'Burnout is usually a recovery problem rather than a workload problem. The fix is rarely "do less" — it is "recover properly."\n\n**Protect the boundary.** A shutdown ritual at day end — review, plan tomorrow, close the laptop — is what stops work following you home.\n\n**Guard sleep and movement first.** They are not what you cut when things get busy; they are what makes busy survivable.\n\n**Look for the real cause.** Chronic overload, no autonomy, or unclear expectations. More discipline will not fix any of those.\n\nIf this has been going on for weeks rather than days, that is worth talking to someone about — a manager, a doctor, or both.',
    followUps: ['How balanced is my week?', 'Show my analytics'],
  },
  {
    id: 'prioritise',
    match: /\bprioriti[sz]\w*|\bwhat should i (work on|do first)\b|\btoo many (tasks|things)\b|\bwhere do i start\b/,
    answer:
      'Sort by *importance*, then by urgency — most people do it the other way around and wonder why nothing moves.\n\nThe Eisenhower split:\n\n- **Urgent + important** → do it now, then stop.\n- **Important, not urgent** → schedule it and defend it. This is the work that compounds, and the work that gets skipped.\n- **Urgent, not important** → batch it into one window, or delegate it.\n- **Neither** → delete it without guilt.\n\nIf you are constantly in the first quadrant, that is usually evidence the second one got skipped a month ago.',
    followUps: ['Apply the Eisenhower matrix to my week', "What's my week look like?"],
  },
  {
    id: 'multitasking',
    match: /\bmultitask\w*|\bswitch\w* (between|context)\b|\btoo many tabs\b|\bcontext switch\w*/,
    answer:
      'There is no multitasking, only fast switching — and every switch leaves a residue of attention on the previous task.\n\n**Batch by type, not by project.** All calls in one window, all email in one window. Similar work shares a mental mode.\n\n**One tab rule for deep work.** If a second thing is open, you are not doing the first thing.\n\n**Write interruptions down instead of acting on them.** A capture list turns a context switch into a five-second note.',
    followUps: ['Apply time blocking to my week', 'Find gaps in my week'],
  },
  {
    id: 'morning',
    match: /\bmorning routine\b|\bwake up\b|\bearly riser?\b|\b5 ?am\b|\bnight owl\b/,
    answer:
      'The specific hour matters far less than the consistency. A night owl forcing a 5 AM start usually just gets a tired 5 AM.\n\nWhat actually transfers:\n\n**Spend your first block on your own work,** not on other people\'s (email, Slack, news).\n\n**Decide the night before.** Morning-you should have no say in what happens first.\n\n**Keep the wake time consistent,** including weekends. Consistency beats earliness.',
    followUps: ['When do I focus best?', 'Apply eat the frog to my week'],
  },
  {
    id: 'meetings',
    match: /\bmeeting\w*\b.*\b(too many|reduce|fewer|cut)\b|\b(too many|fewer|cut) meetings?\b|\bmeeting overload\b/,
    answer:
      'Meetings expand to fill the calendar unless something pushes back.\n\n**Create one collaboration window.** A single daily slot where meetings are allowed to land. Everything outside it is protected.\n\n**Default to 25 and 50 minutes,** not 30 and 60. The gap is where the actual work goes.\n\n**No agenda, no meeting.** If nobody can say what decision is being made, it is a document.',
    followUps: ["How much time do meetings take?", 'Apply time blocking to my week'],
  },
  {
    id: 'habits',
    match: /\bhabit\w*|\bconsistent\w*|\bstick to\b|\bdiscipline\b|\bstreak\b.*\bbuild\b|\brouti?ne\b/,
    answer:
      'Habits are built by lowering the activation cost, not by raising motivation.\n\n**Same time, same place.** A habit anchored to a fixed slot needs no decision — which is the point.\n\n**Make the minimum version laughably small.** Ten minutes you actually do beats an hour you skip. The streak is the asset.\n\n**Never miss twice.** One missed day is noise; two is the start of a new pattern.',
    followUps: ['Show my streak', 'Show my analytics'],
  },
  {
    id: 'energy',
    match: /\benergy\b|\bafternoon slump\b|\btired after lunch\b|\bcircadian\b|\bwhen (should|do) i work\b/,
    answer:
      'Match the work to the energy rather than fighting the curve.\n\n**Peak (usually mid-morning)** → the hardest cognitive work. Never email.\n\n**Trough (early afternoon for most people)** → admin, batching, anything mechanical.\n\n**Recovery (late afternoon)** → collaboration, review, creative-but-loose work.\n\nSage tracks when you actually complete focus work — check Analytics to see your real peak rather than the one you assume you have.',
    followUps: ['When do I focus best?', 'Show my analytics'],
  },
]

export function lookupKnowledge(text) {
  const lower = String(text).toLowerCase()
  return TOPICS.find((t) => t.match.test(lower)) ?? null
}

export const CAPABILITIES = [
  {
    label: 'Check availability',
    examples: ['Am I free tonight at 8?', 'Am I busy tomorrow afternoon?'],
  },
  {
    label: 'Reschedule with conflict checks',
    examples: ['Move my DSA session from 5 PM to 8 PM', 'Push the standup an hour later'],
  },
  { label: 'Create events', examples: ['Add gym Monday at 7am for 45 minutes'] },
  { label: 'Find time', examples: ['When can I fit 90 minutes of deep work this week?'] },
  { label: 'Read your week', examples: ["What does my week look like?", "What's on today?"] },
  { label: 'Analyse and coach', examples: ['How productive was I this week?', 'How do I stop procrastinating?'] },
  { label: 'Plan with a method', examples: ['Plan my week with time blocking'] },
]
