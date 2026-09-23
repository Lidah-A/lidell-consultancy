import { NextResponse } from "next/server"
import supabase from "@/lib/supabaseServer"
import { z } from "zod"
import { notifyTeam } from "../../../lib/notify"
import { ensureInvoiceForRequest } from "@/lib/orderInvoice"

async function insertWithSchemaFallback(initialPayload: Record<string, unknown>) {
  const payload: Record<string, unknown> = { ...initialPayload }

  for (let attempt = 0; attempt < 12; attempt++) {
    const { data, error } = await supabase.from("sourcing_requests").insert([payload]).select()

    if (!error) return { data, error: null }

    const missingColumn = /Could not find the '([^']+)' column/.exec(error.message)?.[1]
    if (!missingColumn || !(missingColumn in payload)) {
      return { data: null, error }
    }

    delete payload[missingColumn]
  }

  return {
    data: null,
    error: { message: "Insert failed after removing unsupported columns." },
  }
}

const B2BSchema = z.object({
  company: z.string().min(1),
  email: z.string().email(),
  contact: z.string().optional(),
  phone: z.string().optional(),
  businessType: z.string().optional(),
  categories: z.string().optional(),
  orderSize: z.string().optional(),
  timeline: z.string().optional(),
  notes: z.string().optional(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = B2BSchema.safeParse(body)
    if (!parsed.success) {
      const err = parsed.error.flatten()
      return NextResponse.json({ success: false, error: err.fieldErrors || err.formErrors }, { status: 400 })
    }

    const { company, email, contact, phone, businessType, categories, orderSize, timeline, notes } = parsed.data

    const payload = {
      branch: "b2b",
      company,
      contact: contact ?? null,
      email,
      phone: phone ?? null,
      business_type: businessType ?? null,
      categories: categories ?? null,
      order_size: orderSize ?? null,
      timeline: timeline ?? null,
      notes: notes ?? null,
      created_at: new Date().toISOString(),
    }

    const { data, error } = await insertWithSchemaFallback(payload)

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    // send notification to team
    ;(async () => {
      try {
        const id = data?.[0]?.id ?? null
        const subject = `New B2B request #${id}`
        const text = `New B2B request submitted. ID: ${id}\nCompany: ${company}\nEmail: ${email}\nCategories: ${categories || "n/a"}`
        const html = `<p>New B2B request submitted.</p><p><strong>ID:</strong> ${id}</p><p><strong>Company:</strong> ${company}</p><p><strong>Email:</strong> ${email}</p>`
        await notifyTeam(subject, text, html)
      } catch (e) {
        console.error(e)
      }
    })()

    const requestId = data?.[0]?.id ?? null
    if (requestId) {
      try {
        await ensureInvoiceForRequest(String(requestId), "system")
      } catch (e) {
        console.warn("Failed to auto-generate invoice", e)
      }
    }

    return NextResponse.json({ success: true, id: requestId }, { status: 201 })
  } catch (err) {
    console.error("/api/b2b failed", err)
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
