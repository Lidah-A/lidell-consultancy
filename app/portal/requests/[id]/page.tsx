"use client"
import { useEffect, useState, useRef } from "react"
import supabase from "@/lib/supabaseClient"
import PageSeo from "@/app/components/PageSeo"

export default function PortalRequestDetail({ params }: { params: { id: string } }) {
  const { id } = params
  const [session, setSession] = useState<any>(null)
  const [request, setRequest] = useState<any>(null)
  const [files, setFiles] = useState<any[]>([])
  const [history, setHistory] = useState<any[]>([])
  const [messages, setMessages] = useState<any[]>([])
  const [messageText, setMessageText] = useState("")
  const [sendingMessage, setSendingMessage] = useState(false)
  const [invoice, setInvoice] = useState<any>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)
  const [loading, setLoading] = useState(false)

  function parseTrackingFromNotes(rawNotes: string) {
    const marker = "[Parcel Tracking]"
    if (!rawNotes || !rawNotes.includes(marker)) {
      return { trackingNumber: "", carrier: "", orderStatus: "", estimatedDelivery: "" }
    }

    const block = rawNotes.slice(rawNotes.indexOf(marker))
    const lines = block.split("\n")
    const valueFor = (label: string) => lines.find((line) => line.startsWith(`${label}:`))?.split(":").slice(1).join(":").trim() || ""
    return {
      trackingNumber: valueFor("Tracking"),
      carrier: valueFor("Carrier"),
      orderStatus: valueFor("Order Status"),
      estimatedDelivery: valueFor("ETA"),
    }
  }

  async function compressImage(file: File) {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result || ""))
      reader.onerror = () => reject(new Error("Failed to read image"))
      reader.readAsDataURL(file)
    })

    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error("Failed to load image"))
      img.src = dataUrl
    })

    const maxWidth = 1600
    const maxHeight = 1600
    const ratio = Math.min(maxWidth / image.width, maxHeight / image.height, 1)
    const width = Math.max(1, Math.round(image.width * ratio))
    const height = Math.max(1, Math.round(image.height * ratio))

    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext("2d")
    if (!ctx) return file
    ctx.drawImage(image, 0, 0, width, height)

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.82)
    })
    if (!blob) return file

    const renamed = file.name.replace(/\.[^.]+$/, "") + ".jpg"
    return new File([blob], renamed, { type: "image/jpeg" })
  }

  async function validateAndPrepareFile(file: File, maxBytes: number) {
    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp", "application/pdf"]
    if (!allowed.includes(file.type)) {
      throw new Error("Invalid file type. Allowed: PNG, JPG, WEBP, PDF")
    }

    let prepared = file
    if (file.type.startsWith("image/") && file.size > 1.5 * 1024 * 1024) {
      prepared = await compressImage(file)
    }

    if (prepared.size > maxBytes) {
      throw new Error(`File too large after compression (max ${Math.round(maxBytes / 1024 / 1024)}MB)`)
    }
    return prepared
  }

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

    const historyRes = await fetch(`/api/portal/requests/${id}/history`, { headers: { Authorization: `Bearer ${token}` } })
    const historyJson = await historyRes.json()
    if (historyRes.ok) setHistory(historyJson.history || [])

    const msgRes = await fetch(`/api/portal/requests/${id}/messages`, { headers: { Authorization: `Bearer ${token}` } })
    const msgJson = await msgRes.json()
    if (msgRes.ok) setMessages(msgJson.messages || [])

    const invoiceRes = await fetch(`/api/portal/requests/${id}/invoice`, { headers: { Authorization: `Bearer ${token}` } })
    const invoiceJson = await invoiceRes.json()
    if (invoiceRes.ok) setInvoice(invoiceJson.invoice || null)
    // preload image thumbnails
    // nothing else required; URLs are signed
  }

  useEffect(() => { if (session) load() }, [session])

  async function upload() {
    const el = fileRef.current
    if (!el || !el.files || el.files.length === 0) return
    const file = el.files[0]
    const maxBytes = 10 * 1024 * 1024 // 10 MB
    let uploadable: File
    try {
      uploadable = await validateAndPrepareFile(file, maxBytes)
    } catch (err) {
      return alert(String((err as Error).message || err))
    }

    const path = `${id}/${Date.now()}_${uploadable.name.replace(/\s+/g, "_")}`
    const bucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'request-attachments'
    const { error } = await supabase.storage.from(bucket).upload(path, uploadable)
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

  async function sendMessage() {
    if (!session || !messageText.trim()) return
    setSendingMessage(true)
    const token = session.access_token
    const res = await fetch(`/api/portal/requests/${id}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ message: messageText.trim() }),
    })

    const json = await res.json()
    setSendingMessage(false)
    if (!res.ok) return alert(json.error || "Failed to send message")
    setMessageText("")
    setMessages((prev) => [...prev, json.message])
  }

  if (!session) return <main className="min-h-screen flex items-center justify-center">Please sign in at the portal to view this request.</main>

  const parsedTracking = parseTrackingFromNotes(request?.notes || "")
  const trackingNumber = request?.tracking_number || parsedTracking.trackingNumber
  const carrier = request?.carrier || parsedTracking.carrier
  const orderStatus = request?.order_status || request?.status || parsedTracking.orderStatus
  const estimatedDelivery = request?.estimated_delivery || parsedTracking.estimatedDelivery
  const parcelPhotos = files.filter((f) => /parcel_/i.test(f.name) && f.name.match(/\.(png|jpe?g)$/i))
  const otherAttachments = files.filter((f) => !/parcel_/i.test(f.name))

  const statusLabel = orderStatus ? String(orderStatus).replace(/_/g, " ") : "pending"

  return (
    <main className="min-h-screen p-6 bg-gray-50">
      <PageSeo
        title={`Portal Request #${id}`}
        description="View request details and manage attachments in the client portal."
      />
      <div className="max-w-3xl mx-auto bg-white p-6 rounded shadow">
        <h1 className="text-xl font-semibold">Request #{id}</h1>
        {loading && <p>Loading...</p>}
        {request && (
          <div className="mt-4">
            <p><strong>Branch:</strong> {request.branch}</p>
            <p><strong>Name/Company:</strong> {request.name ?? request.company}</p>
            <p className="mt-2 text-sm text-gray-700">{request.details || request.notes}</p>

            <div className="mt-6 rounded border bg-gray-50 p-4">
              <h2 className="font-medium">Shipping Status</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-gray-500">Order Status</p>
                  <span className="inline-flex rounded-full bg-zinc-900 px-3 py-1 text-xs font-medium text-white uppercase tracking-wide">
                    {statusLabel}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Tracking Number</p>
                  <p className="text-sm font-medium text-zinc-900">{trackingNumber || "Not assigned yet"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Carrier</p>
                  <p className="text-sm text-zinc-800">{carrier || "Not assigned"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Estimated Delivery</p>
                  <p className="text-sm text-zinc-800">{estimatedDelivery ? String(estimatedDelivery).slice(0, 10) : "TBD"}</p>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <h2 className="font-medium">Parcel Photos</h2>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {parcelPhotos.map(f => (
                  <div key={f.path} className="p-2 border rounded">
                    <img src={f.url} alt={f.name} className="w-full h-48 object-cover rounded" onClick={() => window.open(f.url, '_blank')} />
                    <div className="mt-2 text-xs text-gray-600">{f.name}</div>
                  </div>
                ))}
                {parcelPhotos.length === 0 && <div className="text-sm text-gray-500">No parcel photos uploaded yet</div>}
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm">Attach file (images, quotes, invoices)</label>
              <input ref={fileRef} type="file" className="mt-2" />
              <button onClick={upload} className="mt-2 px-3 py-1 bg-blue-600 text-white rounded">Upload</button>
            </div>

            <div className="mt-4">
              <h2 className="font-medium">Attachments</h2>
              <div className="mt-2 grid grid-cols-2 gap-3">
                {otherAttachments.map(f => (
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
                {otherAttachments.length === 0 && <div className="text-sm text-gray-500">No general attachments</div>}
              </div>
            </div>

            <div className="mt-6 rounded border bg-gray-50 p-4">
              <h2 className="font-medium">Invoice</h2>
              {invoice ? (
                <div className="mt-2 space-y-1 text-sm text-zinc-800">
                  <p><strong>Invoice Number:</strong> {invoice.invoice_number}</p>
                  <p><strong>Amount:</strong> {invoice.currency} {invoice.amount}</p>
                  <p><strong>Status:</strong> {String(invoice.status || "draft").replace(/_/g, " ")}</p>
                  <p><strong>Due Date:</strong> {invoice.due_date ? String(invoice.due_date).slice(0, 10) : "TBD"}</p>
                  {invoice.notes && <p><strong>Notes:</strong> {invoice.notes}</p>}
                </div>
              ) : (
                <p className="mt-2 text-sm text-gray-600">Invoice will appear once generated.</p>
              )}
            </div>

            <div className="mt-6 rounded border bg-gray-50 p-4">
              <h2 className="font-medium">Order Messages</h2>
              <div className="mt-3 max-h-72 overflow-y-auto space-y-2">
                {messages.map((m) => (
                  <div key={m.id || `${m.created_at}-${m.message}`} className="rounded border bg-white p-2">
                    <div className="text-xs text-gray-500">
                      {(m.sender_role || "user").toUpperCase()} • {m.sender_email || "Unknown"} • {m.created_at ? new Date(m.created_at).toLocaleString() : ""}
                    </div>
                    <div className="mt-1 text-sm text-gray-800 whitespace-pre-wrap">{m.message}</div>
                  </div>
                ))}
                {messages.length === 0 && <div className="text-sm text-gray-500">No messages yet</div>}
              </div>
              <div className="mt-3">
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="min-h-[80px] w-full rounded border px-3 py-2 text-sm"
                  placeholder="Ask an order-specific question..."
                />
              </div>
              <button onClick={sendMessage} disabled={sendingMessage} className="mt-3 px-3 py-2 bg-zinc-900 text-white rounded disabled:opacity-60">
                {sendingMessage ? "Sending..." : "Send Message"}
              </button>
            </div>

            <div className="mt-6">
              <h2 className="font-medium">Tracking Timeline</h2>
              <div className="mt-2 space-y-2">
                {history.map((item) => (
                  <div key={item.id || `${item.created_at}-${item.status || "entry"}`} className="rounded border p-3 bg-white">
                    <div className="text-xs text-gray-500">{item.created_at ? new Date(item.created_at).toLocaleString() : "Just now"}</div>
                    <div className="mt-1 text-sm">
                      <strong>Status:</strong> {(item.status || "updated").toString().replace(/_/g, " ")}
                    </div>
                    {item.tracking_number && <div className="text-sm"><strong>Tracking:</strong> {item.tracking_number}</div>}
                    {item.carrier && <div className="text-sm"><strong>Carrier:</strong> {item.carrier}</div>}
                    {item.estimated_delivery && <div className="text-sm"><strong>ETA:</strong> {String(item.estimated_delivery).slice(0, 10)}</div>}
                    {item.note && <div className="mt-1 text-sm text-gray-700"><strong>Note:</strong> {item.note}</div>}
                  </div>
                ))}
                {history.length === 0 && <div className="text-sm text-gray-500">No timeline updates yet</div>}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
