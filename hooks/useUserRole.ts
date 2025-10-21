'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { getPublicProfile } from '@/lib/publicProfiles'
import type { UserRole } from '@/types'

export function useUserRole() {
  const { user } = useAuth()
  const [role, setRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) { setRole(null); return }
    let cancelled = false
    const loadRole = async () => {
      try {
        setLoading(true)
        const profile = await getPublicProfile(user.uid)
        if (!cancelled) setRole(profile?.role ?? null)
      } catch (error) {
        console.error(error)
        if (!cancelled) setRole(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadRole()
    return () => { cancelled = true }
  }, [user])

  return { role, loading }
}
