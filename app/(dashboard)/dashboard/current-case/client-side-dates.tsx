"use client";

import { useEffect, useState } from "react";

interface ClientSideDateProps {
  timestamp: number;
}

export function ClientSideDate({ timestamp }: ClientSideDateProps) {
  const [formattedDate, setFormattedDate] = useState<string>("");

  useEffect(() => {
    const date = new Date(timestamp);
    setFormattedDate(
      date.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  }, [timestamp]);

  // Return empty during SSR to avoid hydration mismatch
  return <span>- {formattedDate}</span>;
}
