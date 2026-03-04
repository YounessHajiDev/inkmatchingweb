/**
 * Barrel re-export for backward compatibility.
 * The original monolithic realtime.ts has been split into focused modules:
 *   - chat.ts: messaging (send, subscribe, stencils)
 *   - leads.ts: lead management (auto-create, subscribe, update)
 *   - threads.ts: thread management (create, delete, subscribe)
 *   - filters.ts: contact-info detection
 */

export { sendText, sendImageAttachment, sendLocationMessage, subscribeToMessages, subscribeToReceivedStencils } from './chat'
export { ensureLeadForFirstMessage, subscribeToLeads, updateLeadStatus } from './leads'
export { ensureOneToOneThread, deleteChatForUser, subscribeToUserThreads, fetchProfile, buildDMId } from './threads'
export { containsExternalContact } from './filters'
