export default function BrandFooter() {
  return (
    <footer className="w-full border-t border-transparent mt-12 py-8 bg-transparent">
      <div className="max-w-6xl mx-auto px-4 text-center text-sm text-[var(--muted)]">
        <div className="mb-2">© {new Date().getFullYear()} Lidell Consultancy — Curated sourcing & concierge</div>
        <div>
          <a href="/" className="mx-2 hover:underline">Home</a>
          <a href="/b2b" className="mx-2 hover:underline">B2B</a>
          <a href="/personal-edit" className="mx-2 hover:underline">Personal Edit</a>
        </div>
      </div>
    </footer>
  )
}
