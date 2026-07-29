"use client";

import { useEffect, useState } from "react";

/**
 * Formats a timestamp in the viewer's own locale/timezone. The pages that
 * render dates (applications list, outcomes timeline) are Server
 * Components, so `Date.toLocaleString()` there runs on the server and
 * renders in the server's timezone (UTC in production) - wrong for anyone
 * not in that timezone. This is a Client Component specifically so the
 * formatting happens in the browser, where `Intl`'s default timezone is
 * the viewer's own.
 *
 * The formatted string is only computed after mount (not during the initial
 * render) because Next.js still server-renders Client Components - that SSR
 * pass runs in Node, whose default ICU locale data can disagree with the
 * browser's on formatting details (e.g. whether a time gets an AM/PM
 * marker), which otherwise causes a hydration mismatch even though both are
 * "correct" for their own environment.
 */
export function LocalDateTime({
  date,
  className,
}: {
  date: Date | string;
  className?: string;
}) {
  const timestamp =
    typeof date === "string" ? new Date(date).getTime() : date.getTime();
  const [formatted, setFormatted] = useState<{
    date: string;
    time: string;
  } | null>(null);

  useEffect(() => {
    const d = new Date(timestamp);
    setFormatted({
      date: d.toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      time: d.toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }),
    });
  }, [timestamp]);

  return (
    <span className={className}>
      {formatted ? (
        <>
          {formatted.date} <span className="text-xs">{formatted.time}</span>
        </>
      ) : (
        " "
      )}
    </span>
  );
}
