"use client"
import { useState } from "react"
import SuccessConfirmation from "../components/SuccessConfirmation"
import BudgetConverter, { currencyOptions } from "@/app/components/BudgetConverter"

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
    budget: "",
    budgetCurrency: "USD",
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
        body: JSON.stringify(form),
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
      <form onSubmit={handleSubmit} className="brand-form card-hover">
        <h1 className="brand-heading">Lidell Consultancy B2B Concierge</h1>
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

        <div className="mt-3 grid gap-3">
          <div className="rounded-xl border border-gray-200 bg-white p-3">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Order size</span>
              <div className="mt-1 grid grid-cols-[minmax(0,1fr)_150px] gap-2">
                <input
                  type="number"
                  min="1"
                  name="orderSize"
                  value={form.orderSize}
                  onChange={handleChange}
                  className="rounded-md border-gray-200 p-2"
                  placeholder="e.g. 1000"
                />
                <select name="orderCurrency" value={form.orderCurrency} onChange={handleChange} className="rounded-md border-gray-200 p-2">
                  {currencyOptions.map((option) => (
                    <option key={option.code} value={option.code}>{option.code}</option>
                  ))}
                </select>
              </div>
              <div className="mt-2">
                {/* @ts-ignore */}
                <BudgetConverter value={form.orderSize} currency={form.orderCurrency as any} />
              </div>
            </label>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-3">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Estimated budget</span>
              <div className="mt-1 grid grid-cols-[minmax(0,1fr)_150px] gap-2">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  name="budget"
                  value={form.budget}
                  onChange={handleChange}
                  className="rounded-md border-gray-200 p-2"
                  placeholder="e.g. 2500"
                />
                <select name="budgetCurrency" value={form.budgetCurrency} onChange={handleChange} className="rounded-md border-gray-200 p-2">
                  {currencyOptions.map((option) => (
                    <option key={option.code} value={option.code}>{option.code}</option>
                  ))}
                </select>
              </div>
            </label>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-3">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Target timeline</span>
              <select name="timeline" value={form.timeline} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-200 p-2">
                <option value="">Select timeline</option>
                <option value="ASAP">ASAP</option>
                <option value="2-4 weeks">2-4 weeks</option>
                <option value="1-2 months">1-2 months</option>
                <option value="3-6 months">3-6 months</option>
                <option value="Flexible">Flexible</option>
              </select>
            </label>
          </div>
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
