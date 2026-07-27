"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutList, Sparkles, BookUser, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { href: "/", label: "Analyze", icon: Sparkles },
  { href: "/applications", label: "Applications", icon: LayoutList },
  { href: "/knowledge-base", label: "Knowledge Base", icon: BookUser },
] as const;

interface NavBarProps {
  userEmail?: string;
  onSignOut: () => void | Promise<void>;
}

export function NavBar({ userEmail, onSignOut }: NavBarProps) {
  const pathname = usePathname();

  // The resume preview route is opened in its own tab as a clean,
  // print-ready document (it's also the exact URL Playwright captures for
  // PDF export) — it should never show app chrome, on screen or on paper.
  if (pathname.includes("/resume/") && pathname.endsWith("/preview")) {
    return null;
  }

  if (pathname === "/sign-in") {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-zinc-50/80 backdrop-blur print:hidden dark:bg-black/80">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3 sm:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-semibold tracking-tight"
        >
          <Sparkles className="size-4" />
          Resume Copilot
        </Link>
        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="size-3.5" />
                {item.label}
              </Link>
            );
          })}
          <Link
            href="/settings"
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              pathname.startsWith("/settings")
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Settings className="size-3.5" />
            Settings
          </Link>
          {userEmail && (
            <div className="ml-2 flex items-center gap-2 border-l pl-3">
              <span className="hidden text-xs text-muted-foreground sm:inline">
                {userEmail}
              </span>
              <form action={onSignOut}>
                <Button type="submit" variant="ghost" size="icon-sm" title="Sign out">
                  <LogOut className="size-3.5" />
                </Button>
              </form>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
