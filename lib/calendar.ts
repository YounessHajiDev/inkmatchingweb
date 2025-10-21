import { db } from '@/lib/firebaseClient'
import { ref, push, set, get, remove } from 'firebase/database'

export type CalendarEvent = {
  id: string
  title: string
  startsAt: number
  endsAt: number
  note?: string
  place?: string
  latitude?: number
  longitude?: number
}

// Legacy type for backward compatibility with existing UI
export type LegacyCalendarEvent = {
  id: string
  title: string
  dateISO: string
  time?: string
  note?: string
  createdAt: number
}

function legacyToAppointment(legacy: Omit<LegacyCalendarEvent, 'id'|'createdAt'>): Omit<CalendarEvent, 'id'> {
  const dateTime = legacy.time 
    ? new Date(`${legacy.dateISO}T${legacy.time}`)
    : new Date(`${legacy.dateISO}T00:00`)
  const startsAt = dateTime.getTime()
  return {
    title: legacy.title,
    startsAt,
    endsAt: startsAt + (60 * 60 * 1000), // Default 1 hour duration
    note: legacy.note,
  }
}

function appointmentToLegacy(apt: CalendarEvent): LegacyCalendarEvent {
  const date = new Date(apt.startsAt)
  const dateISO = date.toISOString().split('T')[0]
  const time = date.toTimeString().slice(0, 5)
  return {
    id: apt.id,
    title: apt.title,
    dateISO,
    time,
    note: apt.note,
    createdAt: apt.startsAt,
  }
}

export async function listEvents(uid: string): Promise<LegacyCalendarEvent[]> {
  const snap = await get(ref(db, `appointmentsByArtist/${uid}`))
  if (!snap.exists()) return []
  const appointments: CalendarEvent[] = Object.entries(snap.val()).map(([id, v]: [string, any]) => ({ id, ...(v as any) }))
  const legacy = appointments.map(appointmentToLegacy)
  legacy.sort((a, b) => a.dateISO.localeCompare(b.dateISO))
  return legacy
}

export async function addEvent(uid: string, input: Omit<LegacyCalendarEvent, 'id'|'createdAt'>) {
  const appointment = legacyToAppointment(input)
  const r = push(ref(db, `appointmentsByArtist/${uid}`))
  await set(r, appointment)
}

export async function deleteEvent(uid: string, id: string) {
  await remove(ref(db, `appointmentsByArtist/${uid}/${id}`))
}
