"use client"
import { useState } from "react"
import SuccessConfirmation from "../components/SuccessConfirmation"
import BudgetConverter, { currencyOptions } from "@/app/components/BudgetConverter"
import PageSeo from "@/app/components/PageSeo"

export default function B2BRequest() {
  const [form, setForm] = useState({
    company: "",
    contact: "",
    email: "",
    phone: "",
    businessType: "",
    categories: "",
    orderSize: "",
    orderCurrency: "USD",
    timeline: "",
    notes: "",
  })
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [trackingId, setTrackingId] = useState<number | null>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setForm((s) => ({ ...s, [name]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      const res = await fetch("/api/b2b", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branch: "b2b", ...form }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error || "Failed to submit request")
        return
      }
      setTrackingId(json.id ?? null)
      setSubmitted(true)
    } catch (err) {
      setError(String(err))
    }
  }

  if (submitted) {
    return (
      <SuccessConfirmation
        trackingId={trackingId}
        title="Request submitted"
        subtitle="Thanks — our B2B sourcing team will contact you shortly."
      />
    )
  }

  return (
    <main className="min-h-screen flex items-start justify-center p-6 bg-[var(--bg)]">
      <PageSeo
        title="B2B Concierge"
        description="Send wholesale and sourcing requests, choose a currency, and get a reply from the Lidell team."
      />
      <form onSubmit={handleSubmit} className="brand-form card-hover">
        <h1 className="brand-heading">B2B Concierge — LIDELL</h1>
        <p className="brand-subtle mt-1">Sourcing & wholesale requests for Zambian businesses. Mobile-first form.</p>

        <label className="block mt-4">
          <span className="text-sm font-medium text-gray-700">Company name</span>
          <input name="company" required value={form.company} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-200 p-2" placeholder="Company Ltd." />
        </label>

        <label className="block mt-3">
          <span className="text-sm font-medium text-gray-700">Contact person</span>
          <input name="contact" value={form.contact} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-200 p-2" placeholder="Name" />
        </label>

        <div className="grid grid-cols-2 gap-3 mt-3">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Email</span>
            <input name="email" type="email" required value={form.email} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-200 p-2" placeholder="you@company.com" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Phone</span>
            <input name="phone" value={form.phone} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-200 p-2" placeholder="+260..." />
          </label>
        </div>

        <label className="block mt-3">
          <span className="text-sm font-medium text-gray-700">Business type</span>
          <select name="businessType" value={form.businessType} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-200 p-2">
            <option value="">Select</option>
            <option>Retail</option>
            <option>Distributor</option>
            <option>Marketplace</option>
            <option>Other</option>
          </select>
        </label>

        <label className="block mt-3">
          <span className="text-sm font-medium text-gray-700">Product categories</span>
          <input name="categories" value={form.categories} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-200 p-2" placeholder="e.g. apparel, homeware" />
        </label>

        <div className="grid grid-cols-2 gap-3 mt-3">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Order size</span>
            <div className="mt-1 flex gap-2">
              <input name="orderSize" value={form.orderSize} onChange={handleChange} className="flex-1 rounded-md border-gray-200 p-2" placeholder="e.g. 1000 or 5000" />
              <select name="orderCurrency" value={form.orderCurrency} onChange={handleChange} className="w-28 rounded-md border-gray-200 p-2">
                {currencyOptions.map((option) => (
                  <option key={option.code} value={option.code}>{option.label}</option>
                ))}
              </select>
            </div>
            <div className="mt-2">
              {/* @ts-ignore */}
              <BudgetConverter value={form.orderSize} currency={form.orderCurrency as any} />
            </div>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Timeline</span>
            <input name="timeline" value={form.timeline} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-200 p-2" placeholder="e.g. 4-6 weeks" />
          </label>
        </div>

        <label className="block mt-3">
          <span className="text-sm font-medium text-gray-700">Notes</span>
          <textarea name="notes" value={form.notes} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-200 p-2" rows={4} placeholder="Any additional requirements..."></textarea>
        </label>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <div className="mt-6 flex items-center justify-between">
          <button type="submit" className="brand-btn-primary">
            Submit request
          </button>
          <a href="/" className="text-sm text-[var(--muted)]">Back to home</a>
        </div>
      </form>
    </main>
  )
}
