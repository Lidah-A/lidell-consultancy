"use client"
import { useEffect, useRef, useState } from "react"
import { renderQRCodeToCanvas } from "../../../lib/qr"
import PageSeo from "@/app/components/PageSeo"

export default function QRGenerator() {
  const [target, setTarget] = useState("/personal-edit")
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const url = typeof window !== "undefined" ? `${window.location.origin}${target}` : target

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    renderQRCodeToCanvas(url, 400, canvas)
  }, [target, url])

  function download() {
    const canvas = canvasRef.current
    if (!canvas) return
    try {
      canvas.toBlob((blob) => {
        if (!blob) return
        const urlBlob = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = urlBlob
        a.download = `the-link-qr-${target.replace("/", "")}.png`
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(urlBlob)
      }, "image/png")
    } catch (err) {
      console.error("Failed to download QR", err)
      alert("Failed to download QR: " + String(err))
    }
  }

  return (
    <main className="min-h-screen p-6 bg-gray-50 flex items-start justify-center">
      <PageSeo
        title="QR Code Generator"
        description="Generate downloadable QR codes for The Link request pages."
      />
      <div className="w-full max-w-lg bg-white rounded shadow p-6">
        <h1 className="text-lg font-semibold">QR Code Generator</h1>
        <p className="text-sm text-gray-600 mt-1">Generate downloadable QR codes for portal pages (dependency-free).</p>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700">Target page</label>
          <select value={target} onChange={(e) => setTarget(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 p-2">
            <option value="/personal-edit">/personal-edit</option>
            <option value="/b2b">/b2b</option>
          </select>
        </div>

        <div className="mt-6 flex flex-col items-center">
          <div className="bg-white p-4 rounded">
            <canvas ref={canvasRef} width={400} height={400} />
          </div>
          <div className="mt-4 flex gap-3">
            <button onClick={download} className="px-4 py-2 bg-blue-600 text-white rounded">Download PNG</button>
            <a href={url} target="_blank" rel="noreferrer" className="px-4 py-2 bg-gray-100 rounded">Open target</a>
          </div>
        </div>
      </div>
    </main>
  )
}
