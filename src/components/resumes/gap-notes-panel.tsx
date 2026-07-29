"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, Lightbulb, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LocalDateTime } from "@/components/local-datetime";
import { dismissGenerationNoteAction } from "@/app/resumes/actions";

export interface GapNoteSummary {
  id: string;
  name: string;
  note: string;
  createdAt: Date;
  application: { id: string; company: string; jobTitle: string } | null;
}

/**
 * Notes the user typed for the AI while generating a tailored resume - a
 * punch list of things (like a real skill an analysis flagged as missing)
 * worth folding into the Base Resume permanently instead of re-typing per
 * application. Dismissing one just clears it; it doesn't touch the resume
 * it came from.
 */
export function GapNotesPanel({ notes }: { notes: GapNoteSummary[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [dismissingId, setDismissingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (notes.length === 0) return null;

  function handleDismiss(id: string) {
    setError(null);
    setDismissingId(id);
    startTransition(async () => {
      const result = await dismissGenerationNoteAction(id);
      if (!result.success) {
        setError(result.error ?? "Failed to dismiss.");
        setDismissingId(null);
        return;
      }
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lightbulb className="size-4 text-muted-foreground" />
          <CardTitle>Gaps to revisit</CardTitle>
        </div>
        <CardDescription>
          Notes you gave the AI while generating tailored resumes - things
          worth adding to your Base Resume directly so you don&apos;t have to
          repeat them next time.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {error && <p className="text-sm text-destructive">{error}</p>}
        <ul className="flex flex-col divide-y divide-border">
          {notes.map((note) => (
            <li key={note.id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
                  {note.application ? (
                    <Link
                      href={`/applications/${note.application.id}`}
                      className="font-medium text-foreground hover:underline"
                    >
                      {note.application.jobTitle} · {note.application.company}
                    </Link>
                  ) : (
                    <span className="font-medium text-foreground">{note.name}</span>
                  )}
                  <span>·</span>
                  <LocalDateTime date={note.createdAt} />
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDismiss(note.id)}
                  disabled={isPending && dismissingId === note.id}
                >
                  {isPending && dismissingId === note.id ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Check className="size-3.5" />
                  )}
                  Done
                </Button>
              </div>
              <p className="text-sm whitespace-pre-wrap">{note.note}</p>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
