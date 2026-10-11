"use client"
import { useEffect, useState, useRef } from "react"
import supabase from "@/lib/supabaseClient"
import { getRequestBranch } from "@/lib/requestType"

export default function PortalRequestDetail({ params }: { params: { id: string } }) {
  const { id } = params
  const [session, setSession] = useState<any>(null)
  const [request, setRequest] = useState<any>(null)
  const [files, setFiles] = useState<any[]>([])
  const fileRef = useRef<HTMLInputElement | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }: any) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_evt: any, sess: any) => setSession(sess ?? null))
    return () => { sub.subscription?.unsubscribe() }
  }, [])

  async function load() {
    if (!session) return
    setLoading(true)
    const token = session.access_token
    const res = await fetch(`/api/portal/requests/${id}`, { headers: { Authorization: `Bearer ${token}` } })
    const json = await res.json()
    setLoading(false)
    if (res.ok) setRequest(json.request)
    else alert(json.error || 'Failed')

    // load attachments
    const listRes = await fetch(`/api/attachments/list/${id}`)
    const listJson = await listRes.json()
    if (listRes.ok) setFiles(listJson.files || [])
    // preload image thumbnails
    // nothing else required; URLs are signed
  }

  useEffect(() => { if (session) load() }, [session])

  async function upload() {
    const el = fileRef.current
    if (!el || !el.files || el.files.length === 0) return
    const file = el.files[0]
    // client-side validation: type and size
    const allowed = ["image/png", "image/jpeg", "image/jpg", "application/pdf"]
    const maxBytes = 10 * 1024 * 1024 // 10 MB
    if (!allowed.includes(file.type)) return alert("Invalid file type. Allowed: PNG, JPG, PDF")
    if (file.size > maxBytes) return alert("File too large (max 10MB)")

    const path = `${id}/${Date.now()}_${file.name}`
    const bucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'request-attachments'
    const { error } = await supabase.storage.from(bucket).upload(path, file)
    if (error) return alert(error.message)

    // log upload event server-side
    try {
      const token = session?.access_token
      await fetch('/api/attachments/log', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ requestId: id, path, action: 'upload' }) })
    } catch (e) {
      console.warn('Failed to log upload', e)
    }

    await load()
  }

  async function remove(path: string) {
    if (!session) return
    const token = session.access_token
    const res = await fetch('/api/attachments/delete', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ path, requestId: id }) })
    const json = await res.json()
    if (!res.ok) alert(json.error || 'Failed to delete')
    else await load()
  }

  if (!session) return <main className="min-h-screen flex items-center justify-center">Please sign in at the portal to view this request.</main>

  return (
    <main className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-3xl mx-auto bg-white p-6 rounded shadow">
        <h1 className="text-xl font-semibold">Request #{id}</h1>
        {loading && <p>Loading...</p>}
        {request && (
          <div className="mt-4">
            <p><strong>Branch:</strong> {getRequestBranch(request)}</p>
            <p><strong>Name/Company:</strong> {request.name ?? request.company}</p>
            <p className="mt-2 text-sm text-gray-700">{request.details || request.notes}</p>
            <div className="mt-4">
              <label className="block text-sm">Attach file (images, quotes, invoices)</label>
              <input ref={fileRef} type="file" className="mt-2" />
              <button onClick={upload} className="mt-2 px-3 py-1 bg-blue-600 text-white rounded">Upload</button>
            </div>

            <div className="mt-4">
              <h2 className="font-medium">Attachments</h2>
              <div className="mt-2 grid grid-cols-2 gap-3">
                {files.map(f => (
                  <div key={f.path} className="p-2 border rounded">
                    {f.name.match(/\.(png|jpe?g)$/i) ? (
                      <img src={f.url} alt={f.name} className="w-full h-40 object-cover rounded" onClick={() => window.open(f.url, '_blank')} />
                    ) : (
                      <a href={f.url} target="_blank" rel="noreferrer" className="text-blue-600">{f.name}</a>
                    )}
                    <div className="mt-2 flex justify-between items-center">
                      <div className="text-xs text-gray-600">{f.name}</div>
                      <button onClick={() => remove(f.path)} className="text-sm text-red-600">Delete</button>
                    </div>
                  </div>
                ))}
                {files.length === 0 && <div className="text-sm text-gray-500">No attachments</div>}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
