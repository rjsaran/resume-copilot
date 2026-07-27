"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

function SignInCard() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();

  async function handleSignIn() {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const next = searchParams.get("next") ?? "/applications";
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Resume Copilot</CardTitle>
        <CardDescription>Sign in to analyze jobs and tailor your resume.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Button onClick={handleSignIn} disabled={loading} className="w-full">
          {loading ? "Redirecting…" : "Continue with Google"}
        </Button>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}

export default function SignInPage() {
  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <Suspense fallback={null}>
        <SignInCard />
      </Suspense>
    </div>
  );
}
