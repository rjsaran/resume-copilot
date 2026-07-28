"use client";

import { useState } from "react";
import { List, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ApplicationsTable } from "@/components/applications/applications-table";
import { ApplicationsBoard } from "@/components/applications/applications-board";
import { cn } from "@/lib/utils";
import type { Application } from "@/lib/db/schema";

type View = "list" | "board";

export function ApplicationsView({
  applications,
}: {
  applications: Application[];
}) {
  const [view, setView] = useState<View>("list");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end gap-1">
        <Button
          size="sm"
          variant={view === "list" ? "secondary" : "ghost"}
          className={cn(view === "list" && "pointer-events-none")}
          onClick={() => setView("list")}
        >
          <List className="size-3.5" /> List
        </Button>
        <Button
          size="sm"
          variant={view === "board" ? "secondary" : "ghost"}
          className={cn(view === "board" && "pointer-events-none")}
          onClick={() => setView("board")}
        >
          <LayoutGrid className="size-3.5" /> Board
        </Button>
      </div>

      {view === "list" ? (
        <Card>
          <CardContent className="p-0">
            <ApplicationsTable applications={applications} />
          </CardContent>
        </Card>
      ) : (
        <ApplicationsBoard applications={applications} />
      )}
    </div>
  );
}
