import { NextResponse } from "next/server"
import supabase from "@/lib/supabaseServer"
import { z } from "zod"
import { ensureInvoiceForRequest, upsertInvoiceForRequest } from "@/lib/orderInvoice"

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || process.env.TEAM_NOTIFICATION_EMAIL || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean)

const BodySchema = z.object({
  amount: z.number().nonnegative().optional(),
  currency: z.string().min(3).max(3).optional(),
  status: z.string().optional(),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
  lineItems: z.array(z.any()).optional(),
})

async function assertAdmin(req: Request) {
  const auth = req.headers.get("authorization")
  if (!auth?.startsWith("Bearer ")) {
    return { error: NextResponse.json({ success: false, error: "Missing authorization" }, { status: 401 }) }
  }
  const token = auth.split(" ")[1]
  const { data: userData, error: userError } = await supabase.auth.getUser(token)
  if (userError || !userData?.user) {
    return { error: NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 }) }
  }
  const email = userData.user.email
  if (!email || !ADMIN_EMAILS.includes(email)) {
    return { error: NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 }) }
  }
  return { email }
}

export async function GET(req: Request, context: any) {
  try {
    const auth = await assertAdmin(req)
    if (auth.error) return auth.error

    const id = (context.params && context.params.id) || context.params?.id
    const result = await ensureInvoiceForRequest(id, auth.email as string)
    if (result.error) return NextResponse.json({ success: false, error: result.error.message }, { status: 500 })

    return NextResponse.json({ success: true, invoice: result.invoice, skipped: result.skipped || false })
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}

export async function POST(req: Request, context: any) {
  try {
    const auth = await assertAdmin(req)
    if (auth.error) return auth.error

    const body = await req.json()
    const parsed = BodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const id = (context.params && context.params.id) || context.params?.id
    const input = parsed.data
    const updates: Record<string, unknown> = {}
    if (input.amount !== undefined) updates.amount = input.amount
    if (input.currency) updates.currency = input.currency.toUpperCase()
    if (input.status) updates.status = input.status
    if (input.dueDate) updates.due_date = input.dueDate
    if (input.notes !== undefined) updates.notes = input.notes
    if (input.lineItems !== undefined) updates.line_items = input.lineItems

    const result = await upsertInvoiceForRequest(id, updates, auth.email as string)
    if (result.error) return NextResponse.json({ success: false, error: result.error.message }, { status: 500 })

    return NextResponse.json({ success: true, invoice: result.invoice })
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
