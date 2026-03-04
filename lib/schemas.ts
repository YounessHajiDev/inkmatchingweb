import { z } from 'zod'

// ── Primitive helpers ───────────────────────────────────────────────

/** Firebase timestamps may arrive as number, string, or server-timestamp object. */
const firebaseTimestamp = z
  .union([z.number(), z.string().transform(Number), z.object({}).transform(() => 0)])
  .pipe(z.number())
  .default(0)

// ── User / Profile ──────────────────────────────────────────────────

export const userRoleSchema = z.enum(['artist', 'client', 'admin'])

export const userRecordSchema = z.object({
  role: userRoleSchema.optional(),
  displayName: z.string().optional(),
})

const stylesSchema = z.union([z.string(), z.array(z.string())]).default('')

export const publicProfileSchema = z.object({
  uid: z.string().default(''),
  role: userRoleSchema.default('client'),
  isPublic: z.boolean().optional(),
  displayName: z.string().default(''),
  city: z.string().default(''),
  address: z.string().optional(),
  styles: stylesSchema,
  coverURL: z.string().optional(),
  portfolioImages: z.array(z.string()).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  rating: z.number().optional(),
  subscriptionTier: z.enum(['free', 'pro', 'premium']).optional(),
  subscriptionStatus: z.enum(['active', 'cancelled', 'past_due', 'trialing']).optional(),
  subscriptionStartDate: z.number().optional(),
  subscriptionEndDate: z.number().optional(),
  stripeCustomerId: z.string().optional(),
  stripeSubscriptionId: z.string().optional(),
  aiCreditsUsed: z.number().optional(),
  aiCreditsResetDate: z.number().optional(),
})

// ── Thread ──────────────────────────────────────────────────────────

export const threadSchema = z.object({
  id: z.string().optional(),
  type: z.enum(['dm', 'group']).default('dm'),
  members: z.record(z.string(), z.boolean()).default({}),
  createdAt: firebaseTimestamp,
  leadId: z.string().optional(),
})

// ── Message ─────────────────────────────────────────────────────────

export const messageKindSchema = z.enum(['text', 'image', 'location', 'system'])

export const messageSchema = z.object({
  id: z.string().default(''),
  senderId: z.string().default(''),
  createdAt: firebaseTimestamp,
  kind: messageKindSchema.default('text'),
  text: z.string().optional(),
  attachments: z.array(z.string()).optional(),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }).optional(),
})

// ── UserThread (thread index per user) ──────────────────────────────

export const userThreadSchema = z.object({
  threadId: z.string().default(''),
  updatedAt: firebaseTimestamp,
  lastMessage: z.string().optional(),
  unreadCount: z.number().optional(),
  members: z.record(z.string(), z.boolean()).default({}),
})

// ── Lead ────────────────────────────────────────────────────────────

export const leadStatusSchema = z.enum(['new', 'accepted', 'declined', 'archived'])

export const leadSchema = z.object({
  id: z.string().default(''),
  clientId: z.string().default(''),
  clientName: z.string().default(''),
  message: z.string().default(''),
  style: z.string().default(''),
  city: z.string().default(''),
  createdAt: firebaseTimestamp,
  status: leadStatusSchema.default('new'),
  threadId: z.string().optional(),
  attachments: z.array(z.string()).optional(),
  aftercareId: z.string().optional(),
})

// ── Aftercare ───────────────────────────────────────────────────────

export const aftercareStatusSchema = z.enum(['active', 'completed', 'archived'])

const aftercareInstructionSchema = z.object({
  title: z.string(),
  content: z.string(),
  day: z.number().optional(),
})

export const aftercareSchema = z.object({
  id: z.string().default(''),
  artistUid: z.string().default(''),
  artistName: z.string().default(''),
  clientUid: z.string().default(''),
  clientName: z.string().default(''),
  leadId: z.string().optional(),
  createdAt: firebaseTimestamp,
  updatedAt: firebaseTimestamp,
  status: aftercareStatusSchema.default('active'),
  tattooStyle: z.string().optional(),
  tattooLocation: z.string().optional(),
  instructions: z.array(aftercareInstructionSchema).default([]),
  generalNotes: z.string().optional(),
  scheduledDays: z.number().optional(),
  completedDays: z.number().optional(),
})

// ── Calendar Event ──────────────────────────────────────────────────

export const calendarEventSchema = z.object({
  id: z.string().default(''),
  title: z.string().default(''),
  startsAt: firebaseTimestamp,
  endsAt: firebaseTimestamp,
  note: z.string().optional(),
  place: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
})

// ── Aftercare artist index entry ────────────────────────────────────

export const aftercareIndexSchema = z.object({
  aftercareId: z.string(),
  clientUid: z.string(),
  clientName: z.string().optional(),
  createdAt: firebaseTimestamp,
  status: aftercareStatusSchema.optional(),
})

// ── Type exports (inferred from schemas) ────────────────────────────

export type ParsedPublicProfile = z.infer<typeof publicProfileSchema>
export type ParsedMessage = z.infer<typeof messageSchema>
export type ParsedUserThread = z.infer<typeof userThreadSchema>
export type ParsedLead = z.infer<typeof leadSchema>
export type ParsedAftercare = z.infer<typeof aftercareSchema>
export type ParsedCalendarEvent = z.infer<typeof calendarEventSchema>
export type ParsedThread = z.infer<typeof threadSchema>
