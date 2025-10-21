import { storage } from '@/lib/firebaseClient'
import { ref as sRef, uploadBytes, getDownloadURL, listAll } from 'firebase/storage'

export async function uploadStencil(uid: string, file: File): Promise<string> {
  const path = `stencils/${uid}/${Date.now()}_${file.name}`
  const ref = sRef(storage, path)
  await uploadBytes(ref, file, { contentType: file.type })
  return getDownloadURL(ref)
}

export async function listStencils(uid: string): Promise<string[]> {
  const dir = sRef(storage, `stencils/${uid}`)
  const res = await listAll(dir)
  return Promise.all(res.items.map(getDownloadURL))
}

export async function generateStencilWithAI(uid: string, prompt: string): Promise<string> {
  const res = await fetch('/api/stencils/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uid, prompt })
  })
  
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.message || 'Failed to generate stencil')
  }
  
  const data = await res.json()
  return data.url
}

