"use client"

import React from 'react'

type Motion = { x: number; y: number }

export default function HeroGraphic({ className = '', motion = { x: 0, y: 0 }, mounted = true }: { className?: string, motion?: Motion, mounted?: boolean }) {
  // Each layer will have a different multiplier to create depth
  const bgStyle = { transform: `translate(${motion.x * 0.02}px, ${motion.y * 0.01}px)` }
  const midStyle = { transform: `translate(${motion.x * 0.05}px, ${motion.y * 0.035}px)` }
  const fgStyle = { transform: `translate(${motion.x * 0.1}px, ${motion.y * 0.07}px)` }
  const opacityClass = mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'

  return (
    <svg className={className} viewBox="0 0 600 360" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <linearGradient id="g1" x1="0" x2="1">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="50%" stopColor="#ec4899" />
          <stop offset="100%" stopColor="#60a5fa" />
        </linearGradient>
      </defs>

      {/* Background glow / planet */}
      <g style={bgStyle} className={`transition-transform duration-300 ${opacityClass}`}>
        <ellipse cx="300" cy="240" rx="220" ry="70" fill="rgba(255,255,255,0.03)" />
      </g>

      {/* Mid layer - silhouette / platform */}
      <g style={midStyle} className={`transition-transform duration-300 ${opacityClass}`}>
        <path d="M120 200 C160 120, 340 120, 380 200 C380 220, 360 230, 310 230 L190 230 C140 230, 120 220, 120 200 Z" fill="#0b1220" opacity="0.95" />
        <path d="M160 170 C190 150, 310 150, 340 170 C330 160, 310 155, 260 155 L210 155 C180 155, 165 160, 160 170 Z" fill="url(#g1)" opacity="0.98" />
      </g>

      {/* Foreground detail - ship/asset */}
      <g style={fgStyle} className={`transition-transform duration-300 ${opacityClass}`}>
        <g transform="translate(240,90) scale(1.0)">
          <ellipse cx="60" cy="60" rx="60" ry="30" fill="#111827" opacity="0.95" />
          <path d="M20 60 C40 30, 140 20, 180 60 C180 72, 160 78, 110 78 L30 78 C20 78, 18 74, 20 60 Z" fill="url(#g1)" />
          <circle cx="120" cy="60" r="6" fill="#fff" opacity="0.95" />
        </g>
      </g>
    </svg>
  )
}
