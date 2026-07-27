const clean = (value) => (typeof value === 'string' ? value.trim() : '')

export const emailLocalPart = (email) => clean(email).split('@')[0] ?? ''

export function fullNameFromUser(user) {
  const meta = user?.user_metadata ?? {}

  const named = [meta.full_name, meta.name, meta.display_name]
    .map(clean)
    .find((v) => v.length > 0)

  if (named) return named

  const given = clean(meta.given_name)
  const family = clean(meta.family_name)
  if (given || family) return [given, family].filter(Boolean).join(' ')

  return ''
}

export const firstNameOf = (value) => clean(value).split(/\s+/)[0] ?? ''

export function nameFromEmail(email) {
  const local = emailLocalPart(email)
  if (!local) return ''

  const token = local.split(/[._+-]+/).filter(Boolean)[0] ?? local
  const stripped = token.replace(/\d+$/, '') || token
  return stripped.charAt(0).toUpperCase() + stripped.slice(1)
}

export function isEmailDerived(displayName, email) {
  const name = clean(displayName).toLowerCase()
  if (!name) return false
  const local = emailLocalPart(email).toLowerCase()
  return Boolean(local) && name === local
}

export function resolveDisplayName(user, profile) {
  const fromProvider = fullNameFromUser(user)
  if (fromProvider) return firstNameOf(fromProvider)

  const stored = clean(profile?.display_name)
  if (stored && stored !== 'there' && !isEmailDerived(stored, user?.email)) {
    return firstNameOf(stored)
  }

  return nameFromEmail(user?.email)
}
