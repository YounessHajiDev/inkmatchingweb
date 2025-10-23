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
  skinColor = '#F7EFE7', // warm, light skin tone
  inkColor = 'rgba(10,10,10,0.9)',
  fadeAlpha = 0.06,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const mouseRef = useRef({ x: -9999, y: -9999, vx: 0, vy: 0 })
  const rafRef = useRef<number | null>(null)
  const lastRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d', { alpha: false })!

    const resize = () => {
      const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1))
      const w = window.innerWidth
      const h = window.innerHeight
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      // repaint background on resize
      ctx.fillStyle = skinColor
      ctx.fillRect(0, 0, w, h)
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

    // Initial paint
    ctx.fillStyle = skinColor
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const splat = (x: number, y: number, strength: number) => {
      // draw multiple blurred circles with darken to feel like ink soaking
      ctx.globalCompositeOperation = 'darken'
      ctx.fillStyle = inkColor
      const blobs = 4 + Math.floor(Math.random() * 4)
      for (let i = 0; i < blobs; i++) {
        const r = 6 + Math.random() * 18 * strength
        const ox = (Math.random() - 0.5) * 16 * strength
        const oy = (Math.random() - 0.5) * 16 * strength
        ctx.beginPath()
        ctx.ellipse(x + ox, y + oy, r, r * (0.7 + Math.random() * 0.6), Math.random() * Math.PI, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalCompositeOperation = 'source-over'
    }

    const loop = (t: number) => {
      const now = t || performance.now()
      const dt = Math.max(0, Math.min(33, now - (lastRef.current || now)))
      lastRef.current = now

      const w = canvas.clientWidth
      const h = canvas.clientHeight

      // subtle fade to skin tone to slowly erase old ink
      ctx.fillStyle = skinColor
      ctx.globalAlpha = fadeAlpha
      ctx.fillRect(0, 0, w, h)
      ctx.globalAlpha = 1

      const { x, y, vx, vy } = mouseRef.current
      if (x > -1000) {
        const speed = Math.hypot(vx, vy)
        // spacing proportional to speed for a more organic trail
        const steps = 1 + Math.floor(speed / 6)
        for (let i = 0; i < steps; i++) {
          const ix = x - (vx * (i / steps))
          const iy = y - (vy * (i / steps))
          const strength = 0.6 + Math.random() * 0.7
          splat(ix, iy, strength)
        }
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
