import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * For Server Components/Actions that require a signed-in user. Middleware
 * already redirects unauthenticated page requests to /sign-in, so reaching
 * this with no user is the rare race (session just expired) rather than the
 * common case - still worth guarding explicitly rather than trusting the
 * middleware alone.
 */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  return user;
}
