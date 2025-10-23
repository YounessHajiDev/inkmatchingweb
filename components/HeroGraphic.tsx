"use client"

import React from 'react'

export default function HeroGraphic({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 600 360" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <linearGradient id="g1" x1="0" x2="1">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="50%" stopColor="#ec4899" />
          <stop offset="100%" stopColor="#60a5fa" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="100%" height="100%" rx="18" fill="url(#g1)" opacity="0.07" />
      <g transform="translate(40,20) scale(0.9)">
        <ellipse cx="300" cy="220" rx="220" ry="80" fill="rgba(255,255,255,0.03)" />
        <g>
          <path d="M120 200 C160 120, 340 120, 380 200 C380 220, 360 230, 310 230 L190 230 C140 230, 120 220, 120 200 Z" fill="#0f172a" opacity="0.9" />
          <path d="M160 170 C190 150, 310 150, 340 170 C330 160, 310 155, 260 155 L210 155 C180 155, 165 160, 160 170 Z" fill="url(#g1)" opacity="0.95" />
          <circle cx="260" cy="165" r="8" fill="#fff" opacity="0.9" />
        </g>
        <g transform="translate(380,40) scale(0.7)">
          <circle cx="0" cy="0" r="6" fill="#fff" opacity="0.9" />
        </g>
      </g>
    </svg>
  )
}
