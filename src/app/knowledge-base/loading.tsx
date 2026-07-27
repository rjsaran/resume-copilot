import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-8">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-8 w-20 shrink-0" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[60vh] w-full" />
        </CardContent>
      </Card>
    </main>
  );
}
