import { addDays, atTime, addMinutes } from '@/lib/date'

const WEEKDAYS = [0, 1, 2, 3, 4]

function block(weekStart, dayOffset, hour, minute, minutes, title, categoryId, extra = {}) {
  const start = atTime(addDays(weekStart, dayOffset), hour, minute)
  return {
    title,
    categoryId,
    start,
    end: addMinutes(start, minutes),
    source: 'template',
    ...extra,
  }
}

export const METHODS = [
  {
    id: 'time-blocking',
    name: 'Time Blocking',
    tagline: 'Give every hour a job before the day starts.',
    accent: '#6f4ae8',
    icon: 'LayoutGrid',
    difficulty: 'Intermediate',
    theme: 'Structure',
    benefits: ['Visible structure', 'Fewer context switches'],
    defaultBlock: 90,
    guidance:
      'Assign every working hour to a named block. Prefer contiguous blocks over scattered ones; leave one flexible buffer per day.',
    bestFor: 'People whose days get eaten by whatever shouts loudest.',
    principles: [
      'A task without a slot is a wish, not a plan.',
      'Batch similar work so you switch context as rarely as possible.',
      'Leave one deliberate buffer block — the day will need it.',
    ],
    steps: [
      'List everything that must happen this week.',
      'Drop each item onto the calendar as a named block.',
      'Colour-code by category so the shape of your week is visible at a glance.',
      'Reconcile at day end: move what slipped rather than deleting it.',
    ],
    watchOut: 'Over-packing. If there is no white space, the first delay collapses the whole day.',
    buildWeek: (ws) =>
      WEEKDAYS.flatMap((d) => [
        block(ws, d, 9, 0, 120, 'Deep work block', 'deep-work', {
          notes: 'Phone in another room. One outcome only.',
        }),
        block(ws, d, 11, 15, 45, 'Inbox & admin batch', 'admin'),
        block(ws, d, 12, 30, 60, 'Lunch & reset', 'personal'),
        block(ws, d, 13, 45, 90, 'Learning block', 'learning'),
        block(ws, d, 15, 30, 60, 'Collaboration window', 'meeting', {
          notes: 'The only slot where meetings are allowed to land.',
        }),
        block(ws, d, 17, 0, 45, 'Buffer & shutdown', 'admin', {
          notes: 'Absorb overflow, then plan tomorrow.',
        }),
      ]),
  },
  {
    id: 'time-boxing',
    name: 'Time Boxing',
    tagline: 'Fixed box, hard stop. Done beats perfect.',
    accent: '#eb6834',
    icon: 'TimerReset',
    difficulty: 'Intermediate',
    theme: 'Structure',
    benefits: ['Forces scope decisions', 'Kills perfectionism'],
    defaultBlock: 45,
    guidance:
      'Every task gets a fixed-length box with a hard stop. Prefer 45-minute boxes; when the box ends, the task ends.',
    bestFor: 'Perfectionists and anyone whose 30-minute task takes three hours.',
    principles: [
      'The box is the constraint, not the task.',
      'A hard stop forces scope decisions you would otherwise avoid.',
      'Unfinished work rolls into a *new* box tomorrow — it never extends today.',
    ],
    steps: [
      'Estimate the task, then box it at roughly that estimate.',
      'Start a visible timer.',
      'Stop when the box ends, finished or not.',
      'Review: was the estimate wrong, or the scope?',
    ],
    watchOut: 'Boxing creative work too tightly. Discovery needs slack; execution does not.',
    buildWeek: (ws) =>
      WEEKDAYS.flatMap((d) => [
        block(ws, d, 9, 0, 45, 'Box 1 · Priority task', 'deep-work', { notes: 'Hard stop at 9:45.' }),
        block(ws, d, 10, 0, 45, 'Box 2 · Priority task', 'deep-work', { notes: 'Hard stop at 10:45.' }),
        block(ws, d, 11, 0, 30, 'Box 3 · Admin sweep', 'admin', { notes: 'Hard stop at 11:30.' }),
        block(ws, d, 14, 0, 45, 'Box 4 · Skill practice', 'learning', { notes: 'Hard stop at 14:45.' }),
        block(ws, d, 16, 0, 30, 'Estimate review', 'admin', {
          notes: 'Which boxes overran, and why?',
        }),
      ]),
  },
  {
    id: 'pomodoro',
    name: 'Pomodoro',
    tagline: '25 on, 5 off. Repeat four times, then rest properly.',
    accent: '#e87ba4',
    icon: 'Timer',
    difficulty: 'Beginner',
    theme: 'Focus',
    benefits: ['Easy to start', 'Prevents burnout'],
    defaultBlock: 25,
    guidance:
      'Schedule work in 25-minute pomodoros separated by 5-minute breaks, with a 20-minute break after every fourth. Never schedule a pomodoro longer than 25 minutes.',
    bestFor: 'Starting is the hard part, or focus that fades after twenty minutes.',
    principles: [
      'The timer, not your willpower, decides when you stop.',
      'A break is part of the technique — skipping it defeats it.',
      'Interruptions get written down, not acted on.',
    ],
    steps: [
      'Pick one task and start a 25-minute timer.',
      'Work until it rings. No tab-switching.',
      'Take 5 minutes away from the screen.',
      'After four rounds, take a proper 20-minute break.',
    ],
    watchOut: 'Work that needs a long ramp-up — 25 minutes can end just as you get going.',
    buildWeek: (ws) =>
      WEEKDAYS.flatMap((d) => {
        const out = []
        let cursor = { h: 9, m: 0 }
        for (let i = 1; i <= 4; i += 1) {
          out.push(
            block(ws, d, cursor.h, cursor.m, 25, `Pomodoro ${i}`, i <= 2 ? 'deep-work' : 'learning', {
              notes: 'One task. Timer visible.',
            })
          )
          const total = cursor.h * 60 + cursor.m + 25
          const breakMin = i === 4 ? 20 : 5
          out.push(
            block(ws, d, Math.floor(total / 60), total % 60, breakMin, i === 4 ? 'Long break' : 'Break', 'personal')
          )
          const next = total + breakMin
          cursor = { h: Math.floor(next / 60), m: next % 60 }
        }
        return out
      }),
  },
  {
    id: 'deep-work',
    name: 'Deep Work',
    tagline: 'Two protected hours beat eight distracted ones.',
    accent: '#2a78d6',
    icon: 'Brain',
    difficulty: 'Advanced',
    theme: 'Focus',
    benefits: ['Peak-quality output', 'Trains attention'],
    defaultBlock: 120,
    guidance:
      'Protect one or two uninterrupted 90–120 minute blocks per day, scheduled in the morning before meetings. Never fragment them.',
    bestFor: 'Work whose value comes from depth: writing, systems, hard problems.',
    principles: [
      'Depth is a skill that atrophies. Train it daily.',
      'Shallow work expands to fill whatever space you leave it.',
      'A shutdown ritual is what makes the next deep block possible.',
    ],
    steps: [
      'Reserve the same block every day — ritual beats motivation.',
      'Remove the exits: no inbox, no phone, no notifications.',
      'Define "done" before you start.',
      'Close the day deliberately so work stops following you home.',
    ],
    watchOut: 'Scheduling depth after a meeting-heavy morning. Attention is a morning resource.',
    buildWeek: (ws) =>
      WEEKDAYS.flatMap((d) => [
        block(ws, d, 8, 30, 120, 'Deep work · primary', 'deep-work', {
          notes: 'No meetings before this ends. Define "done" first.',
        }),
        block(ws, d, 11, 0, 30, 'Shallow batch', 'admin', { notes: 'Inbox, Slack, approvals — all at once.' }),
        block(ws, d, 14, 0, 90, 'Deep work · secondary', 'deep-work'),
        block(ws, d, 17, 30, 20, 'Shutdown ritual', 'personal', {
          notes: 'Review, plan tomorrow, say the shutdown phrase, stop.',
        }),
      ]),
  },
  {
    id: 'day-theming',
    name: 'Day Theming',
    tagline: 'One day, one job. Monday is Monday all day.',
    accent: '#00875c',
    icon: 'CalendarRange',
    difficulty: 'Advanced',
    theme: 'Structure',
    benefits: ['Almost no context switching', 'A week with a shape'],
    defaultBlock: 240,
    guidance:
      'Give each weekday a single theme and keep all work of that kind inside its own day. Never split a theme across two days.',
    bestFor: 'Anyone wearing several hats — founders, freelancers, four job titles.',
    principles: [
      'A theme is a promise about what today is not for.',
      'Switching costs more between kinds of work than between tasks.',
      'Emergencies get one buffer day, not a slice of every day.',
    ],
    steps: [
      'List the recurring kinds of work you do.',
      'Group them into five themes or fewer.',
      'Give each theme a weekday, and defend it.',
      'Anything that lands off-theme goes to its day, not to now.',
    ],
    watchOut:
      'Themes that depend on each other. If Tuesday is blocked until Monday finishes, the week stalls for a week.',
    buildWeek: (ws) => [
      block(ws, 0, 9, 0, 240, 'Theme · Deep work', 'deep-work', {
        notes: 'Everything that needs depth lands today.',
      }),
      block(ws, 1, 9, 0, 240, 'Theme · Meetings & people', 'meeting', {
        notes: 'The only day calls are allowed to land.',
      }),
      block(ws, 2, 9, 0, 240, 'Theme · Deep work', 'deep-work'),
      block(ws, 3, 9, 0, 240, 'Theme · Learning', 'learning'),
      block(ws, 4, 9, 0, 240, 'Theme · Admin & buffer', 'admin', {
        notes: 'Absorb whatever the week overflowed.',
      }),
      ...WEEKDAYS.map((d) => block(ws, d, 13, 30, 60, 'Lunch & reset', 'personal')),
    ],
  },
  {
    id: 'task-batching',
    name: 'Task Batching',
    tagline: 'Do all the same-shaped things at once.',
    accent: '#5b6b7f',
    icon: 'Layers',
    difficulty: 'Beginner',
    theme: 'Focus',
    benefits: ['Cuts switching cost', 'Small tasks stop leaking'],
    defaultBlock: 45,
    guidance:
      'Group similar small tasks into one named batch and give the batch a single slot. Never schedule a batched task on its own.',
    bestFor: 'Death by a thousand five-minute tasks.',
    principles: [
      'The cost is not the task, it is the switch into it.',
      'A batch is defined by shared context, not shared urgency.',
      'If a batch will not fit its slot, it is two batches.',
    ],
    steps: [
      'Collect the week’s small tasks into one list.',
      'Group them by shared context — same tool, same headspace, same people.',
      'Give each batch exactly one slot.',
      'Let anything new join a batch instead of interrupting.',
    ],
    watchOut:
      'Batching something genuinely urgent. A batch delays every item in it until the batch runs.',
    buildWeek: (ws) => [
      ...WEEKDAYS.map((d) =>
        block(ws, d, 11, 15, 45, 'Batch · Inbox & replies', 'admin', {
          notes: 'Every message, once a day.',
        })
      ),
      ...[1, 3].map((d) => block(ws, d, 15, 30, 45, 'Batch · Calls & follow-ups', 'meeting')),
      ...WEEKDAYS.map((d) => block(ws, d, 17, 0, 30, 'Batch · Small admin', 'admin')),
      block(ws, 4, 16, 0, 30, 'Batch review', 'admin', {
        notes: 'Which batch overflowed, and why?',
      }),
    ],
  },
  {
    id: 'eisenhower',
    name: 'Eisenhower Matrix',
    tagline: 'Urgent and important are not the same word.',
    accent: '#eda100',
    icon: 'Grid2x2',
    difficulty: 'Intermediate',
    theme: 'Priority',
    benefits: ['Separates urgent from important', 'Protects compounding work'],
    defaultBlock: 60,
    guidance:
      'Sort work into four quadrants. Do Q1 first, protect generous time for Q2, batch Q3 into one window, and delete Q4.',
    bestFor: 'Busy weeks that somehow move nothing forward.',
    principles: [
      'Q1 urgent + important → do it now.',
      'Q2 important, not urgent → schedule it, and defend it.',
      'Q3 urgent, not important → batch or delegate it.',
      'Q4 neither → delete it without guilt.',
    ],
    steps: [
      'Dump every open item into one list.',
      'Tag each with a quadrant — be honest about Q1 vs Q3.',
      'Give Q2 the best hours of your week.',
      'Re-sort weekly; quadrants drift.',
    ],
    watchOut: 'Living in Q1. Constant firefighting usually means Q2 was skipped last month.',
    buildWeek: (ws) => [
      ...WEEKDAYS.map((d) =>
        block(ws, d, 9, 0, 60, 'Q1 · Urgent + important', 'deep-work', {
          priority: 'q1',
          notes: 'Fires that genuinely matter. Do them first, then stop.',
        })
      ),
      ...WEEKDAYS.map((d) =>
        block(ws, d, 10, 30, 90, 'Q2 · Important, not urgent', 'deep-work', {
          priority: 'q2',
          notes: 'The compounding work. This block is non-negotiable.',
        })
      ),
      ...WEEKDAYS.map((d) =>
        block(ws, d, 15, 0, 45, 'Q3 · Batch & delegate', 'admin', {
          priority: 'q3',
          notes: 'Urgent to someone else. Batch it, delegate it, or timebox it.',
        })
      ),
      block(ws, 4, 16, 30, 45, 'Weekly quadrant review', 'admin', {
        priority: 'q2',
        notes: 'Re-sort the list. What crept from Q2 into Q1?',
      }),
    ],
  },
  {
    id: 'eat-the-frog',
    name: 'Eat the Frog',
    tagline: 'Do the thing you are avoiding, first.',
    accent: '#e34948',
    icon: 'CheckSquare',
    difficulty: 'Beginner',
    theme: 'Energy',
    benefits: ['Beats procrastination', 'Uses peak willpower'],
    defaultBlock: 90,
    guidance:
      'Place the single hardest, most-avoided task first thing in the morning, before email and before meetings.',
    bestFor: 'Chronic procrastination on one specific dreaded task.',
    principles: [
      'Willpower is highest before the day starts negotiating with you.',
      'One frog per day. Two frogs is a to-do list, not a strategy.',
      'Choose the frog the night before, so morning-you has no say.',
    ],
    steps: [
      'Each evening, name tomorrow’s frog in one sentence.',
      'Protect the first 90 minutes for it.',
      'No inbox, no news, no "quick" anything before it.',
      'Everything after the frog is downhill.',
    ],
    watchOut: 'Picking a frog that is really five frogs. If it needs a plan, planning it *is* the frog.',
    buildWeek: (ws) => [
      ...WEEKDAYS.map((d) =>
        block(ws, d, 8, 30, 90, '🐸 Eat the frog', 'deep-work', {
          notes: 'The task you would most like to postpone. Named last night.',
        })
      ),
      ...WEEKDAYS.map((d) => block(ws, d, 10, 15, 30, 'Reward & reset', 'personal')),
      ...WEEKDAYS.map((d) => block(ws, d, 11, 0, 60, 'Everything else', 'admin')),
      block(ws, 6, 10, 0, 30, 'Name next week’s frogs', 'admin', {
        notes: 'Five sentences. One per weekday.',
      }),
    ],
  },
]

export const METHOD_MAP = Object.fromEntries(METHODS.map((m) => [m.id, m]))

export const getMethod = (id) => METHOD_MAP[id] ?? null
