export type UserRole = 'artist' | 'client' | 'admin'
export type ThreadType = 'dm' | 'group'
export type MessageKind = 'text' | 'image' | 'location' | 'system'
export type LeadStatus = 'new' | 'accepted' | 'declined' | 'archived'
export type BookingStatus = 'pending' | 'accepted' | 'declined' | 'cancelled' | 'completed'
export type PaymentStatus = 'not_required' | 'pending' | 'requires_action' | 'succeeded' | 'cancelled'

export interface PublicProfile {
  uid: string
  role: UserRole
  isPublic?: boolean
  displayName: string
  city: string
  address?: string
  styles: string | string[]
  coverURL?: string
  portfolioImages?: string[]
  latitude?: number
  longitude?: number
  lat?: number // legacy
  lng?: number // legacy
  rating?: number
}

export interface Thread {
  id?: string
  type: ThreadType
  members: Record<string, boolean>
  createdAt: number
  leadId?: string
}

export interface Message {
  id: string
  senderId: string
  createdAt: number
  kind: MessageKind
  text?: string
  attachments?: string[]
  location?: {
    latitude: number
    longitude: number
  }
}

export interface UserThread {
  threadId: string
  updatedAt: number
  lastMessage?: string
  unreadCount?: number
  members: Record<string, boolean>
}

export interface Booking {
  id: string
  artistUid: string
  clientUid: string
  requestedAt: number
  status: BookingStatus
  scheduledFor?: string
  scheduledTime?: string
  note?: string
  style?: string
  budget?: number
  depositAmount?: number
  paymentIntentId?: string
  paymentStatus: PaymentStatus
  paymentClientSecret?: string
  updatedAt: number
}

export interface Lead {
  id: string
  clientId: string
  clientName: string
  message: string
  style: string
  city: string
  createdAt: number
  status: LeadStatus
  threadId?: string
  attachments?: string[]
}

export interface ArtistWithProfile extends PublicProfile {
  normalizedStyles: string
  lat: number
  lon: number
}
