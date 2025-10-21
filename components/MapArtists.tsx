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
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://demotiles.maplibre.org/style.json',
      center: [-73.5673, 45.5017],
      zoom: 10,
    })
    return () => { map.current?.remove(); map.current = null }
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
