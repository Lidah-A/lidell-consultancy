"use client"
import { useEffect, useRef, useState } from "react"
import supabase from "@/lib/supabaseClient"
import PageSeo from "@/app/components/PageSeo"

export default function AdminRequestDetail({ params }: { params: { id: string } }) {
  const { id } = params
  const [session, setSession] = useState<any>(null)
  const [request, setRequest] = useState<any>(null)
  const [files, setFiles] = useState<any[]>([])
  const [history, setHistory] = useState<any[]>([])
  const [messages, setMessages] = useState<any[]>([])
  const [messageText, setMessageText] = useState("")
  const [sendingMessage, setSendingMessage] = useState(false)
  const [invoice, setInvoice] = useState<any>(null)
  const [invoiceAmount, setInvoiceAmount] = useState("")
  const [invoiceCurrency, setInvoiceCurrency] = useState("USD")
  const [invoiceStatus, setInvoiceStatus] = useState("draft")
  const [invoiceDueDate, setInvoiceDueDate] = useState("")
  const [invoiceNotes, setInvoiceNotes] = useState("")
  const [savingInvoice, setSavingInvoice] = useState(false)
  const fileRef = useRef<HTMLInputElement | null>(null)
  const parcelFileRef = useRef<HTMLInputElement | null>(null)
  const [saving, setSaving] = useState(false)
  const [trackingNumber, setTrackingNumber] = useState("")
  const [carrier, setCarrier] = useState("")
  const [orderStatus, setOrderStatus] = useState("")
  const [estimatedDelivery, setEstimatedDelivery] = useState("")
  const [notes, setNotes] = useState("")

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
    const token = session.access_token
    const res = await fetch(`/api/admin/requests/${id}`, { headers: { Authorization: `Bearer ${token}` } })
    const json = await res.json()
    if (res.ok) {
      const req = json.request
      setRequest(req)
      const parsedFromNotes = parseTrackingFromNotes(req?.notes || "")
      setTrackingNumber(req?.tracking_number || parsedFromNotes.trackingNumber || "")
      setCarrier(req?.carrier || parsedFromNotes.carrier || "")
      setOrderStatus(req?.order_status || req?.status || parsedFromNotes.orderStatus || "")
      setEstimatedDelivery(req?.estimated_delivery || parsedFromNotes.estimatedDelivery || "")
      setNotes(req?.notes || "")
    }

    const listRes = await fetch(`/api/attachments/list/${id}`)
    const listJson = await listRes.json()
    if (listRes.ok) setFiles(listJson.files || [])

    const historyRes = await fetch(`/api/admin/requests/${id}/history`, { headers: { Authorization: `Bearer ${token}` } })
    const historyJson = await historyRes.json()
    if (historyRes.ok) setHistory(historyJson.history || [])

    const msgRes = await fetch(`/api/admin/requests/${id}/messages`, { headers: { Authorization: `Bearer ${token}` } })
    const msgJson = await msgRes.json()
    if (msgRes.ok) setMessages(msgJson.messages || [])

    const invoiceRes = await fetch(`/api/admin/requests/${id}/invoice`, { headers: { Authorization: `Bearer ${token}` } })
    const invoiceJson = await invoiceRes.json()
    if (invoiceRes.ok) {
      const inv = invoiceJson.invoice || null
      setInvoice(inv)
      if (inv) {
        setInvoiceAmount(String(inv.amount ?? "0"))
        setInvoiceCurrency(inv.currency || "USD")
        setInvoiceStatus(inv.status || "draft")
        setInvoiceDueDate(inv.due_date ? String(inv.due_date).slice(0, 10) : "")
        setInvoiceNotes(inv.notes || "")
      }
    }
  }

  useEffect(() => { if (session) load() }, [session])

  async function upload() {
    const el = fileRef.current
    if (!el || !el.files || el.files.length === 0) return
    await uploadFile(el.files[0], false)
  }

  async function uploadParcelPhoto() {
    const el = parcelFileRef.current
    if (!el || !el.files || el.files.length === 0) return
    await uploadFile(el.files[0], true)
  }

  async function uploadFile(file: File, isParcel: boolean) {
    const maxBytes = 20 * 1024 * 1024 // 20 MB for admin uploads
    let uploadable: File
    try {
      uploadable = await validateAndPrepareFile(file, maxBytes)
    } catch (err) {
      return alert(String((err as Error).message || err))
    }

    const safeName = uploadable.name.replace(/\s+/g, "_")
    const path = `${id}/${Date.now()}_${isParcel ? "parcel_" : "file_"}${safeName}`
    const bucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'request-attachments'
    const { error } = await supabase.storage.from(bucket).upload(path, uploadable)
    if (error) return alert(error.message)

    // log upload
    try {
      const token = session?.access_token
      await fetch('/api/attachments/log', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ requestId: id, path, action: 'upload' }) })
    } catch (e) {
      console.warn('Failed to log upload', e)
    }

    await load()
  }

  async function saveTracking() {
    if (!session) return
    setSaving(true)
    const token = session.access_token
    const payload = {
      orderStatus,
      trackingNumber,
      carrier,
      estimatedDelivery,
      notes,
    }

    const res = await fetch(`/api/admin/requests/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })

    const json = await res.json()
    setSaving(false)
    if (!res.ok) return alert(json.error || "Failed to save request updates")

    setRequest(json.request)
    await load()
    alert("Tracking and status updated")
  }

  async function sendMessage() {
    if (!session || !messageText.trim()) return
    setSendingMessage(true)
    const token = session.access_token
    const res = await fetch(`/api/admin/requests/${id}/messages`, {
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

  async function saveInvoice() {
    if (!session) return
    setSavingInvoice(true)
    const token = session.access_token
    const amount = Number(invoiceAmount)
    const payload = {
      amount: Number.isFinite(amount) ? amount : 0,
      currency: invoiceCurrency,
      status: invoiceStatus,
      dueDate: invoiceDueDate || undefined,
      notes: invoiceNotes,
    }

    const res = await fetch(`/api/admin/requests/${id}/invoice`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })

    const json = await res.json()
    setSavingInvoice(false)
    if (!res.ok) return alert(json.error || "Failed to save invoice")
    setInvoice(json.invoice)
    alert("Invoice saved")
  }

  async function remove(path: string) {
    if (!session) return
    const token = session.access_token
    const res = await fetch('/api/admin/attachments/delete', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ path }) })
    const json = await res.json()
    if (!res.ok) alert(json.error || 'Failed to delete')
    else await load()
  }

  if (!session) return <main className="min-h-screen flex items-center justify-center">Sign in as admin to view this request.</main>

  const parcelPhotos = files.filter((f) => /parcel_/i.test(f.name) && f.name.match(/\.(png|jpe?g)$/i))
  const otherAttachments = files.filter((f) => !/parcel_/i.test(f.name))

  return (
    <main className="min-h-screen p-6 bg-gray-50">
      <PageSeo
        title={`Admin Request #${id}`}
        description="Review request details and manage attachments from the admin dashboard."
      />
      <div className="max-w-3xl mx-auto bg-white p-6 rounded shadow">
        <h1 className="text-xl font-semibold">Admin Request #{id}</h1>
        {request && (
          <div className="mt-4">
            <p><strong>Branch:</strong> {request.branch}</p>
            <p><strong>Name/Company:</strong> {request.name ?? request.company}</p>
            <p className="mt-2 text-sm text-gray-700">{request.details || request.notes}</p>

            <div className="mt-6 border rounded p-4 bg-gray-50">
              <h2 className="font-medium">Shipping Tracking</h2>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tracking Number</label>
                  <input
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    className="mt-1 w-full rounded border px-3 py-2 text-sm"
                    placeholder="e.g. DHL123456789"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Carrier</label>
                  <input
                    value={carrier}
                    onChange={(e) => setCarrier(e.target.value)}
                    className="mt-1 w-full rounded border px-3 py-2 text-sm"
                    placeholder="DHL, FedEx, UPS"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Order Status</label>
                  <select
                    value={orderStatus}
                    onChange={(e) => setOrderStatus(e.target.value)}
                    className="mt-1 w-full rounded border px-3 py-2 text-sm"
                  >
                    <option value="">Select status</option>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="packed">Packed</option>
                    <option value="in_transit">In Transit</option>
                    <option value="out_for_delivery">Out for Delivery</option>
                    <option value="delivered">Delivered</option>
                    <option value="delayed">Delayed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Estimated Delivery</label>
                  <input
                    type="date"
                    value={estimatedDelivery ? String(estimatedDelivery).slice(0, 10) : ""}
                    onChange={(e) => setEstimatedDelivery(e.target.value)}
                    className="mt-1 w-full rounded border px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700">Internal Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1 min-h-[90px] w-full rounded border px-3 py-2 text-sm"
                  placeholder="Add notes for this order"
                />
              </div>
              <button onClick={saveTracking} disabled={saving} className="mt-3 px-3 py-2 bg-zinc-900 text-white rounded disabled:opacity-60">
                {saving ? "Saving..." : "Save Tracking"}
              </button>
            </div>

            <div className="mt-4">
              <label className="block text-sm">Attach file</label>
              <input ref={fileRef} type="file" className="mt-2" />
              <button onClick={upload} className="mt-2 px-3 py-1 bg-blue-600 text-white rounded">Upload</button>
            </div>

            <div className="mt-4">
              <label className="block text-sm">Upload parcel photo</label>
              <input ref={parcelFileRef} type="file" accept="image/png,image/jpeg,image/jpg,image/webp" className="mt-2" />
              <button onClick={uploadParcelPhoto} className="mt-2 px-3 py-1 bg-emerald-600 text-white rounded">Upload Parcel Photo</button>
            </div>

            <div className="mt-6 rounded border p-4 bg-gray-50">
              <h2 className="font-medium">Invoice</h2>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Invoice Number</label>
                  <div className="mt-1 rounded border bg-white px-3 py-2 text-sm">{invoice?.invoice_number || "Auto-generated"}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Amount</label>
                  <input value={invoiceAmount} onChange={(e) => setInvoiceAmount(e.target.value)} className="mt-1 w-full rounded border px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Currency</label>
                  <input value={invoiceCurrency} onChange={(e) => setInvoiceCurrency(e.target.value.toUpperCase())} className="mt-1 w-full rounded border px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select value={invoiceStatus} onChange={(e) => setInvoiceStatus(e.target.value)} className="mt-1 w-full rounded border px-3 py-2 text-sm">
                    <option value="draft">Draft</option>
                    <option value="sent">Sent</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Due Date</label>
                  <input type="date" value={invoiceDueDate} onChange={(e) => setInvoiceDueDate(e.target.value)} className="mt-1 w-full rounded border px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700">Invoice Notes</label>
                <textarea value={invoiceNotes} onChange={(e) => setInvoiceNotes(e.target.value)} className="mt-1 min-h-[80px] w-full rounded border px-3 py-2 text-sm" />
              </div>
              <button onClick={saveInvoice} disabled={savingInvoice} className="mt-3 px-3 py-2 bg-indigo-600 text-white rounded disabled:opacity-60">
                {savingInvoice ? "Saving Invoice..." : "Save Invoice"}
              </button>
            </div>

            <div className="mt-6 rounded border p-4 bg-gray-50">
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
                  placeholder="Write a message to the client..."
                />
              </div>
              <button onClick={sendMessage} disabled={sendingMessage} className="mt-3 px-3 py-2 bg-zinc-900 text-white rounded disabled:opacity-60">
                {sendingMessage ? "Sending..." : "Send Message"}
              </button>
            </div>

            <div className="mt-4">
              <h2 className="font-medium">Parcel Photos</h2>
              <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-3">
                {parcelPhotos.map(f => (
                  <div key={f.path} className="p-2 border rounded">
                    <img src={f.url} alt={f.name} className="w-full h-32 object-cover rounded" onClick={() => window.open(f.url, '_blank')} />
                    <div className="mt-2 flex justify-between items-center">
                      <div className="text-xs text-gray-600">{f.name}</div>
                      <button onClick={() => remove(f.path)} className="text-sm text-red-600">Delete</button>
                    </div>
                  </div>
                ))}
                {parcelPhotos.length === 0 && <div className="text-sm text-gray-500">No parcel photos yet</div>}
              </div>
            </div>

            <div className="mt-4">
              <h2 className="font-medium">Attachments</h2>
              <div className="mt-2 grid grid-cols-3 gap-3">
                {otherAttachments.map(f => (
                  <div key={f.path} className="p-2 border rounded">
                    {f.name.match(/\.(png|jpe?g)$/i) ? (
                      <img src={f.url} alt={f.name} className="w-full h-32 object-cover rounded" onClick={() => window.open(f.url, '_blank')} />
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

            <div className="mt-6">
              <h2 className="font-medium">Status History</h2>
              <div className="mt-2 space-y-2">
                {history.map((item) => (
                  <div key={item.id || `${item.created_at}-${item.status || "entry"}`} className="rounded border p-3">
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
