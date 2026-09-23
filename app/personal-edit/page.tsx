"use client"
import { useState } from "react"
import SuccessConfirmation from "../components/SuccessConfirmation"
import BudgetConverter, { currencyOptions, type CurrencyCode } from "@/app/components/BudgetConverter"
import PageSeo from "@/app/components/PageSeo"

export default function PersonalEditRequest() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    style: "",
    budget: "",
    budgetCurrency: "USD" as CurrencyCode,
    details: "",
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
      const res = await fetch("/api/personal-edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branch: "personal", ...form }),
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
      // render SuccessConfirmation component
      // component is a client component under app/components
      <div>
        {/* @ts-ignore */}
        <SuccessConfirmation
          trackingId={trackingId}
          title="Thanks — request received"
          subtitle="We’ll review your Personal Edit request and get back to you shortly."
        />
      </div>
    )
  }

  return (
    <main className="min-h-screen flex items-start justify-center p-6 bg-[var(--bg)]">
      <PageSeo
        title="Personal Edit Request"
        description="Submit a personal shopping and styling request, choose your budget currency, and get started with Lidell Consultancy."
      />
      <form onSubmit={handleSubmit} className="brand-form card-hover">
        <h1 className="brand-heading">Personal Edit — LIDELL</h1>
        <p className="brand-subtle mt-1">Personal shopping & styling in Turkey. Mobile-friendly request form.</p>

        <label className="block mt-4">
          <span className="text-sm font-medium text-gray-700">Full name</span>
          <input name="name" required value={form.name} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-200 shadow-sm p-2" placeholder="Your name" />
        </label>

        <div className="grid grid-cols-2 gap-3 mt-3">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Email</span>
            <input name="email" type="email" required value={form.email} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-200 p-2" placeholder="you@example.com" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Phone</span>
            <input name="phone" value={form.phone} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-200 p-2" placeholder="+254..." />
          </label>
        </div>

        <label className="block mt-3">
          <span className="text-sm font-medium text-gray-700">Style preferences</span>
          <select name="style" value={form.style} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-200 p-2">
            <option value="">Select</option>
            <option>Casual</option>
            <option>Smart casual</option>
            <option>Formal</option>
            <option>Luxury</option>
          </select>
        </label>

        <label className="block mt-3">
          <span className="text-sm font-medium text-gray-700">Budget</span>
          <div className="mt-1 flex gap-2">
            <input name="budget" value={form.budget} onChange={handleChange} className="flex-1 rounded-md border-gray-200 p-2" placeholder="e.g. 200-500" />
            <select name="budgetCurrency" value={form.budgetCurrency} onChange={handleChange} className="w-44 rounded-md border-gray-200 p-2">
              {currencyOptions.map((option) => (
                <option key={option.code} value={option.code}>{option.label}</option>
              ))}
            </select>
          </div>
        </label>
        <div className="mt-1">
          <BudgetConverter value={form.budget} currency={form.budgetCurrency} />
        </div>

        <label className="block mt-3">
          <span className="text-sm font-medium text-gray-700">Additional details</span>
          <textarea name="details" value={form.details} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-200 p-2" rows={4} placeholder="Sizes, favorite brands, must-haves..."></textarea>
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

// SuccessConfirmation imported above
