export function getRequestBranch(value?: Record<string, any> | null) {
  const explicit = typeof value?.branch === "string" ? value.branch.toLowerCase() : ""
  if (explicit === "b2b" || explicit === "personal") return explicit

  if (value?.company) return "b2b"
  if (value?.name || value?.style || value?.budget || value?.details) return "personal"

  return "request"
}

export function sanitizeSourcingRequestPayload(payload: Record<string, any> = {}) {
  const cleaned = { ...payload }
  const unsupportedKeys = [
    "branch",
    "budget",
    "budgetCurrency",
    "budget_currency",
    "business_type",
    "businessType",
  ]

  for (const key of unsupportedKeys) {
    delete cleaned[key]
  }

  const businessType = payload.businessType || payload.business_type
  const budgetValue = typeof payload.budget === "string" || typeof payload.budget === "number"
    ? String(payload.budget)
    : ""
  const budgetCurrency = payload.budgetCurrency || payload.budget_currency || "USD"

  if (businessType && typeof businessType === "string" && businessType.trim()) {
    const noteText = `Business type: ${businessType.trim()}`
    const existingNotes = typeof cleaned.notes === "string" ? cleaned.notes.trim() : ""
    cleaned.notes = existingNotes ? `${existingNotes}\n${noteText}` : noteText
  }

  if (budgetValue.trim()) {
    const noteText = `Budget: ${budgetValue}${budgetCurrency ? ` ${budgetCurrency}` : ""}`
    const existingNotes = typeof cleaned.notes === "string" ? cleaned.notes.trim() : ""
    cleaned.notes = existingNotes ? `${existingNotes}\n${noteText}` : noteText
  }

  return cleaned
}
