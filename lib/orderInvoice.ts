import supabase from "@/lib/supabaseServer"

function isMissingTable(message: string, table: string) {
  const m = message.toLowerCase()
  return m.includes(table.toLowerCase()) && (m.includes("does not exist") || m.includes("could not find"))
}

function parseAmount(raw?: string | null) {
  if (!raw) return 0
  const normalized = String(raw).replace(/,/g, "")
  const match = normalized.match(/\d+(\.\d+)?/)
  if (!match) return 0
  const value = Number(match[0])
  return Number.isFinite(value) ? value : 0
}

function inferCurrency(raw?: string | null) {
  if (!raw) return "USD"
  const upper = raw.toUpperCase()
  const known = ["USD", "EUR", "GBP", "ZMW", "ZAR", "NGN", "KES", "GHS"]
  for (const code of known) {
    if (upper.includes(code)) return code
  }
  return "USD"
}

function buildInvoiceNumber(requestId: string) {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "")
  return `INV-${stamp}-${requestId.replace(/-/g, "").slice(0, 8).toUpperCase()}`
}

export async function ensureInvoiceForRequest(requestId: string, actorEmail: string) {
  const existing = await supabase.from("order_invoices").select("*").eq("request_id", requestId).limit(1)
  if (existing.error) {
    if (isMissingTable(existing.error.message, "order_invoices")) return { invoice: null, skipped: true }
    return { invoice: null, error: existing.error }
  }

  if (existing.data && existing.data[0]) {
    return { invoice: existing.data[0], skipped: false }
  }

  const reqRow = await supabase
    .from("sourcing_requests")
    .select("id,branch,name,company,email,budget,order_size,status,order_status,created_at")
    .eq("id", requestId)
    .limit(1)

  if (reqRow.error) return { invoice: null, error: reqRow.error }
  const request = reqRow.data?.[0]
  if (!request) return { invoice: null, error: { message: "Request not found" } }

  const amountSource = request.budget || request.order_size || ""
  const amount = parseAmount(amountSource)
  const currency = inferCurrency(amountSource)
  const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const payload = {
    request_id: requestId,
    invoice_number: buildInvoiceNumber(requestId),
    client_name: request.name || request.company || null,
    client_email: request.email || null,
    currency,
    amount,
    status: "draft",
    due_date: dueDate,
    notes: "Auto-generated invoice",
    line_items: [
      {
        description: request.branch === "b2b" ? "B2B sourcing services" : "Personal sourcing services",
        quantity: 1,
        unit_price: amount,
        total: amount,
      },
    ],
    created_by: actorEmail,
    created_at: new Date().toISOString(),
  }

  const inserted = await supabase.from("order_invoices").insert([payload]).select().limit(1)
  if (inserted.error) return { invoice: null, error: inserted.error }
  return { invoice: inserted.data?.[0] ?? null, skipped: false }
}

export async function upsertInvoiceForRequest(requestId: string, updates: Record<string, unknown>, actorEmail: string) {
  const ensured = await ensureInvoiceForRequest(requestId, actorEmail)
  if (ensured.error || ensured.skipped) return ensured

  const { data, error } = await supabase
    .from("order_invoices")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("request_id", requestId)
    .select()
    .limit(1)

  if (error) return { invoice: null, error }
  return { invoice: data?.[0] ?? null, skipped: false }
}
