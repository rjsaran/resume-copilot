import { MessageSquareQuote } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function RecruiterReviewCard({ recruiterFirstImpression }: { recruiterFirstImpression: string }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <MessageSquareQuote className="size-4 text-muted-foreground" />
          <CardTitle>Recruiter&apos;s First Impression</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <blockquote className="border-l-2 pl-4 text-sm leading-relaxed text-foreground/90 italic">
          {recruiterFirstImpression}
        </blockquote>
      </CardContent>
    </Card>
  );
}
