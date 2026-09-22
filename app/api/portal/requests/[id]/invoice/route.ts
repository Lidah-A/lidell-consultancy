import { NextResponse } from "next/server"
import supabase from "@/lib/supabaseServer"
import { ensureInvoiceForRequest } from "@/lib/orderInvoice"

async function assertOwner(req: Request, id: string) {
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
  if (!email) return { error: NextResponse.json({ success: false, error: "No email on user" }, { status: 400 }) }

  const { data: rows, error: ownerError } = await supabase
    .from("sourcing_requests")
    .select("id")
    .eq("id", id)
    .eq("email", email)
    .limit(1)

  if (ownerError) return { error: NextResponse.json({ success: false, error: ownerError.message }, { status: 500 }) }
  if (!rows || rows.length === 0) return { error: NextResponse.json({ success: false, error: "Not found or unauthorized" }, { status: 404 }) }

  return { email }
}

export async function GET(req: Request, context: any) {
  try {
    const id = (context.params && context.params.id) || context.params?.id
    const owner = await assertOwner(req, id)
    if (owner.error) return owner.error

    const result = await ensureInvoiceForRequest(id, owner.email as string)
    if (result.error) return NextResponse.json({ success: false, error: result.error.message }, { status: 500 })

    return NextResponse.json({ success: true, invoice: result.invoice, skipped: result.skipped || false })
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
