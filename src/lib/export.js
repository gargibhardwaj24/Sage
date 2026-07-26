import { durationMinutes, format, toDate } from '@/lib/date'
import { getCategory } from '@/data/categories'

const escape = (value) => {
  const s = String(value ?? '')
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function eventsToCsv(events) {
  const header = [
    'Title',
    'Category',
    'Date',
    'Start',
    'End',
    'Duration (min)',
    'Completed',
    'Source',
    'Notes',
  ]

  const rows = [...events]
    .sort((a, b) => a.start.localeCompare(b.start))
    .map((e) => [
      e.title,
      getCategory(e.categoryId).name,
      format(toDate(e.start), 'yyyy-MM-dd'),
      format(toDate(e.start), 'HH:mm'),
      format(toDate(e.end), 'HH:mm'),
      durationMinutes(e.start, e.end),
      e.completed ? 'yes' : 'no',
      e.source ?? 'user',
      e.notes ?? '',
    ])

  return [header, ...rows].map((r) => r.map(escape).join(',')).join('\n')
}

export function downloadCsv(filename, csv) {
  const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
