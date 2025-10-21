'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { subscribeToMessages, sendText } from '@/lib/realtime'
import type { Message } from '@/types'

export default function ChatPage() {
  const params = useParams()
  const threadId = params.threadId as string
  const { user } = useAuth()
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user) { router.push('/login'); return }
    let unsubscribe: (() => void) | undefined
    subscribeToMessages(threadId, user.uid, setMessages)
      .then((fn) => { unsubscribe = fn; setError(null) })
      .catch((err) => {
        console.error(err)
        setError('You do not have access to this conversation.')
      })
    return () => { unsubscribe?.() }
  }, [threadId, user, router])

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !user || sending) return
    setSending(true)
    const text = input.trim()
    setInput('')
    try {
      await sendText(threadId, text, user.uid)
      setError(null)
    } catch (e: any) {
      console.error(e)
      setError(e?.message ?? 'Failed to send message')
      setInput(text)
    }
    finally { setSending(false) }
  }

  if (!user) return <div className="flex items-center justify-center min-h-screen"><div className="text-ink-text-muted">Redirecting to login…</div></div>
  if (error && messages.length === 0) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="rounded-3xl border border-red-500/30 bg-red-500/10 px-6 py-8 text-center text-red-200 shadow-glow-soft">{error}</div>
    </div>
  )

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="flex h-[calc(100vh-11rem)] flex-col overflow-hidden rounded-4xl border border-white/10 bg-white/[0.03] shadow-glow-soft backdrop-blur-md">
        <div className="relative flex-1 overflow-y-auto px-4 py-6 sm:px-8">
          <div className="absolute inset-0 bg-ink-panel opacity-30" aria-hidden />
          <div className="relative z-10 space-y-4">
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center text-ink-text-muted">No messages yet. Start the conversation!</div>
              </div>
            ) : (
              messages.map((message) => {
                const isMe = message.senderId === user.uid
                return (
                  <div key={message.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-3xl px-5 py-3 text-sm shadow-inner ${isMe ? 'bg-ink-button text-white' : 'border border-white/10 bg-white/[0.08] text-white'}`}>
                      {message.kind === 'text' && message.text && <p className="break-words leading-relaxed">{message.text}</p>}
                      {message.kind === 'system' && <p className="text-sm italic text-ink-text-muted">{message.text}</p>}
                      <p className="mt-2 text-right text-xs text-white/60">{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
        <div className="border-t border-white/10 bg-white/[0.06] px-4 py-4 sm:px-6">
          {error && <div className="mb-2 text-sm text-red-200">{error}</div>}
          <form onSubmit={handleSend} className="flex items-center gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message…"
              className="input flex-1 rounded-full bg-white/[0.05]"
              disabled={sending}
            />
            <button type="submit" disabled={sending || !input.trim()} className="btn btn-primary px-6">
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
