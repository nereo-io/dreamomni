"use client";

import { useEffect, useState } from "react";

interface LocalTimeProps {
  date: string | Date;
  format?: "datetime" | "date" | "time";
}

/**
 * Client-side time formatting component that displays time in user's local timezone
 * Renders server-side as ISO format to avoid hydration mismatch
 */
export function LocalTime({ date, format = "datetime" }: LocalTimeProps) {
  const [formatted, setFormatted] = useState<string>("");

  useEffect(() => {
    const d = new Date(date);

    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    };

    if (format === "date") {
      delete options.hour;
      delete options.minute;
      delete options.second;
      delete options.hour12;
    } else if (format === "time") {
      delete options.year;
      delete options.month;
      delete options.day;
    }

    // Format: YYYY-MM-DD HH:mm:ss
    const formatted = d.toLocaleString("sv-SE", options).replace("T", " ");
    setFormatted(formatted);
  }, [date, format]);

  // Server-side: show nothing to avoid hydration mismatch
  // Client-side: show formatted local time
  if (!formatted) {
    return <span className="text-muted-foreground">--</span>;
  }

  return <span>{formatted}</span>;
}
