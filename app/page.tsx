import PageSeo from "./components/PageSeo"

const serviceHighlights = [
  {
    title: "B2B sourcing",
    description: "We source trusted suppliers, compare options, and help you move quickly with confidence.",
  },
  {
    title: "Concierge support",
    description: "From enquiries to fulfilment, we keep the process streamlined and easy to manage.",
  },
  {
    title: "Clear onboarding",
    description: "Clients can submit requests, track updates, and stay informed from start to finish.",
  },
]

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#fef3c7_0%,#fff7ed_28%,#ffffff_60%)] text-zinc-950">
      <PageSeo
        title="Lidell Consultancy | B2B Sourcing & Concierge Services"
        description="Lidell Consultancy helps clients with sourcing, concierge support, and streamlined onboarding through a simple client portal experience."
      />

      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-6 py-16 sm:px-10 lg:px-12">
        <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center rounded-full border border-amber-200 bg-white/80 px-4 py-2 text-sm font-medium text-amber-900 shadow-sm backdrop-blur">
              Lidell Consultancy
            </div>

            <div className="space-y-5">
              <h1 className="max-w-3xl text-5xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
                Smarter sourcing. Clearer support. Better client experience.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-zinc-700 sm:text-xl">
                Lidell Consultancy helps businesses and private clients move faster with practical sourcing support, concierge-style coordination, and a streamlined onboarding process built around clarity and trust.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href="/portal"
                className="inline-flex h-12 items-center justify-center rounded-full bg-zinc-950 px-6 text-sm font-semibold text-white transition hover:bg-zinc-800"
              >
                Get Started
              </a>
              <a
                href="/b2b"
                className="inline-flex h-12 items-center justify-center rounded-full border border-zinc-300 bg-white/80 px-6 text-sm font-semibold text-zinc-900 transition hover:border-zinc-400 hover:bg-white"
              >
                Explore B2B requests
              </a>
            </div>

            <div className="grid gap-4 pt-2 sm:grid-cols-3">
              {serviceHighlights.map((item) => (
                <div key={item.title} className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur">
                  <div className="text-sm font-medium text-zinc-500">{item.title}</div>
                  <p className="mt-2 text-sm leading-6 text-zinc-700">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-amber-300/40 via-orange-200/30 to-white blur-2xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.12)] backdrop-blur">
              <div className="space-y-5">
                <div className="text-sm font-semibold uppercase tracking-[0.24em] text-zinc-500">How it works</div>

                <div className="space-y-3">
                  <div className="rounded-2xl bg-zinc-950 p-4 text-white">
                    <div className="text-sm text-zinc-300">Step 1</div>
                    <div className="mt-1 text-lg font-semibold">Tell us what you need</div>
                  </div>
                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                    <div className="text-sm text-zinc-500">Step 2</div>
                    <div className="mt-1 text-lg font-semibold">We match and coordinate</div>
                  </div>
                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                    <div className="text-sm text-zinc-500">Step 3</div>
                    <div className="mt-1 text-lg font-semibold">Track updates from the portal</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
