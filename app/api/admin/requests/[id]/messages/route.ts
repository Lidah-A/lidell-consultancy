import { NextResponse } from "next/server"
import supabase from "@/lib/supabaseServer"
import { z } from "zod"

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || process.env.TEAM_NOTIFICATION_EMAIL || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean)

const BodySchema = z.object({
  message: z.string().min(1),
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
    const { data, error } = await supabase
      .from("request_messages")
      .select("*")
      .eq("request_id", id)
      .order("created_at", { ascending: true })

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, messages: data || [] })
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
    const payload = {
      request_id: id,
      sender_email: auth.email,
      sender_role: "admin",
      message: parsed.data.message,
      created_at: new Date().toISOString(),
    }

    const { data, error } = await supabase.from("request_messages").insert([payload]).select().limit(1)
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })

    return NextResponse.json({ success: true, message: data?.[0] ?? null }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
