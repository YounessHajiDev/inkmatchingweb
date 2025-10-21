'use client'

import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { ArtistWithProfile } from '@/types'

export default function MapArtists({ artists, onSelect }: { artists: ArtistWithProfile[]; onSelect: (a: ArtistWithProfile)=>void }) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)

  useEffect(() => {
    if (!mapContainer.current || map.current) return
    const m = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://demotiles.maplibre.org/style.json',
      center: [-73.5673, 45.5017],
      zoom: 10,
    })
    // Swallow AbortError emitted by MapLibre when tearing down during pending fetches
    m.on('error', (e: any) => {
      const name = e?.error?.name || e?.name
      if (name === 'AbortError') return
      // Log unexpected map errors for diagnostics
      console.warn('[MapLibre] error event:', e)
    })
    map.current = m

    return () => {
      try {
        if (map.current) map.current.remove()
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          console.warn('[MapLibre] cleanup error:', err)
        }
      } finally {
        map.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!map.current) return
    const markers: maplibregl.Marker[] = []
    artists.forEach((artist) => {
      if (artist.lat && artist.lon) {
        const el = document.createElement('div')
        el.className = 'w-8 h-8 bg-ink-accent rounded-full border-2 border-white cursor-pointer hover:scale-110 transition-transform'
        el.addEventListener('click', () => onSelect(artist))
        const marker = new maplibregl.Marker({ element: el }).setLngLat([artist.lon, artist.lat]).addTo(map.current!)
        markers.push(marker)
      }
    })
    return () => { markers.forEach((m) => m.remove()) }
  }, [artists, onSelect])

  return <div ref={mapContainer} className="w-full h-full" />
}
