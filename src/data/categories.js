import { lighten, readableInk, isValidHex } from '@/lib/color'

export const BUILT_IN_CATEGORIES = [
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
    id: 'holiday',
    name: 'Holiday',
    short: 'Holiday',
    focus: false,
    hex: '#0ea5e9',
    darkHex: '#38bdf8',
    textLight: '#0369a1',
    textDark: '#bae6fd',
    blurb: 'Public holidays, festivals and observances.',
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

export const DEFAULT_CATEGORY = 'deep-work'
export const HOLIDAY_CATEGORY = 'holiday'

const LIGHT_SURFACE = '#ffffff'
const DARK_SURFACE = '#12131a'

export const slugify = (name) =>
  name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24)

export const shortLabel = (name) => {
  const first = name.trim().split(/\s+/)[0] ?? ''
  return (first || 'Area').slice(0, 8)
}

export function buildCustomCategory({ id, name, hex, short, focus = false, blurb = '' }) {
  const label = (name ?? '').trim() || 'Untitled area'
  const base = isValidHex(hex) ? hex.trim().toLowerCase() : '#6f4ae8'
  const darkHex = lighten(base, 0.12)

  return {
    id: id ?? `area-${slugify(label) || 'untitled'}-${Math.random().toString(36).slice(2, 7)}`,
    name: label,
    short: (short ?? shortLabel(label)).trim() || 'Area',
    focus: Boolean(focus),
    hex: base,
    darkHex,
    textLight: readableInk(base, LIGHT_SURFACE, 4.5),
    textDark: readableInk(darkHex, DARK_SURFACE, 4.5),
    blurb: blurb || 'A custom area you created.',
    custom: true,
  }
}

const BUILT_IN_IDS = new Set(BUILT_IN_CATEGORIES.map((c) => c.id))

export function normalizeCustomCategories(list) {
  if (!Array.isArray(list)) return []
  const seen = new Set()
  const out = []

  for (const raw of list) {
    if (!raw || typeof raw !== 'object') continue
    if (!raw.name || typeof raw.name !== 'string') continue
    const built = buildCustomCategory(raw)
    if (BUILT_IN_IDS.has(built.id) || seen.has(built.id)) continue
    seen.add(built.id)
    out.push(built)
  }

  return out
}

let customCategories = []
let allCategories = BUILT_IN_CATEGORIES
let categoryMap = Object.fromEntries(BUILT_IN_CATEGORIES.map((c) => [c.id, c]))
const listeners = new Set()

const rebuild = () => {
  allCategories = [...BUILT_IN_CATEGORIES, ...customCategories]
  categoryMap = Object.fromEntries(allCategories.map((c) => [c.id, c]))
}

const sameIdentity = (a, b) =>
  a.length === b.length &&
  a.every((c, i) => c.id === b[i].id && c.name === b[i].name && c.hex === b[i].hex && c.focus === b[i].focus)

export function setCustomCategories(list) {
  const next = normalizeCustomCategories(list)
  if (sameIdentity(next, customCategories)) return false
  customCategories = next
  rebuild()
  for (const fn of listeners) fn()
  return true
}

export function subscribeCategories(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export const getAllCategories = () => allCategories
export const getCustomCategories = () => customCategories

export function getCategory(id) {
  return categoryMap[id] ?? categoryMap[DEFAULT_CATEGORY]
}

export const isKnownCategory = (id) => Boolean(categoryMap[id])

export function categoryHex(id, isDark) {
  const c = getCategory(id)
  return isDark ? c.darkHex : c.hex
}

export function categoryInk(id, isDark) {
  const c = getCategory(id)
  return isDark ? c.textDark : c.textLight
}

export const getFocusCategories = () => allCategories.filter((c) => c.focus).map((c) => c.id)

export const isFocusCategory = (id) => Boolean(getCategory(id)?.focus)

export const ACCENT = { light: '#00875c', dark: '#4edea3' }

export const AREA_SWATCHES = [
  '#e34948',
  '#eb6834',
  '#eda100',
  '#3f9d54',
  '#00875c',
  '#0ea5e9',
  '#2a78d6',
  '#6f4ae8',
  '#a855f7',
  '#e87ba4',
  '#7c5e48',
  '#5b6b7f',
]
