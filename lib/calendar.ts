import { db } from '@/lib/firebaseClient'
import { ref, push, set, get, remove } from 'firebase/database'

export type CalendarEvent = {
  id: string
  title: string
  dateISO: string
  time?: string
  note?: string
  createdAt: number
}

export async function listEvents(uid: string): Promise<CalendarEvent[]> {
  const snap = await get(ref(db, `calendars/${uid}/events`))
  if (!snap.exists()) return []
  const events: CalendarEvent[] = Object.entries(snap.val()).map(([id, v]: [string, any]) => ({ id, ...(v as any) }))
  events.sort((a, b) => a.dateISO.localeCompare(b.dateISO))
  return events
}

export async function addEvent(uid: string, input: Omit<CalendarEvent, 'id'|'createdAt'>) {
  const r = push(ref(db, `calendars/${uid}/events`))
  await set(r, { ...input, createdAt: Date.now() })
}

export async function deleteEvent(uid: string, id: string) {
  await remove(ref(db, `calendars/${uid}/events/${id}`))
}
