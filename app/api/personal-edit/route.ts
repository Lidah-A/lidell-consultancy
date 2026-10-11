import { NextResponse } from "next/server"
import supabase from "@/lib/supabaseServer"
import { z } from "zod"
import { notifyTeam } from "../../../lib/notify"

const PersonalSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  style: z.string().optional(),
  budget: z.string().optional(),
  details: z.string().optional(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { branch: _ignoredBranch, ...cleanBody } = body
    const parsed = PersonalSchema.safeParse(cleanBody)
    if (!parsed.success) {
      const err = parsed.error.flatten()
      return NextResponse.json({ success: false, error: err.fieldErrors || err.formErrors }, { status: 400 })
    }

    const { name, email, phone, style, budget, details } = parsed.data

    const payload = {
      name,
      email,
      phone: phone ?? null,
      style: style ?? null,
      budget: budget ?? null,
      details: details ?? null,
      created_at: new Date().toISOString(),
    }

    const { data, error } = await supabase.from("sourcing_requests").insert([payload]).select()

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    // send email notification to team (best-effort)
    ;(async () => {
      try {
        const id = data?.[0]?.id ?? null
        const subject = `New Personal Edit request #${id}`
        const text = `New Personal Edit request submitted. ID: ${id}\nName: ${name}\nEmail: ${email}\nBudget: ${budget || "n/a"}`
        const html = `<p>New Personal Edit request submitted.</p><p><strong>ID:</strong> ${id}</p><p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p>`
        await notifyTeam(subject, text, html)
      } catch (e) {
        console.error(e)
      }
    })()

    return NextResponse.json({ success: true, id: data?.[0]?.id ?? null }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
