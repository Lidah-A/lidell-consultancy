export function getRequestBranch(value?: Record<string, any> | null) {
  const explicit = typeof value?.branch === "string" ? value.branch.toLowerCase() : ""
  if (explicit === "b2b" || explicit === "personal") return explicit

  if (value?.company) return "b2b"
  if (value?.name || value?.style || value?.budget || value?.details) return "personal"

  return "request"
}
