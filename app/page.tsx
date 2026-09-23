import PageSeo from "./components/PageSeo"

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#fef3c7_0%,#fff7ed_28%,#ffffff_60%)] text-zinc-950">
      <PageSeo
        title="Home"
        description="Lidell Consultancy sourcing platform for personal edit requests, B2B sourcing, and Your Personal Assistant support."
      />
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-6 py-16 sm:px-10 lg:px-12">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center rounded-full border border-amber-200 bg-white/80 px-4 py-2 text-sm font-medium text-amber-900 shadow-sm backdrop-blur">
              Lidell Consultancy is live and ready
            </div>

            <div className="space-y-5">
              <h1 className="max-w-3xl text-5xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
                Requests, sourcing, and support in one clean workflow.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-zinc-700 sm:text-xl">
                Submit a personal edit request, send a B2B sourcing request, or open Your Personal Assistant for quick help. Built to be simple on mobile and fast to launch.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href="/personal-edit"
                className="inline-flex h-12 items-center justify-center rounded-full bg-zinc-950 px-6 text-sm font-semibold text-white transition hover:bg-zinc-800"
              >
                Start a personal request
              </a>
              <a
                href="/b2b"
                className="inline-flex h-12 items-center justify-center rounded-full border border-zinc-300 bg-white/80 px-6 text-sm font-semibold text-zinc-900 transition hover:border-zinc-400 hover:bg-white"
              >
                Open B2B request
              </a>
              <a
                href="/chat"
                className="inline-flex h-12 items-center justify-center rounded-full border border-transparent px-6 text-sm font-semibold text-zinc-700 transition hover:bg-white/70 hover:text-zinc-950"
              >
                Ask Your Personal Assistant
              </a>
            </div>

            <div className="grid gap-4 pt-2 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur">
                <div className="text-sm font-medium text-zinc-500">Personal edit</div>
                <div className="mt-2 text-lg font-semibold">Quick request form</div>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur">
                <div className="text-sm font-medium text-zinc-500">B2B</div>
                <div className="mt-2 text-lg font-semibold">Sourcing workflow</div>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur">
                <div className="text-sm font-medium text-zinc-500">Support</div>
                <div className="mt-2 text-lg font-semibold">Built-in personal assistant</div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-amber-300/40 via-orange-200/30 to-white blur-2xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.12)] backdrop-blur">
              <div className="space-y-4">
                <div className="text-sm font-semibold uppercase tracking-[0.24em] text-zinc-500">Launch checklist</div>
                <div className="space-y-3">
                  <div className="rounded-2xl bg-zinc-950 p-4 text-white">
                    <div className="text-sm text-zinc-300">1. Request pages</div>
                    <div className="mt-1 text-lg font-semibold">Personal Edit + B2B ready</div>
                  </div>
                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                    <div className="text-sm text-zinc-500">2. Backend</div>
                    <div className="mt-1 text-lg font-semibold">Supabase and notifications connected</div>
                  </div>
                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                    <div className="text-sm text-zinc-500">3. Support</div>
                    <div className="mt-1 text-lg font-semibold">Personal assistant and admin routes available</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
