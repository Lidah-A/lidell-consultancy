"use client"
import { useEffect, useState } from "react"
import supabase from "@/lib/supabaseClient"
import { getRequestBranch } from "@/lib/requestType"

export default function PortalPage() {
  const [session, setSession] = useState<any>(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }: any) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_evt: any, sess: any) => setSession(sess ?? null))
    return () => { sub.subscription?.unsubscribe() }
  }, [])

  async function signIn(e: any) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const res = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (res.error) setError(res.error.message)
    else setSession(res.data.session)
  }

  async function loadRequests() {
    setLoading(true)
    const token = session?.access_token
    const res = await fetch("/api/portal/requests", { headers: { Authorization: `Bearer ${token}` } })
    const json = await res.json()
    setLoading(false)
    if (!res.ok) setError(json.error || "Failed to load")
    else setRequests(json.requests || [])
  }

  async function signOut() {
    await supabase.auth.signOut()
    setSession(null)
    setRequests([])
  }

  if (!session) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 bg-[var(--bg)]">
        <form onSubmit={signIn} className="brand-form">
          <h1 className="brand-heading">Lidell Consultancy Client Portal — Sign in</h1>
          <label className="block mt-4"><span className="text-sm">Email</span><input className="mt-1 w-full p-2 border rounded" value={email} onChange={e=>setEmail(e.target.value)} /></label>
          <label className="block mt-3"><span className="text-sm">Password</span><input type="password" className="mt-1 w-full p-2 border rounded" value={password} onChange={e=>setPassword(e.target.value)} /></label>
          {error && <p className="text-red-600 mt-2">{error}</p>}
          <div className="mt-4 flex justify-between items-center">
            <button className="brand-btn-primary">Sign in</button>
          </div>
        </form>
      </main>
    )
  }

  return (
    <main className="min-h-screen p-6 bg-[var(--bg)]">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center">
          <h1 className="brand-heading">Lidell Consultancy Client Portal</h1>
          <div>
            <button onClick={signOut} className="brand-btn-accent">Sign out</button>
          </div>
        </div>
        <p className="brand-subtle mt-2">View the status of your requests and sourced items.</p>

        <div className="mt-4">
          <button onClick={loadRequests} className="brand-btn-primary">Load my requests</button>
        </div>

        {loading && <p className="mt-4">Loading...</p>}
        <div className="mt-4 space-y-3">
          {requests.map((r) => {
            const branch = getRequestBranch(r)
            return (
            <div key={r.id} className="brand-card card-hover">
              <div className="flex justify-between">
                <div>
                  <div className="text-sm text-gray-500">{branch.toUpperCase()}</div>
                  <div className="font-medium">{r.name ?? r.company}</div>
                  <div className="text-sm text-gray-600">{r.email}</div>
                  <div className="mt-1"><span className="text-xs font-medium text-gray-700">Status: </span><span className="text-sm">{r.status ?? 'Pending'}</span></div>
                </div>
                <div className="text-sm text-gray-500">ID: <span className="tracking-id">{r.id}</span></div>
              </div>
              <div className="mt-2 text-sm text-gray-700">{r.details || r.notes || "—"}</div>
            </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}
