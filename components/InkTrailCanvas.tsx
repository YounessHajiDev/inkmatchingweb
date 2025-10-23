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
    }
    window.addEventListener('pointermove', onMove)

  // Start transparent so underlying app background shows
  ctx.clearRect(0, 0, canvas.width, canvas.height)

    const splat = (x: number, y: number, pressure: number) => {
      // Rainbow ink dot with minimal bleed
      const hue = hueRef.current % 360
      const color = `hsl(${hue}, 90%, 55%)`

      // Main thin dot
      ctx.globalCompositeOperation = 'source-over'
      ctx.fillStyle = color
      const lineWidth = 1.1 + pressure * 0.5 // ~1.1-1.6px
      ctx.beginPath()
      ctx.arc(x, y, lineWidth, 0, Math.PI * 2)
      ctx.fill()

      // Minimal soft edge
      ctx.fillStyle = `hsla(${hue}, 90%, 55%, 0.18)`
      const bleedRadius = lineWidth + 0.7
      ctx.beginPath()
      ctx.arc(x, y, bleedRadius, 0, Math.PI * 2)
      ctx.fill()
    }

    const loop = (t: number) => {
      const now = t || performance.now()
      const dt = Math.max(0, Math.min(33, now - (lastRef.current || now)))
      lastRef.current = now

      const w = canvas.clientWidth
      const h = canvas.clientHeight

  // Fast fade using destination-out to increase transparency of existing ink
  ctx.globalCompositeOperation = 'destination-out'
  ctx.fillStyle = `rgba(0,0,0,${fadeAlpha})`
  ctx.fillRect(0, 0, w, h)
  ctx.globalCompositeOperation = 'source-over'

      const { x, y, vx, vy } = mouseRef.current
      if (x > -1000) {
        const speed = Math.hypot(vx, vy)
        // Thin, continuous line like a tattoo needle
        // More interpolation points for smooth, connected line
        const steps = Math.max(3, Math.ceil(speed / 1.8))
        for (let i = 0; i < steps; i++) {
          const t = i / steps
          const ix = x - (vx * t)
          const iy = y - (vy * t)
          // Slight pressure variation based on speed
          const pressure = Math.min(1, 0.4 + speed * 0.02)
          splat(ix, iy, pressure)
        }
        // advance hue based on speed for dynamic rainbow
        hueRef.current = (hueRef.current + Math.max(0.6, speed * 0.15)) % 360
      }

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
