import { NextResponse } from "next/server"
import supabase from "@/lib/supabaseServer"

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || process.env.TEAM_NOTIFICATION_EMAIL || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean)

function isMissingHistoryTable(message: string) {
  const m = message.toLowerCase()
  return m.includes("request_status_history") && (m.includes("does not exist") || m.includes("could not find"))
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
    const { data, error } = await supabase
      .from("request_status_history")
      .select("*")
      .eq("request_id", id)
      .order("created_at", { ascending: false })

    if (error) {
      if (isMissingHistoryTable(error.message)) {
        return NextResponse.json({ success: true, history: [] })
      }
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, history: data || [] })
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
