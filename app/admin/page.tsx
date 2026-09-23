"use client"
import Link from "next/link"
import { useEffect, useState } from "react"
import supabase from "@/lib/supabaseClient"
import PageSeo from "@/app/components/PageSeo"

export default function AdminPage() {
  const [session, setSession] = useState<any>(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [requests, setRequests] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<Record<string, { status?: string; notes?: string }>>({})

  useEffect(() => {
    supabase.auth.getSession().then(({ data }: any) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_evt: any, sess: any) => {
      setSession(sess ?? null)
    })
    return () => { sub.subscription?.unsubscribe() }
  }, [])

  async function signIn(e: any) {
    e.preventDefault()
    setError(null)
    const res = await supabase.auth.signInWithPassword({ email, password })
    if (res.error) setError(res.error.message)
    else setSession(res.data.session)
  }

  async function loadAll() {
    setError(null)
    const token = session?.access_token
    const res = await fetch("/api/admin/requests", { headers: { Authorization: `Bearer ${token}` } })
    const json = await res.json()
    if (!res.ok) setError(json.error || "Failed to load")
    else setRequests(json.requests || [])
  }

  async function updateRequest(id: number) {
    setError(null)
    const token = session?.access_token
    const edits = editing[id]
    if (!edits) return
    const res = await fetch(`/api/admin/requests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(edits),
    })
    const json = await res.json()
    if (!res.ok) setError(json.error || 'Failed to update')
    else {
      // refresh the list
      await loadAll()
      // clear editing for this id
      setEditing((s) => { const next = { ...s }; delete next[id]; return next })
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setSession(null)
    setRequests([])
  }

  const normalizedSearch = search.trim().toLowerCase()
  const statusOptions = Array.from(
    new Set(
      requests
        .map((r) => (r.order_status || r.status || "pending").toString())
        .filter(Boolean)
    )
  )

  const filteredRequests = requests.filter((r) => {
    const clientName = (r.name ?? r.company ?? "").toString().toLowerCase()
    const clientEmail = (r.email ?? "").toString().toLowerCase()
    const status = (r.order_status || r.status || "pending").toString().toLowerCase()

    const matchesSearch = !normalizedSearch || clientName.includes(normalizedSearch) || clientEmail.includes(normalizedSearch)
    const matchesStatus = statusFilter === "all" || status === statusFilter.toLowerCase()
    return matchesSearch && matchesStatus
  })

  if (!session) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 bg-[var(--bg)]">
        <form onSubmit={signIn} className="brand-form">
          <h1 className="brand-heading">Admin — Sign in</h1>
          <label className="block mt-4"><span className="text-sm">Email</span><input className="mt-1 w-full p-2 border rounded" value={email} onChange={e=>setEmail(e.target.value)} /></label>
          <label className="block mt-3"><span className="text-sm">Password</span><input type="password" className="mt-1 w-full p-2 border rounded" value={password} onChange={e=>setPassword(e.target.value)} /></label>
          {error && <p className="text-red-600 mt-2">{error}</p>}
          <div className="mt-4 flex justify-between items-center gap-3">
            <button className="brand-btn-primary">Sign in</button>
          </div>
          <p className="mt-3 text-sm text-gray-600">
            Need a new admin account? <Link href="/admin/signup" className="underline">Create admin account</Link>
          </p>
          <p className="mt-2 text-sm text-gray-600">
            Use the same admin email listed in your Vercel env var <span className="font-medium">ADMIN_EMAILS</span> to grant access.
          </p>
        </form>
      </main>
    )
  }

  return (
    <main className="min-h-screen p-6 bg-[var(--bg)]">
        <PageSeo
          title="Admin Dashboard"
          description="Review and update incoming B2B and Personal Edit requests."
        />
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center">
          <h1 className="brand-heading">Admin Dashboard</h1>
          <div>
            <button onClick={signOut} className="brand-btn-accent">Sign out</button>
          </div>
        </div>
        <p className="brand-subtle mt-2">All incoming B2B and Personal Edit requests.</p>

        <div className="mt-4">
          <button onClick={loadAll} className="brand-btn-primary">Load all requests</button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="md:col-span-2">
            <label className="text-sm text-gray-700">Search client</label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mt-1 w-full rounded border p-2"
              placeholder="Search by name, company, or email"
            />
          </div>
          <div>
            <label className="text-sm text-gray-700">Filter by status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="mt-1 w-full rounded border p-2"
            >
              <option value="all">All statuses</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>

        {error && <p className="mt-4 text-red-600">{error}</p>}

        <div className="mt-4 grid grid-cols-1 gap-3">
          {filteredRequests.map((r) => (
            <div key={r.id} className="brand-card">
              <div className="flex justify-between">
                <div>
                  <div className="text-sm text-gray-500">{r.branch?.toUpperCase()}</div>
                  <div className="font-medium">{r.name ?? r.company}</div>
                  <div className="text-sm text-gray-600">{r.email}</div>
                </div>
                <div className="text-sm text-gray-500">ID: <span className="tracking-id">{r.id}</span></div>
              </div>
              <div className="mt-2 text-sm text-gray-700">{r.details || r.notes || "—"}</div>
              <div className="mt-3 flex items-center gap-3">
                <label className="text-sm">Status</label>
                <select
                  value={editing[r.id]?.status ?? r.status ?? 'Pending'}
                  onChange={(e) => setEditing((s) => ({ ...s, [r.id]: { ...(s[r.id] ?? {}), status: e.target.value } }))}
                  className="p-1 border rounded"
                >
                  <option>Pending</option>
                  <option>In Progress</option>
                  <option>Sourced</option>
                  <option>Completed</option>
                </select>

                <label className="text-sm">Notes</label>
                <input
                  value={editing[r.id]?.notes ?? r.notes ?? ''}
                  onChange={(e) => setEditing((s) => ({ ...s, [r.id]: { ...(s[r.id] ?? {}), notes: e.target.value } }))}
                  className="p-1 border rounded w-64"
                />

                <button onClick={() => updateRequest(r.id)} className="brand-btn-primary">Save</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
