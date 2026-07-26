export const CATEGORIES = [
  {
    id: 'meeting',
    name: 'Meetings',
    short: 'Sync',
    focus: false,
    hex: '#e34948',
    darkHex: '#e66767',
    textLight: '#a32b2b',
    textDark: '#ffb3b3',
    blurb: 'Calls, standups, anything with other people in it.',
  },
  {
    id: 'deep-work',
    name: 'Deep Work',
    short: 'Focus',
    focus: true,
    hex: '#6f4ae8',
    darkHex: '#8f77f0',
    textLight: '#4b2bb5',
    textDark: '#c3b5ff',
    blurb: 'Uninterrupted, cognitively demanding work.',
  },
  {
    id: 'fitness',
    name: 'Fitness',
    short: 'Body',
    focus: false,
    hex: '#eb6834',
    darkHex: '#e0602f',
    textLight: '#a13d16',
    textDark: '#ffa383',
    blurb: 'Training, movement, recovery.',
  },
  {
    id: 'learning',
    name: 'Learning',
    short: 'Learn',
    focus: true,
    hex: '#2a78d6',
    darkHex: '#3987e5',
    textLight: '#1a5091',
    textDark: '#93c0f5',
    blurb: 'Courses, reading, deliberate practice.',
  },
  {
    id: 'personal',
    name: 'Personal',
    short: 'Life',
    focus: false,
    hex: '#e87ba4',
    darkHex: '#d55181',
    textLight: '#a63c65',
    textDark: '#f0a6c3',
    blurb: 'Family, friends, rest, everything that refuels you.',
  },
  {
    id: 'admin',
    name: 'Admin',
    short: 'Admin',
    focus: false,
    hex: '#eda100',
    darkHex: '#c98500',
    textLight: '#8a5c00',
    textDark: '#ecc25e',
    blurb: 'Email, errands, the small stuff that piles up.',
  },
]

export const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]))

export const DEFAULT_CATEGORY = 'deep-work'

export function getCategory(id) {
  return CATEGORY_MAP[id] ?? CATEGORY_MAP[DEFAULT_CATEGORY]
}

export function categoryHex(id, isDark) {
  const c = getCategory(id)
  return isDark ? c.darkHex : c.hex
}

export function categoryInk(id, isDark) {
  const c = getCategory(id)
  return isDark ? c.textDark : c.textLight
}

export const FOCUS_CATEGORIES = CATEGORIES.filter((c) => c.focus).map((c) => c.id)

export const ACCENT = { light: '#00875c', dark: '#4edea3' }
