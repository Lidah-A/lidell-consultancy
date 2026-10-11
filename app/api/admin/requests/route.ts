import { NextResponse } from "next/server"
import supabase from "@/lib/supabaseServer"
import { getRequestBranch } from "@/lib/requestType"

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || process.env.TEAM_NOTIFICATION_EMAIL || "").split(",").map(s => s.trim()).filter(Boolean)

export async function GET(req: Request) {
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

    const { data, error } = await supabase.from("sourcing_requests").select("*").order("created_at", { ascending: false })
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })

    const requests = (data || []).map((request: Record<string, any>) => ({
      ...request,
      branch: request.branch ?? getRequestBranch(request),
    }))

    return NextResponse.json({ success: true, requests })
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
