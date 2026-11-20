"use client"

import { useState } from "react"
import Link from "next/link"
import supabase from "@/lib/supabaseClient"

export default function AdminSignupPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setMessage(null)

    if (password.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setLoading(true)
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name, role: "admin" },
        emailRedirectTo: `${window.location.origin}/admin`,
      },
    })
    setLoading(false)

    if (signUpError) {
      setError(signUpError.message)
      return
    }

    if (data?.session) {
      setMessage("Admin account created. Redirecting to the dashboard...")
      window.location.assign("/admin")
    } else {
      setMessage("Account created. Check your email to confirm it, then sign in at the admin page.")
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-[var(--bg)]">
      <form onSubmit={handleSubmit} className="brand-form">
        <h1 className="brand-heading">Lidell Consultancy Admin — Sign up</h1>
        <p className="brand-subtle mt-2">Create an authorised administrator account.</p>

        <label className="block mt-4">
          <span className="text-sm">Full name</span>
          <input
            required
            autoComplete="name"
            className="mt-1 w-full p-2 border rounded"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>

        <label className="block mt-3">
          <span className="text-sm">Email</span>
          <input
            required
            type="email"
            autoComplete="email"
            className="mt-1 w-full p-2 border rounded"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>

        <label className="block mt-3">
          <span className="text-sm">Password</span>
          <input
            required
            type="password"
            minLength={8}
            autoComplete="new-password"
            className="mt-1 w-full p-2 border rounded"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>

        <label className="block mt-3">
          <span className="text-sm">Confirm password</span>
          <input
            required
            type="password"
            minLength={8}
            autoComplete="new-password"
            className="mt-1 w-full p-2 border rounded"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
        </label>

        {error && <p className="text-red-600 mt-3">{error}</p>}
        {message && <p className="text-green-700 mt-3">{message}</p>}

        <div className="mt-4 flex justify-between items-center">
          <button type="submit" disabled={loading} className="brand-btn-primary">
            {loading ? "Creating account..." : "Create account"}
          </button>
          <Link href="/admin" className="text-sm text-[var(--muted)]">
            Back to sign in
          </Link>
        </div>
      </form>
    </main>
  )
}
