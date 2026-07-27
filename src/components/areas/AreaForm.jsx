import { useState } from 'react'
import { Check, X } from 'lucide-react'
import Button from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { AREA_SWATCHES } from '@/data/categories'
import { AREA_NAME_MAX } from '@/lib/areas'
import { isValidHex } from '@/lib/color'
import { cn } from '@/lib/cn'

function Swatch({ color, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(color)}
      aria-label={`Use ${color}`}
      aria-pressed={selected}
      className={cn(
        'grid h-7 w-7 place-items-center rounded-full transition-transform duration-150',
        selected
          ? 'scale-110 ring-2 ring-offset-2 ring-offset-[rgb(var(--card))]'
          : 'hover:scale-105'
      )}
      style={{ backgroundColor: color, '--tw-ring-color': color }}
    >
      {selected ? <Check size={13} strokeWidth={3.2} className="text-white drop-shadow" /> : null}
    </button>
  )
}

export function AreaForm({ onCreate, onCancel, autoFocus = true, className }) {
  const [name, setName] = useState('')
  const [color, setColor] = useState(AREA_SWATCHES[7])
  const [error, setError] = useState(null)

  const submit = () => {
    const result = onCreate({ name, hex: color })
    if (result?.ok === false) {
      setError(result.error)
      return
    }
    setName('')
    setColor(AREA_SWATCHES[7])
    setError(null)
  }

  return (
    <div className={cn('rounded-control bg-[rgb(var(--card))] p-3', className)}>
      <Input
        value={name}
        autoFocus={autoFocus}
        maxLength={AREA_NAME_MAX}
        onChange={(e) => {
          setName(e.target.value)
          setError(null)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            e.stopPropagation()
            submit()
          }
          if (e.key === 'Escape') {
            e.preventDefault()
            e.stopPropagation()
            onCancel?.()
          }
        }}
        placeholder="Side project, Family, Errands…"
        aria-label="Area name"
        className="h-9"
      />

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {AREA_SWATCHES.map((c) => (
          <Swatch key={c} color={c} selected={color === c} onSelect={setColor} />
        ))}
        <label className="ml-1 flex items-center gap-1.5 text-[11px] font-medium text-muted">
          <input
            type="color"
            value={isValidHex(color) ? color : '#6f4ae8'}
            onChange={(e) => setColor(e.target.value)}
            aria-label="Custom colour"
            className="h-7 w-7 cursor-pointer rounded-full border-0 bg-transparent p-0"
          />
          Custom
        </label>
      </div>

      {error ? <p className="mt-2 text-[11px] font-medium text-rose-500">{error}</p> : null}

      <div className="mt-3 flex items-center gap-2">
        <Button variant="primary" size="xs" onClick={submit}>
          <Check size={13} strokeWidth={2.8} />
          Add area
        </Button>
        <Button variant="ghost" size="xs" onClick={onCancel}>
          <X size={13} strokeWidth={2.4} />
          Cancel
        </Button>
      </div>
    </div>
  )
}

export default AreaForm
