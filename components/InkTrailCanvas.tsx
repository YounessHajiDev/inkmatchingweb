'use client'

import { useEffect, useRef } from 'react'

type Props = {
  className?: string
  skinColor?: string
  inkColor?: string
  fadeAlpha?: number // 0..1 amount to fade each frame
}

/**
 * Fullscreen canvas that paints a subtle black-ink trail that follows the cursor,
 * over a warm skin-tone background. The ink slowly fades to mimic healing/absorption.
 */
export default function InkTrailCanvas({
  className,
  skinColor = '#000000', // unused when alpha canvas
  inkColor = 'rgba(10,10,10,0.95)',
  fadeAlpha = 0.16, // faster fade out as requested
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const mouseRef = useRef({ x: -9999, y: -9999, vx: 0, vy: 0 })
  const rafRef = useRef<number | null>(null)
  const lastRef = useRef<number>(0)
  const hueRef = useRef(0)
  type Particle = {
    x: number
    y: number
    vx: number
    vy: number
    rot: number
    vr: number
    scale: number
    life: number
    maxLife: number
    glyph: string
    smoke: number
  }
  const particlesRef = useRef<Particle[]>([])

  useEffect(() => {
    const canvas = canvasRef.current!
  const ctx = canvas.getContext('2d', { alpha: true })!

    const resize = () => {
      const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1))
      const w = window.innerWidth
      const h = window.innerHeight
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  // transparent canvas over app background
  ctx.clearRect(0, 0, w, h)
    }

    resize()
    window.addEventListener('resize', resize)

    const onMove = (e: PointerEvent) => {
      const { x: px, y: py } = mouseRef.current
      const x = e.clientX
      const y = e.clientY
      mouseRef.current = {
        x,
        y,
        vx: x - px,
        vy: y - py,
      }

      // Spawn decorative particles (butterflies/flowers/animals)
      const speed = Math.hypot(x - px, y - py)
      const count = Math.min(6, 1 + Math.floor(speed / 6))
      const GLYPHS = ['🦋','🌸','🌺','🌼','🦅','🐍','🐯','🐺','🦊','🦂']
      for (let i = 0; i < count; i++) {
        const ang = Math.random() * Math.PI * 2
        const sp = 0.4 + Math.random() * 1.2
        particlesRef.current.push({
          x,
          y,
          vx: Math.cos(ang) * sp * 0.8 + (x - px) * 0.02,
          vy: Math.sin(ang) * sp * 0.4 - 0.2, // slight upward drift like smoke
          rot: Math.random() * Math.PI,
          vr: (Math.random() - 0.5) * 0.03,
          scale: 0.7 + Math.random() * 0.9,
          life: 0,
          maxLife: 700 + Math.random() * 900, // ms
          glyph: GLYPHS[(Math.random() * GLYPHS.length) | 0],
          smoke: 8 + Math.random() * 12,
        })
      }
    }
    window.addEventListener('pointermove', onMove)

  // Start transparent so underlying app background shows
  ctx.clearRect(0, 0, canvas.width, canvas.height)

    const drawParticles = (dt: number) => {
      const list = particlesRef.current
      const n = list.length
      const toRemove: number[] = []
      ctx.save()
      for (let i = 0; i < n; i++) {
        const p = list[i]
        p.life += dt
        if (p.life >= p.maxLife) { toRemove.push(i); continue }
        // update motion
        p.x += p.vx
        p.y += p.vy
        p.vy -= 0.003 // gentle updraft
        p.rot += p.vr
        p.scale *= 1.005 // slight expansion like smoke

        // compute alpha with ease-out cubic
        const t = p.life / p.maxLife
        const alpha = 1 - (1 - t) * (1 - t) * (1 - t)
        const a = Math.max(0, 1 - alpha) // fade from 1 -> 0

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rot)
        ctx.globalAlpha = a
        ctx.shadowColor = 'rgba(0,0,0,0.30)'
        ctx.shadowBlur = p.smoke
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        const size = 20 * p.scale
        ctx.font = `${size}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", system-ui, sans-serif`
        ctx.fillText(p.glyph, 0, 0)
        ctx.restore()
      }
      ctx.restore()
      // prune
      for (let i = toRemove.length - 1; i >= 0; i--) {
        const idx = toRemove[i]
        list.splice(idx, 1)
      }
      // cap
      if (list.length > 180) list.splice(0, list.length - 180)
    }

    const loop = (t: number) => {
      const now = t || performance.now()
      const dt = Math.max(0, Math.min(33, now - (lastRef.current || now)))
      lastRef.current = now

    const w = canvas.clientWidth
    const h = canvas.clientHeight

    // clear frame and redraw particles (each has its own alpha for smoke fade)
    ctx.clearRect(0, 0, w, h)

      // draw and update particle system
      drawParticles(dt)

      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)

    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('resize', resize)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [fadeAlpha, inkColor, skinColor])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={
        'pointer-events-none fixed inset-0 z-0 block h-full w-full select-none ' +
        (className || '')
      }
    />
  )
}
