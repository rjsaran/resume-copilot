"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export async function signOutAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  await supabase.auth.signOut();
  logger.info("User signed out", { action: "signOutAction", userId: user?.id });

  redirect("/sign-in");
}
