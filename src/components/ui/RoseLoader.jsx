import { useEffect, useRef } from 'react'

const SVG_NS = 'http://www.w3.org/2000/svg'

const CFG = {
  particleCount: 76,
  trailSpan: 0.31,
  durationMs: 5300,
  rotationDurationMs: 28000,
  pulseDurationMs: 4400,
  strokeWidth: 4.6,
  roseA: 9.2,
  roseABoost: 0.6,
  roseBreathBase: 0.72,
  roseBreathBoost: 0.28,
  roseScale: 3.25,
}

function point(progress, detailScale) {
  const t = progress * Math.PI * 2
  const a = CFG.roseA + detailScale * CFG.roseABoost
  const r = a * (CFG.roseBreathBase + detailScale * CFG.roseBreathBoost) * Math.cos(3 * t)
  return {
    x: 50 + Math.cos(t) * r * CFG.roseScale,
    y: 50 + Math.sin(t) * r * CFG.roseScale,
  }
}

function normalizeProgress(p) {
  return ((p % 1) + 1) % 1
}

function detailScale(time) {
  const pulse = (time % CFG.pulseDurationMs) / CFG.pulseDurationMs
  return 0.52 + ((Math.sin(pulse * Math.PI * 2 + 0.55) + 1) / 2) * 0.48
}

function rotation(time) {
  return -((time % CFG.rotationDurationMs) / CFG.rotationDurationMs) * 360
}

function buildPath(scale, steps = 480) {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const p = point(i / steps, scale)
    return `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`
  }).join(' ')
}

/**
 * Rose Three mathematical curve loader.
 *
 * @param {object} props
 * @param {number} [props.size=120]  pixel size of the loader
 */
export default function RoseLoader({ size = 120 }) {
  const svgRef = useRef(null)

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return

    const group = svg.querySelector('#rose-group')
    const path = svg.querySelector('#rose-path')

    /* create particles once */
    const particles = Array.from({ length: CFG.particleCount }, () => {
      const c = document.createElementNS(SVG_NS, 'circle')
      c.setAttribute('fill', 'currentColor')
      group.appendChild(c)
      return c
    })

    const start = performance.now()
    let frame = 0

    function render(now) {
      const t = now - start
      const progress = (t % CFG.durationMs) / CFG.durationMs
      const ds = detailScale(t)

      group.setAttribute('transform', `rotate(${rotation(t)} 50 50)`)
      path.setAttribute('d', buildPath(ds))

      for (let i = 0; i < particles.length; i++) {
        const tail = i / (CFG.particleCount - 1)
        const p = point(normalizeProgress(progress - tail * CFG.trailSpan), ds)
        const fade = Math.pow(1 - tail, 0.56)
        const node = particles[i]
        node.setAttribute('cx', p.x.toFixed(2))
        node.setAttribute('cy', p.y.toFixed(2))
        node.setAttribute('r', (0.9 + fade * 2.7).toFixed(2))
        node.setAttribute('opacity', (0.04 + fade * 0.96).toFixed(3))
      }

      frame = requestAnimationFrame(render)
    }

    frame = requestAnimationFrame(render)
    return () => {
      cancelAnimationFrame(frame)
      /* clean up particles */
      particles.forEach((c) => c.remove())
    }
  }, [])

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 100 100"
      fill="none"
      aria-hidden="true"
      width={size}
      height={size}
      className="text-[rgb(var(--accent))]"
      style={{ overflow: 'visible' }}
    >
      <g id="rose-group">
        <path
          id="rose-path"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={CFG.strokeWidth}
          opacity="0.1"
        />
      </g>
    </svg>
  )
}
