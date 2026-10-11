"use client"

import { useEffect } from "react"

type Props = {
  title: string
  description: string
}

export default function PageSeo({ title, description }: Props) {
  useEffect(() => {
    const previousTitle = document.title
    const brandedTitle = title.includes("Lidell Consultancy") ? title : `${title} | Lidell Consultancy`
    const meta = document.head.querySelector('meta[name="description"]') ?? (() => {
      const tag = document.createElement("meta")
      tag.setAttribute("name", "description")
      document.head.appendChild(tag)
      return tag
    })()

    document.title = brandedTitle
    meta.setAttribute("content", description)

    return () => {
      document.title = previousTitle
    }
  }, [description, title])

  return null
}