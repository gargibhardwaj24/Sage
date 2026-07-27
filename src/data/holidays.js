const NATIONAL = 'national'
const FESTIVAL = 'festival'
const OBSERVANCE = 'observance'

export const HOLIDAYS_BY_YEAR = {
  2026: [
    { date: '2026-01-01', name: 'New Year’s Day', type: OBSERVANCE },
    { date: '2026-01-26', name: 'Republic Day', type: NATIONAL },
    { date: '2026-03-04', name: 'Holi', type: FESTIVAL },
    { date: '2026-03-21', name: 'Id-ul-Fitr', type: FESTIVAL, approximate: true },
    { date: '2026-03-26', name: 'Ram Navami', type: FESTIVAL },
    { date: '2026-03-31', name: 'Mahavir Jayanti', type: FESTIVAL },
    { date: '2026-04-03', name: 'Good Friday', type: FESTIVAL },
    { date: '2026-05-01', name: 'Buddha Purnima', type: FESTIVAL },
    { date: '2026-05-27', name: 'Id-ul-Zuha (Bakrid)', type: FESTIVAL, approximate: true },
    { date: '2026-06-26', name: 'Muharram', type: FESTIVAL, approximate: true },
    { date: '2026-08-15', name: 'Independence Day', type: NATIONAL },
    { date: '2026-08-26', name: 'Id-e-Milad', type: FESTIVAL, approximate: true },
    { date: '2026-09-04', name: 'Janmashtami', type: FESTIVAL },
    { date: '2026-10-02', name: 'Gandhi Jayanti', type: NATIONAL },
    { date: '2026-10-20', name: 'Dussehra', type: FESTIVAL },
    { date: '2026-11-08', name: 'Diwali', type: FESTIVAL },
    { date: '2026-11-24', name: 'Guru Nanak Jayanti', type: FESTIVAL },
    { date: '2026-12-25', name: 'Christmas Day', type: FESTIVAL },
  ],
  2027: [
    { date: '2027-01-01', name: 'New Year’s Day', type: OBSERVANCE },
    { date: '2027-01-26', name: 'Republic Day', type: NATIONAL },
    { date: '2027-03-10', name: 'Id-ul-Fitr', type: FESTIVAL, approximate: true },
    { date: '2027-03-23', name: 'Holi', type: FESTIVAL },
    { date: '2027-03-26', name: 'Good Friday', type: FESTIVAL },
    { date: '2027-04-15', name: 'Ram Navami', type: FESTIVAL },
    { date: '2027-04-19', name: 'Mahavir Jayanti', type: FESTIVAL },
    { date: '2027-05-17', name: 'Id-ul-Zuha (Bakrid)', type: FESTIVAL, approximate: true },
    { date: '2027-05-20', name: 'Buddha Purnima', type: FESTIVAL },
    { date: '2027-06-16', name: 'Muharram', type: FESTIVAL, approximate: true },
    { date: '2027-08-15', name: 'Independence Day', type: NATIONAL },
    { date: '2027-08-15', name: 'Milad-un-Nabi', type: FESTIVAL, approximate: true },
    { date: '2027-08-25', name: 'Janmashtami', type: FESTIVAL },
    { date: '2027-10-02', name: 'Gandhi Jayanti', type: NATIONAL },
    { date: '2027-10-09', name: 'Dussehra', type: FESTIVAL },
    { date: '2027-10-29', name: 'Diwali', type: FESTIVAL },
    { date: '2027-11-14', name: 'Guru Nanak Jayanti', type: FESTIVAL },
    { date: '2027-12-25', name: 'Christmas Day', type: FESTIVAL },
  ],
}

export const COVERED_YEARS = Object.keys(HOLIDAYS_BY_YEAR)
  .map(Number)
  .sort((a, b) => a - b)

export const isYearCovered = (year) => Object.hasOwn(HOLIDAYS_BY_YEAR, year)

export function holidaysForYear(year) {
  return HOLIDAYS_BY_YEAR[year] ?? []
}

export function holidaysForYears(years) {
  const seen = new Set()
  const out = []

  for (const year of years) {
    for (const entry of holidaysForYear(year)) {
      const key = `${entry.date}|${entry.name}`
      if (seen.has(key)) continue
      seen.add(key)
      out.push(entry)
    }
  }

  return out.sort((a, b) => a.date.localeCompare(b.date))
}
