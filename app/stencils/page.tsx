'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { listStencils, uploadStencil } from '@/lib/stencils'
import Image from 'next/image'

export default function StencilsPage() {
  const { user, loading } = useAuth()
  const [urls, setUrls] = useState<string[]>([])
  const [busy, setBusy] = useState(false)

  useEffect(() => { if (user) listStencils(user.uid).then(setUrls) }, [user])

  if (loading) return <div className="p-8 text-gray-400">Loading…</div>
  if (!user) return <div className="p-8 text-gray-400">Please login to manage your stencils.</div>

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    try {
      await uploadStencil(user.uid, file)
      setUrls(await listStencils(user.uid))
    } finally { setBusy(false); e.target.value = '' }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Stencils</h1>
        <label className="btn-primary cursor-pointer">
          {busy ? 'Uploading…' : 'Upload'}
          <input type="file" accept="image/*" onChange={onUpload} className="hidden" />
        </label>
      </div>

      {urls.length === 0 ? (
        <div className="card p-8 text-gray-400">No stencils yet. Upload PNG/JPG files.</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {urls.map((u, i) => (
            <div key={i} className="card overflow-hidden relative aspect-square">
              <Image src={u} alt={`stencil-${i}`} fill className="object-cover" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
