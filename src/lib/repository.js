import { supabase } from '@/lib/supabase'
import { iso, toDate } from '@/lib/date'

const COLUMNS =
  'id, title, notes, category_id, starts_at, ends_at, completed, reminder_minutes, priority, method, source, created_at'

export function rowToEvent(row) {
  return {
    id: row.id,
    title: row.title,
    notes: row.notes ?? '',
    categoryId: row.category_id,
    start: iso(toDate(row.starts_at)),
    end: iso(toDate(row.ends_at)),
    completed: row.completed,
    reminderMinutes: row.reminder_minutes,
    priority: row.priority,
    method: row.method,
    source: row.source,
    createdAt: row.created_at,
  }
}

export function eventToRow(event, userId) {
  return {
    id: event.id,
    user_id: userId,
    title: event.title,
    notes: event.notes ?? '',
    category_id: event.categoryId,
    starts_at: iso(toDate(event.start)),
    ends_at: iso(toDate(event.end)),
    completed: Boolean(event.completed),
    reminder_minutes: event.reminderMinutes ?? null,
    priority: event.priority ?? null,
    method: event.method ?? null,
    source: event.source ?? 'user',
  }
}

const isUuid = (value) =>
  typeof value === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)

const withFreshId = (row) => {
  if (isUuid(row.id)) return row
  const { id, ...rest } = row
  return rest
}

const PAGE_SIZE = 1000

export async function fetchEvents(userId) {
  const rows = []

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from('events')
      .select(COLUMNS)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('starts_at', { ascending: true })
      .range(from, from + PAGE_SIZE - 1)

    if (error) throw error
    rows.push(...data)
    if (data.length < PAGE_SIZE) break
  }

  return rows.map(rowToEvent)
}

export async function insertEvents(events, userId) {
  const rows = events.map((e) => withFreshId(eventToRow(e, userId)))
  const { data, error } = await supabase.from('events').insert(rows).select(COLUMNS)
  if (error) throw error
  return data.map(rowToEvent)
}

export async function upsertEvents(events, userId) {
  const rows = events.map((e) => eventToRow(e, userId)).filter((r) => isUuid(r.id))
  if (!rows.length) return []

  const { data, error } = await supabase
    .from('events')
    .upsert(rows, { onConflict: 'id' })
    .select(COLUMNS)

  if (error) throw error
  return data.map(rowToEvent)
}

export async function updateEvent(id, patch, userId) {
  const row = eventToRow({ ...patch, id }, userId)
  delete row.id
  delete row.user_id

  const { data, error } = await supabase
    .from('events')
    .update(row)
    .eq('id', id)
    .eq('user_id', userId)
    .select(COLUMNS)
    .single()

  if (error) throw error
  return rowToEvent(data)
}

export async function setCompleted(id, completed, userId) {
  const { data, error } = await supabase
    .from('events')
    .update({ completed })
    .eq('id', id)
    .eq('user_id', userId)
    .select(COLUMNS)
    .single()

  if (error) throw error
  return rowToEvent(data)
}

const ID_BATCH = 200

const chunk = (list, size) => {
  const out = []
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size))
  return out
}

export async function softDeleteEvents(ids, userId) {
  if (!ids.length) return
  const stamp = new Date().toISOString()
  for (const batch of chunk(ids, ID_BATCH)) {
    const { error } = await supabase
      .from('events')
      .update({ deleted_at: stamp })
      .in('id', batch)
      .eq('user_id', userId)
    if (error) throw error
  }
}

export async function hardDeleteAllEvents(userId) {
  const { error } = await supabase.from('events').delete().eq('user_id', userId)
  if (error) throw error
}

export async function restoreEvents(ids, userId) {
  if (!ids.length) return
  for (const batch of chunk(ids, ID_BATCH)) {
    const { error } = await supabase
      .from('events')
      .update({ deleted_at: null })
      .in('id', batch)
      .eq('user_id', userId)
    if (error) throw error
  }
}

export async function findOverlapping(start, end, excludeId = null) {
  const { data, error } = await supabase.rpc('overlapping_events', {
    window_start: iso(toDate(start)),
    window_end: iso(toDate(end)),
    exclude_id: excludeId,
  })

  if (error) throw error
  return data.map(rowToEvent)
}

export async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, settings, seeded_at')
    .eq('id', userId)
    .single()

  if (error) throw error
  return data
}

export async function saveSettings(userId, settings, displayName) {
  const patch = { settings }
  if (displayName) patch.display_name = displayName

  const { error } = await supabase.from('profiles').update(patch).eq('id', userId)
  if (error) throw error
}

export async function markSeeded(userId) {
  const { error } = await supabase
    .from('profiles')
    .update({ seeded_at: new Date().toISOString() })
    .eq('id', userId)

  if (error) throw error
}
