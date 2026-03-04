/**
 * Contact-info detection filters.
 * Prevents users from exchanging external contact details before a lead is accepted.
 */

const emailPattern = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i
const phonePattern = /\b(?:\+?\d{1,3}[-.\s]?)?(?:\(\d{1,4}\)|\d{1,4})[-.\s]?\d{3}[-.\s]?\d{3,4}\b/
const socialPattern = /\b(instagram|facebook|whatsapp|telegram|snapchat|tiktok|imessage)\b/i

export function containsExternalContact(text: string): boolean {
  return emailPattern.test(text) || phonePattern.test(text) || socialPattern.test(text)
}
