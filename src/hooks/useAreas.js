import { useCallback } from 'react'
import { buildCustomCategory } from '@/data/categories'
import { validateArea } from '@/lib/areas'
import { useSettings } from '@/store/SettingsContext'

export function useAreas() {
  const { settings, update } = useSettings()
  const areas = Array.isArray(settings.customCategories) ? settings.customCategories : []

  const addArea = useCallback(
    ({ name, hex }) => {
      const error = validateArea({ name, hex, existing: areas })
      if (error) return { ok: false, error }

      const area = buildCustomCategory({ name, hex })
      update({ customCategories: [...areas, area] })
      return { ok: true, area }
    },
    [areas, update]
  )

  const removeArea = useCallback(
    (id) => update({ customCategories: areas.filter((a) => a.id !== id) }),
    [areas, update]
  )

  return { areas, addArea, removeArea }
}

export default useAreas
