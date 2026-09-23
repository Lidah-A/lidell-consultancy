"use client"

import Link from "next/link"
import { FormEvent, useState } from "react"
import supabase from "@/lib/supabaseClient"
import PageSeo from "@/app/components/PageSeo"

export default function PortalSignupPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function signUp(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!email || !password) {
      setError("Email and password are required")
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setLoading(true)
    const res = await supabase.auth.signUp({
      email,
      password,
    })
    setLoading(false)

    if (res.error) {
      setError(res.error.message)
      return
    }

    if (res.data?.session) {
      setSuccess("Account created. You are signed in. You can now open your portal.")
      return
    }

    setSuccess("Account created. Check your email to confirm your account, then sign in.")
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-[var(--bg)]">
      <PageSeo
        title="Client Portal Sign Up"
        description="Create a client account to track requests, shipping updates, and order status."
      />

      <form onSubmit={signUp} className="brand-form">
        <h1 className="brand-heading">Create Client Account</h1>
        <p className="brand-subtle mt-2">Use the same email you use for your requests.</p>

        <label className="block mt-4">
          <span className="text-sm">Email</span>
          <input
            type="email"
            className="mt-1 w-full p-2 border rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label className="block mt-3">
          <span className="text-sm">Password</span>
          <input
            type="password"
            className="mt-1 w-full p-2 border rounded"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        <label className="block mt-3">
          <span className="text-sm">Confirm Password</span>
          <input
            type="password"
            className="mt-1 w-full p-2 border rounded"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </label>

        {error && <p className="text-red-600 mt-3 text-sm">{error}</p>}
        {success && <p className="text-green-700 mt-3 text-sm">{success}</p>}

        <div className="mt-4 flex items-center gap-3">
          <button disabled={loading} className="brand-btn-primary disabled:opacity-60">
            {loading ? "Creating..." : "Create account"}
          </button>
          <Link href="/portal" className="text-sm underline">
            Back to sign in
          </Link>
        </div>
      </form>
    </main>
  )
}
