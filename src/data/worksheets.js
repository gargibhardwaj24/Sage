export const WORKSHEETS = {
  'time-boxing': {
    kind: 'timebox',
    scope: 'day',
    methodId: 'time-boxing',
    title: 'Timebox',
    cta: 'Open the timebox sheet',
    intro:
      'Name the three things that have to move today, then give every half hour a job. Saving turns the filled rows into real calendar blocks on the date above.',
    startHour: 5,
    endHour: 22,
    slotMinutes: 30,
    priorities: [
      { id: 'p1', label: 'P1', categoryId: 'deep-work' },
      { id: 'p2', label: 'P2', categoryId: 'deep-work' },
      { id: 'p3', label: 'P3', categoryId: 'learning' },
    ],
    defaultCategory: 'admin',
  },

  'time-blocking': {
    kind: 'rows',
    scope: 'day',
    methodId: 'time-blocking',
    title: 'Day plan',
    cta: 'Open the day plan',
    intro:
      'Every working hour gets a named block, sized to the work rather than to a grid. Leave one buffer — the day will need it.',
    noteLabel: 'Outcome',
    notePlaceholder: 'What has to be true when this block ends?',
    addLabel: 'Add a block',
    titlePlaceholder: 'Name this block',
    rows: [
      { title: '', categoryId: 'deep-work', start: '09:00', minutes: 120 },
      { title: '', categoryId: 'admin', start: '11:15', minutes: 45 },
      { title: '', categoryId: 'personal', start: '12:30', minutes: 60 },
      { title: '', categoryId: 'learning', start: '13:45', minutes: 90 },
      { title: '', categoryId: 'meeting', start: '15:30', minutes: 60 },
      { title: 'Buffer & shutdown', categoryId: 'admin', start: '17:00', minutes: 45 },
    ],
  },

  'deep-work': {
    kind: 'rows',
    scope: 'day',
    methodId: 'deep-work',
    title: 'Deep work plan',
    cta: 'Open the deep work plan',
    intro:
      'One or two protected blocks, each with a definition of done written before you start. Shallow work gets batched, and the day gets closed deliberately.',
    noteLabel: 'Definition of done',
    notePlaceholder: 'Finish this sentence: this block worked if…',
    addLabel: 'Add a block',
    titlePlaceholder: 'Name this block',
    rows: [
      { title: 'Deep work · primary', categoryId: 'deep-work', start: '08:30', minutes: 120 },
      { title: 'Shallow batch', categoryId: 'admin', start: '11:00', minutes: 30 },
      { title: 'Deep work · secondary', categoryId: 'deep-work', start: '14:00', minutes: 90 },
      { title: 'Shutdown ritual', categoryId: 'personal', start: '17:30', minutes: 20 },
    ],
  },

  'task-batching': {
    kind: 'rows',
    scope: 'day',
    methodId: 'task-batching',
    title: 'Batch sheet',
    cta: 'Open the batch sheet',
    intro:
      'Group the small stuff by the context it shares, then give each group one slot. Everything inside a batch rides along with it.',
    noteLabel: "What's in this batch",
    notePlaceholder: 'One task per line.',
    addLabel: 'Add a batch',
    titlePlaceholder: 'Name this batch',
    rows: [
      { title: 'Inbox & replies', categoryId: 'admin', start: '11:15', minutes: 45 },
      { title: 'Calls & follow-ups', categoryId: 'meeting', start: '15:30', minutes: 45 },
      { title: 'Errands & small admin', categoryId: 'admin', start: '17:00', minutes: 30 },
    ],
  },

  'day-theming': {
    kind: 'themes',
    scope: 'week',
    methodId: 'day-theming',
    title: 'Week themes',
    cta: 'Open the week themes sheet',
    intro:
      'One theme per day, for the week containing the date above. Leave a day blank and nothing is scheduled for it.',
    rows: [
      { day: 0, title: 'Deep work', categoryId: 'deep-work', start: '09:00', minutes: 240 },
      { day: 1, title: 'Meetings & people', categoryId: 'meeting', start: '09:00', minutes: 240 },
      { day: 2, title: 'Deep work', categoryId: 'deep-work', start: '09:00', minutes: 240 },
      { day: 3, title: 'Learning', categoryId: 'learning', start: '09:00', minutes: 240 },
      { day: 4, title: 'Admin & buffer', categoryId: 'admin', start: '09:00', minutes: 240 },
      { day: 5, title: '', categoryId: 'personal', start: '10:00', minutes: 180 },
      { day: 6, title: '', categoryId: 'personal', start: '10:00', minutes: 180 },
    ],
  },

  'eat-the-frog': {
    kind: 'frog',
    scope: 'day',
    methodId: 'eat-the-frog',
    title: 'Tomorrow’s frog',
    cta: 'Open the frog card',
    intro:
      'One frog. Name it, admit why you are avoiding it, and decide the first physical action — then it goes first, before anything can negotiate with you.',
    start: '08:30',
    minutes: 90,
    categoryId: 'deep-work',
    reward: { title: 'Reward & reset', categoryId: 'personal', minutes: 30 },
  },

  eisenhower: {
    kind: 'matrix',
    scope: 'day',
    methodId: 'eisenhower',
    title: 'The matrix',
    cta: 'Open the matrix',
    intro:
      'Sort everything open into four quadrants. Saving schedules Q1 into today’s free slots, spreads Q2 across the days ahead, batches Q3 into one window — and never schedules Q4.',
    spreadDays: 7,
    quadrants: [
      {
        id: 'q1',
        label: 'Q1 · Urgent + important',
        action: 'Do it now',
        hint: 'Fires that genuinely matter.',
        categoryId: 'deep-work',
        minutes: 60,
        mode: 'today',
      },
      {
        id: 'q2',
        label: 'Q2 · Important, not urgent',
        action: 'Schedule it',
        hint: 'The compounding work. Give it your best hours.',
        categoryId: 'deep-work',
        minutes: 90,
        mode: 'spread',
      },
      {
        id: 'q3',
        label: 'Q3 · Urgent, not important',
        action: 'Batch it',
        hint: 'Urgent to somebody else.',
        categoryId: 'admin',
        minutes: 45,
        mode: 'batch',
        batchTitle: 'Q3 batch',
      },
      {
        id: 'q4',
        label: 'Q4 · Neither',
        action: 'Delete it',
        hint: 'Written down so you can stop carrying it.',
        mode: 'drop',
      },
    ],
  },
}

export const getWorksheet = (methodId) => WORKSHEETS[methodId] ?? null

export const hasWorksheet = (methodId) => Boolean(WORKSHEETS[methodId])
