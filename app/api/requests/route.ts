import { NextResponse } from "next/server"
import supabase from "@/lib/supabaseServer"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { branch: _ignoredBranch, ...payload } = body
    // Insert the incoming data into the sourcing_requests table.
    // The current schema does not include a branch column, so we only persist the real request fields.
    const finalPayload = { ...payload, created_at: new Date().toISOString() }

    const { data, error } = await supabase.from("sourcing_requests").insert([finalPayload]).select()

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: data?.[0]?.id ?? null }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
