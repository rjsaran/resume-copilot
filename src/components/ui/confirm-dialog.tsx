"use client";

import * as React from "react";
import { AlertDialog } from "@base-ui/react/alert-dialog";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  isLoading = false,
  variant = "default",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  isLoading?: boolean;
  variant?: "default" | "destructive";
}) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop
          className={cn(
            "fixed inset-0 z-50 bg-black/50 duration-150 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
          )}
        />
        <AlertDialog.Popup
          className={cn(
            "fixed top-1/2 left-1/2 z-50 grid w-full max-w-sm -translate-x-1/2 -translate-y-1/2 gap-4 rounded-lg border border-border bg-popover p-6 text-popover-foreground shadow-lg duration-150 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          )}
        >
          <div className="flex flex-col gap-1.5">
            <AlertDialog.Title className="text-lg leading-none font-semibold">
              {title}
            </AlertDialog.Title>
            {description && (
              <AlertDialog.Description className="text-sm text-muted-foreground">
                {description}
              </AlertDialog.Description>
            )}
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialog.Close render={<Button variant="outline" disabled={isLoading} />}>
              {cancelLabel}
            </AlertDialog.Close>
            <Button
              variant={variant === "destructive" ? "destructive" : "default"}
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="size-3.5 animate-spin" />}
              {confirmLabel}
            </Button>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
