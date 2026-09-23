import { NextResponse } from "next/server"
import supabase from "@/lib/supabaseServer"
import { z } from "zod"
import { notifyEmail } from "@/lib/notify"
import { ensureInvoiceForRequest } from "@/lib/orderInvoice"

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || process.env.TEAM_NOTIFICATION_EMAIL || "").split(",").map(s => s.trim()).filter(Boolean)

const UpdateSchema = z.object({
  status: z.string().optional(),
  orderStatus: z.string().optional(),
  notes: z.string().optional(),
  trackingNumber: z.string().optional(),
  carrier: z.string().optional(),
  estimatedDelivery: z.string().optional(),
})

function buildTrackingNoteBlock(input: {
  trackingNumber?: string
  carrier?: string
  orderStatus?: string
  estimatedDelivery?: string
}) {
  const entries = [
    ["Tracking", input.trackingNumber],
    ["Carrier", input.carrier],
    ["Order Status", input.orderStatus],
    ["ETA", input.estimatedDelivery],
  ].filter(([, value]) => Boolean(value))

  if (entries.length === 0) return null

  const lines = entries.map(([label, value]) => `${label}: ${value}`)
  return `[Parcel Tracking]\n${lines.join("\n")}`
}

async function updateWithSchemaFallback(id: string, initialUpdates: Record<string, unknown>) {
  const updates: Record<string, unknown> = { ...initialUpdates }
  const removedColumns: string[] = []

  for (let attempt = 0; attempt < 12; attempt++) {
    const { data, error } = await supabase.from("sourcing_requests").update(updates).eq("id", id).select()
    if (!error) return { data, error: null, removedColumns }

    const missingColumn = /Could not find the '([^']+)' column/.exec(error.message)?.[1]
    if (!missingColumn || !(missingColumn in updates)) {
      return { data: null, error, removedColumns }
    }

    removedColumns.push(missingColumn)
    delete updates[missingColumn]
  }

  return {
    data: null,
    error: { message: "Update failed after removing unsupported columns." },
    removedColumns,
  }
}

function isMissingHistoryTable(message: string) {
  const m = message.toLowerCase()
  return m.includes("request_status_history") && (m.includes("does not exist") || m.includes("could not find"))
}

async function logStatusHistoryBestEffort(input: {
  requestId: string
  actorEmail: string
  status?: string
  trackingNumber?: string
  carrier?: string
  estimatedDelivery?: string
  note?: string
}) {
  const payload = {
    request_id: input.requestId,
    status: input.status ?? null,
    tracking_number: input.trackingNumber ?? null,
    carrier: input.carrier ?? null,
    estimated_delivery: input.estimatedDelivery ?? null,
    note: input.note ?? null,
    actor_email: input.actorEmail,
    created_at: new Date().toISOString(),
  }

  const { error } = await supabase.from("request_status_history").insert([payload])
  if (!error) return
  if (isMissingHistoryTable(error.message)) return
  console.warn("Failed to write request status history", error)
}

async function sendStatusChangeNotificationBestEffort(input: {
  requestId: string
  toEmail?: string | null
  clientName?: string | null
  oldStatus?: string | null
  newStatus?: string | null
  trackingNumber?: string | null
  carrier?: string | null
  estimatedDelivery?: string | null
}) {
  if (!input.toEmail) return
  const oldNormalized = (input.oldStatus || "").trim().toLowerCase()
  const newNormalized = (input.newStatus || "").trim().toLowerCase()
  if (!newNormalized || oldNormalized === newNormalized) return

  const pretty = (value: string) => value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  const client = input.clientName || "there"
  const oldLabel = oldNormalized ? pretty(oldNormalized) : "Pending"
  const newLabel = pretty(newNormalized)

  const extraBits = [
    input.trackingNumber ? `Tracking: ${input.trackingNumber}` : null,
    input.carrier ? `Carrier: ${input.carrier}` : null,
    input.estimatedDelivery ? `Estimated delivery: ${String(input.estimatedDelivery).slice(0, 10)}` : null,
  ].filter(Boolean)

  const subject = `Update on your request #${input.requestId}: ${newLabel}`
  const text = [
    `Hi ${client},`,
    "",
    `Your request #${input.requestId} status changed from ${oldLabel} to ${newLabel}.`,
    ...(extraBits.length > 0 ? ["", ...extraBits] : []),
    "",
    "Log in to your client portal to view details.",
  ].join("\n")

  const html = [
    `<p>Hi ${client},</p>`,
    `<p>Your request <strong>#${input.requestId}</strong> status changed from <strong>${oldLabel}</strong> to <strong>${newLabel}</strong>.</p>`,
    ...(extraBits.length > 0 ? [`<p>${extraBits.join("<br/>")}</p>`] : []),
    `<p>Log in to your client portal to view details.</p>`,
  ].join("")

  await notifyEmail(input.toEmail, subject, text, html)
}

