import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server-side Supabase client for Server Components/Actions/Route Handlers.
 * Reads/writes the session via Next.js cookies, so `auth.getUser()` reflects
 * the signed-in user for the current request.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component render (not a Server Action or
            // Route Handler) — the middleware below refreshes the session
            // instead, so this can be safely ignored.
          }
        },
      },
    }
  );
}
