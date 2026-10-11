"use client"
import Link from "next/link"
import ThemeToggle from "./ThemeToggle"
import BrandLogo from "./BrandLogo"

export default function BrandHeader() {
  return (
    <header className="w-full border-b border-transparent py-4 bg-transparent">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center">
            <BrandLogo size={40} />
          </div>
          <div>
            <div className="text-sm font-semibold text-[var(--brand-500)]">Lidell Consultancy</div>
            <div className="text-xs text-[var(--muted)]">Sourcing & curation</div>
          </div>
        </Link>

        <div className="flex items-center gap-4">
          <nav className="hidden md:flex items-center gap-4 text-sm text-[var(--brand-700)]">
            <Link href="/b2b" className="hover:underline">B2B</Link>
            <Link href="/personal-edit" className="hover:underline">Personal Edit</Link>
            <Link href="/portal" className="hover:underline">Portal</Link>
            <Link href="/admin" className="hover:underline">Admin</Link>
          </nav>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
