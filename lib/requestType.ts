export function getRequestBranch(value?: Record<string, any> | null) {
  const explicit = typeof value?.branch === "string" ? value.branch.toLowerCase() : ""
  if (explicit === "b2b" || explicit === "personal") return explicit

  if (value?.company) return "b2b"
  if (value?.name || value?.style || value?.budget || value?.details) return "personal"

  return "request"
}

export function sanitizeSourcingRequestPayload(payload: Record<string, any> = {}) {
  const cleaned = { ...payload }
  const unsupportedKeys = ["branch", "budget", "budgetCurrency", "budget_currency"]

  for (const key of unsupportedKeys) {
    delete cleaned[key]
  }

  const budgetValue = typeof payload.budget === "string" || typeof payload.budget === "number"
    ? String(payload.budget)
    : ""
  const budgetCurrency = payload.budgetCurrency || payload.budget_currency || "USD"

  if (budgetValue.trim()) {
    const noteText = `Budget: ${budgetValue}${budgetCurrency ? ` ${budgetCurrency}` : ""}`
    const existingNotes = typeof cleaned.notes === "string" ? cleaned.notes.trim() : ""
    cleaned.notes = existingNotes ? `${existingNotes}\n${noteText}` : noteText
  }

  return cleaned
}
