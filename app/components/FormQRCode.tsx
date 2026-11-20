"use client"

import { useEffect, useState } from "react"
import QRCode from "qrcode"

interface FormQRCodeProps {
  path: "/b2b" | "/personal-edit"
  title: string
}

export default function FormQRCode({ path, title }: FormQRCodeProps) {
  const [imageUrl, setImageUrl] = useState("")
  const [linkUrl, setLinkUrl] = useState<string>(path)

  useEffect(() => {
    const absoluteUrl = `${window.location.origin}${path}`
    setLinkUrl(absoluteUrl)
    QRCode.toDataURL(absoluteUrl, {
      width: 320,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#10243E", light: "#FFFFFF" },
    }).then(setImageUrl).catch((error) => console.error("Failed to generate QR code", error))
  }, [path])

  function downloadQRCode() {
    if (!imageUrl) return
    const link = document.createElement("a")
    link.href = imageUrl
    link.download = `lidell-consultancy-${path.slice(1)}-qr.png`
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  return (
    <aside className="mt-4 rounded-xl border border-gray-200 bg-white p-4 text-center">
      <p className="text-sm font-semibold text-gray-800">Scan to open {title}</p>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={`QR code for ${title}`}
          className="mx-auto mt-3 h-44 w-44 rounded-md"
        />
      ) : (
        <div className="mx-auto mt-3 h-44 w-44 animate-pulse rounded-md bg-gray-100" />
      )}
      <a href={linkUrl} target="_blank" rel="noreferrer" className="mt-2 block break-all text-xs text-[var(--brand-700)] underline">
        {linkUrl}
      </a>
      <button type="button" onClick={downloadQRCode} disabled={!imageUrl} className="brand-btn-primary mt-3 w-full">
        Download QR code
      </button>
    </aside>
  )
}
