"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutList, Sparkles, FileText, Bot, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLinkItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const NAV_ITEMS = [
  { href: "/applications", label: "Applications", icon: LayoutList },
  { href: "/resumes", label: "Resumes", icon: FileText },
] as const;

interface NavBarProps {
  userEmail?: string;
  onSignOut: () => void | Promise<void>;
}

function initialsFromEmail(email: string): string {
  return email.slice(0, 2).toUpperCase();
}

export function NavBar({ userEmail, onSignOut }: NavBarProps) {
  const pathname = usePathname();

  // Resume and cover letter preview routes are opened in their own tab as
  // clean, print-ready documents (they're also the exact URLs Playwright
  // captures for PDF export) - they should never show app chrome, on
  // screen or on paper.
  if (pathname.endsWith("/preview")) {
    return null;
  }

  if (pathname === "/sign-in") {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-zinc-50/80 backdrop-blur print:hidden dark:bg-black/80">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3 sm:px-8">
        <Link
          href="/applications"
          className="flex items-center gap-2 text-sm font-semibold tracking-tight"
        >
          <Sparkles className="size-4" />
          Resume Copilot
        </Link>
        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="size-3.5" />
                {item.label}
              </Link>
            );
          })}
          {userEmail && (
            <DropdownMenu>
              <DropdownMenuTrigger className="ml-2 rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
                <Avatar>
                  <AvatarFallback>
                    {initialsFromEmail(userEmail)}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel className="truncate">
                  {userEmail}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuLinkItem render={<Link href="/settings" />}>
                  <Bot />
                  AI Settings
                </DropdownMenuLinkItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onSignOut()}>
                  <LogOut />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </nav>
      </div>
    </header>
  );
}
