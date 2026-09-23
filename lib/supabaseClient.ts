import { createClient } from "@supabase/supabase-js"

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPERBASE_URL ||
  process.env.SUPABASE_URL ||
  ""

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  ""

let supabaseClient: any

if (supabaseUrl && supabaseAnonKey) {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
} else {
  console.warn("Supabase client keys are not set (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY). Using mock supabase client for local testing.")

  // Allow optionally simulating a logged-in dev user by setting
  // NEXT_PUBLIC_SUPABASE_MOCK_USER_EMAIL in your .env.local
  const mockUserEmail = process.env.NEXT_PUBLIC_SUPABASE_MOCK_USER_EMAIL || process.env.SUPABASE_MOCK_USER_EMAIL || ""
  const mockUser = mockUserEmail
    ? { id: "mock-user-id", email: mockUserEmail, aud: "authenticated", user_metadata: {} }
    : null

  const noop = async (..._args: any[]) => ({ data: null, error: null })
  const subscription = { unsubscribe: () => {} }

  supabaseClient = {
    auth: {
      getSession: async () => ({ data: { session: mockUser ? { user: mockUser, access_token: "mock-token" } : null } }),
      onAuthStateChange: (cb: any) => {
        // Immediately notify callback with current session to mimic real client
        try {
          cb("SIGNED_IN", mockUser ? { user: mockUser } : null)
        } catch (e) {
          /* ignore */
        }
        return { data: subscription }
      },
      signInWithPassword: async (_: any) => {
        if (mockUser) return { data: { session: { user: mockUser, access_token: "mock-token" } }, error: null }
        return { data: { session: null }, error: { message: "Supabase not configured" } }
      },
      signUp: async ({ email, password }: any) => {
        if (mockUser || !email || !password) {
          return { data: { user: mockUser ?? { email }, session: mockUser ? { user: mockUser, access_token: "mock-token" } : null }, error: null }
        }
        return { data: { user: null, session: null }, error: { message: "Supabase not configured" } }
      },
      signOut: async () => ({ error: null }),
      getUser: async () => ({ data: { user: mockUser }, error: null }),
    },
    storage: {
      from: (_bucket: string) => ({
        upload: async () => ({ data: null, error: { message: "Storage not configured" } }),
        list: async () => ({ data: [], error: null }),
        createSignedUrl: async () => ({ data: null, error: null }),
        remove: async () => ({ data: null, error: null }),
      }),
    },
    // generic helpers used by calling code
    from: (_: string) => ({ select: noop, insert: noop, update: noop, delete: noop }),
  }
}

export default supabaseClient
