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
  inkColor = 'rgba(10,10,10,0.95)',
  fadeAlpha = 0.04, // slower fade for persistent thin lines
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

    const splat = (x: number, y: number, pressure: number) => {
      // Thin, realistic tattoo needle line with subtle bleeding
      ctx.globalCompositeOperation = 'darken'
      
      // Main thin line with sharp opacity
      ctx.fillStyle = inkColor
      const lineWidth = 1.2 + pressure * 0.6 // Very thin: 1.2-1.8px
      ctx.beginPath()
      ctx.arc(x, y, lineWidth, 0, Math.PI * 2)
      ctx.fill()
      
      // Subtle ink bleeding (minimal)
      ctx.fillStyle = 'rgba(10,10,10,0.15)'
      const bleedRadius = lineWidth + 0.8
      ctx.beginPath()
      ctx.arc(x, y, bleedRadius, 0, Math.PI * 2)
      ctx.fill()
      
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
        // Thin, continuous line like a tattoo needle
        // More interpolation points for smooth, connected line
        const steps = Math.max(2, Math.ceil(speed / 2))
        for (let i = 0; i < steps; i++) {
          const t = i / steps
          const ix = x - (vx * t)
          const iy = y - (vy * t)
          // Slight pressure variation based on speed
          const pressure = Math.min(1, 0.4 + speed * 0.02)
          splat(ix, iy, pressure)
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
