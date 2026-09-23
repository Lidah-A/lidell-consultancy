import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPERBASE_URL
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY

let supabase: ReturnType<typeof createClient> | any

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })
} else {
  // Don't call createClient with empty values — that throws during module evaluation
  // instead export a proxy that will throw with a clear message when used at runtime.
  console.warn("Supabase server client not configured. SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing.")
  const handler: ProxyHandler<any> = {
    get() {
      throw new Error("Supabase server client not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in environment.")
    },
    apply() {
      throw new Error("Supabase server client not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in environment.")
    }
  }
  supabase = new Proxy({}, handler)
}

export default supabase