export async function PATCH(req: Request, context: any) {
  try {
    const auth = req.headers.get("authorization")
    if (!auth?.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "Missing authorization" }, { status: 401 })
    }
    const token = auth.split(" ")[1]

    const { data: userData, error: userError } = await supabase.auth.getUser(token)
    if (userError || !userData?.user) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
    }

    const email = userData.user.email
    if (!email || !ADMIN_EMAILS.includes(email)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    const body = await req.json()
    const parsed = UpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const id = (context.params && context.params.id) || context.params?.id
    const { data: currentRowData, error: currentRowError } = await supabase
      .from("sourcing_requests")
      .select("id,email,name,company,status,order_status")
      .eq("id", id)
      .limit(1)
    if (currentRowError) {
      return NextResponse.json({ success: false, error: currentRowError.message }, { status: 500 })
    }

    const currentRequest = currentRowData?.[0] ?? null
    const previousStatus = (currentRequest?.order_status || currentRequest?.status || null) as string | null

    const input = parsed.data
    const updates: Record<string, unknown> = {
      status: input.orderStatus ?? input.status,
      notes: input.notes,
      tracking_number: input.trackingNumber,
      carrier: input.carrier,
      order_status: input.orderStatus,
      estimated_delivery: input.estimatedDelivery,
      updated_at: new Date().toISOString(),
    }

    Object.keys(updates).forEach((key) => {
      if (updates[key] === undefined) delete updates[key]
    })

    const { data, error, removedColumns } = await updateWithSchemaFallback(id, updates)
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    let finalRequest = data?.[0] ?? null
    const removedTrackingColumns = removedColumns.filter((column) => ["tracking_number", "carrier", "order_status", "estimated_delivery"].includes(column))
    if (removedTrackingColumns.length > 0) {
      const block = buildTrackingNoteBlock({
        trackingNumber: input.trackingNumber,
        carrier: input.carrier,
        orderStatus: input.orderStatus,
        estimatedDelivery: input.estimatedDelivery,
      })

      if (block) {
        const current = data?.[0]?.notes ? String(data[0].notes) : ""
        const nextNotes = current.includes("[Parcel Tracking]")
          ? current.replace(/\[Parcel Tracking\][\s\S]*$/m, block)
          : `${current}${current ? "\n\n" : ""}${block}`

        const noteResult = await updateWithSchemaFallback(id, { notes: nextNotes })
        if (!noteResult.error && noteResult.data?.[0]) {
          finalRequest = noteResult.data[0]
        }
      }
    }

    await logStatusHistoryBestEffort({
      requestId: id,
      actorEmail: email,
      status: input.orderStatus ?? input.status,
      trackingNumber: input.trackingNumber,
      carrier: input.carrier,
      estimatedDelivery: input.estimatedDelivery,
      note: input.notes,
    })

    await sendStatusChangeNotificationBestEffort({
      requestId: String(id),
      toEmail: currentRequest?.email,
      clientName: currentRequest?.name || currentRequest?.company,
      oldStatus: previousStatus,
      newStatus: (finalRequest?.order_status || finalRequest?.status || input.orderStatus || input.status || null) as string | null,
      trackingNumber: (finalRequest?.tracking_number || input.trackingNumber || null) as string | null,
      carrier: (finalRequest?.carrier || input.carrier || null) as string | null,
      estimatedDelivery: (finalRequest?.estimated_delivery || input.estimatedDelivery || null) as string | null,
    })

    await ensureInvoiceForRequest(String(id), email)

    return NextResponse.json({ success: true, request: finalRequest })
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}

export async function GET(req: Request, context: any) {
  try {
    const auth = req.headers.get("authorization")
    if (!auth?.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "Missing authorization" }, { status: 401 })
    }
    const token = auth.split(" ")[1]

    const { data: userData, error: userError } = await supabase.auth.getUser(token)
    if (userError || !userData?.user) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
    }

    const email = userData.user.email
    if (!email || !ADMIN_EMAILS.includes(email)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    const id = (context.params && context.params.id) || context.params?.id
    const { data, error } = await supabase.from("sourcing_requests").select("*").eq("id", id)
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, request: data?.[0] ?? null })
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
