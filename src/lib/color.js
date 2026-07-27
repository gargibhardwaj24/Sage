export function hexToRgb(hex) {
  const h = hex.replace('#', '')
  const full =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h
  const n = parseInt(full, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export function alpha(hex, a) {
  const [r, g, b] = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${a})`
}

const clamp = (n) => Math.max(0, Math.min(255, Math.round(n)))

export const rgbToHex = (r, g, b) =>
  `#${[r, g, b].map((v) => clamp(v).toString(16).padStart(2, '0')).join('')}`

export function mix(hex, target, weight) {
  const [r, g, b] = hexToRgb(hex)
  const [tr, tg, tb] = hexToRgb(target)
  return rgbToHex(r + (tr - r) * weight, g + (tg - g) * weight, b + (tb - b) * weight)
}

export const lighten = (hex, weight) => mix(hex, '#ffffff', weight)
export const darken = (hex, weight) => mix(hex, '#000000', weight)

export function relativeLuminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrastRatio(a, b) {
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  const [hi, lo] = la > lb ? [la, lb] : [lb, la]
  return (hi + 0.05) / (lo + 0.05)
}

export function readableInk(hex, background, minRatio = 4.5) {
  const toward = relativeLuminance(background) > 0.5 ? '#000000' : '#ffffff'
  let candidate = hex
  for (let weight = 0; weight <= 0.9; weight += 0.05) {
    candidate = mix(hex, toward, weight)
    if (contrastRatio(candidate, background) >= minRatio) return candidate
  }
  return candidate
}

export function isValidHex(value) {
  return typeof value === 'string' && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value.trim())
}
