import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-4 py-16 dark:bg-black sm:px-8">
      <main className="flex w-full max-w-4xl flex-col gap-8">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-9 w-56" />
          <Skeleton className="h-5 w-80" />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 w-24" />
        </div>

        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <Skeleton className="size-8 rounded-full" />
            <Skeleton className="h-4 w-72" />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
