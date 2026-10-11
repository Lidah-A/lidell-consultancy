import { NextResponse } from "next/server"
import supabase from "@/lib/supabaseServer"
import { getRequestBranch } from "@/lib/requestType"
import { z } from "zod"

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || process.env.TEAM_NOTIFICATION_EMAIL || "").split(",").map(s => s.trim()).filter(Boolean)

const UpdateSchema = z.object({
  status: z.string().optional(),
  notes: z.string().optional(),
})

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
    const updates = parsed.data

    const { data, error } = await supabase.from("sourcing_requests").update(updates).eq("id", id).select()
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    const request = data?.[0] ? { ...data[0], branch: data[0].branch ?? getRequestBranch(data[0]) } : null
    return NextResponse.json({ success: true, request })
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
    const request = data?.[0] ? { ...data[0], branch: data[0].branch ?? getRequestBranch(data[0]) } : null
    return NextResponse.json({ success: true, request })
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
