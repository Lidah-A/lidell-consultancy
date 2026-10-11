import { NextResponse } from "next/server"
import supabase from "@/lib/supabaseServer"
import { sanitizeSourcingRequestPayload } from "@/lib/requestType"
import { z } from "zod"
import { notifyTeam } from "../../../lib/notify"

const B2BSchema = z.object({
  company: z.string().min(1),
  email: z.string().email(),
  contact: z.string().optional(),
  phone: z.string().optional(),
  businessType: z.string().optional(),
  categories: z.string().optional(),
  orderSize: z.string().optional(),
  orderCurrency: z.string().optional(),
  budget: z.string().optional(),
  budgetCurrency: z.string().optional(),
  timeline: z.string().optional(),
  notes: z.string().optional(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { branch: _ignoredBranch, ...cleanBody } = body
    const parsed = B2BSchema.safeParse(cleanBody)
    if (!parsed.success) {
      const err = parsed.error.flatten()
      return NextResponse.json({ success: false, error: err.fieldErrors || err.formErrors }, { status: 400 })
    }

    const { company, email, contact, phone, businessType, categories, orderSize, orderCurrency, budget, budgetCurrency, timeline, notes } = parsed.data

    const payload = sanitizeSourcingRequestPayload({
      company,
      contact: contact ?? null,
      email,
      phone: phone ?? null,
      business_type: businessType ?? null,
      categories: categories ?? null,
      order_size: orderSize ?? null,
      order_currency: orderCurrency ?? null,
      budget: budget ?? null,
      budgetCurrency: budgetCurrency ?? null,
      timeline: timeline ?? null,
      notes: notes ?? null,
      created_at: new Date().toISOString(),
    })

    const { data, error } = await supabase.from("sourcing_requests").insert([payload]).select()

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

    return NextResponse.json({ success: true, id: data?.[0]?.id ?? null }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
