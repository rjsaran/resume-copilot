"use client";

/**
 * Formats a timestamp in the viewer's own locale/timezone. The pages that
 * render dates (applications list, outcomes timeline) are Server
 * Components, so `Date.toLocaleString()` there runs on the server and
 * renders in the server's timezone (UTC in production) - wrong for anyone
 * not in that timezone. This is a Client Component specifically so the
 * formatting happens in the browser, where `Intl`'s default timezone is
 * the viewer's own.
 */
export function LocalDateTime({
  date,
  className,
}: {
  date: Date | string;
  className?: string;
}) {
  const d = typeof date === "string" ? new Date(date) : date;

  return (
    <span className={className}>
      {d.toLocaleDateString()}{" "}
      <span className="text-xs">
        {d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
      </span>
    </span>
  );
}
