"use client"

import Link from "next/link"
import { useState } from "react"
import supabase from "@/lib/supabaseClient"
import PageSeo from "@/app/components/PageSeo"

export default function AdminSignupPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!email || !password) {
      setError("Enter both an email and a password.")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.")
      return
    }

    const res = await supabase.auth.signUp({ email, password })
    if (res.error) {
      setError(res.error.message)
      return
    }

    setSuccess("Admin account created. Check your email to confirm, then sign in from the admin page.")
    setEmail("")
    setPassword("")
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-[var(--bg)]">
      <PageSeo
        title="Admin Sign Up"
        description="Create a new admin account for the Lidell consultancy dashboard."
      />

      <form onSubmit={handleSubmit} className="brand-form">
        <h1 className="brand-heading">Admin — Create account</h1>
        <p className="brand-subtle mt-2">Create the admin login that will be used to manage client requests.</p>

        <label className="block mt-4">
          <span className="text-sm font-medium text-gray-700">Admin email</span>
          <input
            className="mt-1 w-full p-2 border rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="admin@yourdomain.com"
          />
        </label>

        <label className="block mt-3">
          <span className="text-sm font-medium text-gray-700">Password</span>
          <input
            className="mt-1 w-full p-2 border rounded"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="At least 6 characters"
          />
        </label>

        {error && <p className="text-red-600 mt-3">{error}</p>}
        {success && <p className="text-green-600 mt-3">{success}</p>}

        <div className="mt-4 flex items-center justify-between gap-3">
          <button className="brand-btn-primary">Create admin account</button>
          <Link href="/admin" className="text-sm text-gray-700 underline">
            Back to sign in
          </Link>
        </div>

        <p className="mt-3 text-sm text-gray-600">
          Make sure this email is included in <span className="font-medium">ADMIN_EMAILS</span> in your production env to be allowed into the dashboard.
        </p>
      </form>
    </main>
  )
}
