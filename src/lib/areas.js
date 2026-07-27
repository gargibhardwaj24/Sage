import { BUILT_IN_CATEGORIES } from '@/data/categories'
import { isValidHex } from '@/lib/color'

export const AREA_NAME_MAX = 32

export function validateArea({ name, hex, existing = [] }) {
  const trimmed = (name ?? '').trim()

  if (!trimmed) return 'Give the area a name.'
  if (trimmed.length > AREA_NAME_MAX) return `Keep it under ${AREA_NAME_MAX} characters.`
  if (!isValidHex(hex)) return 'Pick a valid colour.'

  const taken = [...BUILT_IN_CATEGORIES, ...existing].some(
    (c) => c.name.trim().toLowerCase() === trimmed.toLowerCase()
  )
  if (taken) return 'An area with that name already exists.'

  return null
}
