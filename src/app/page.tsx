import { redirect } from "next/navigation";

/**
 * Analysis is now started from the floating "Analyze" launcher available on
 * every page (see AnalyzeLauncher), not a dedicated page - "/" has nothing
 * of its own to show, so it forwards to the applications list, the same
 * place sign-in already lands a user.
 */
export default function Home() {
  redirect("/applications");
}
