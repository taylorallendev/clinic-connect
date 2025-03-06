"use client";

import { useEffect, useState } from "react";

interface ClientSideDateProps {
  timestamp: number;
}

export function ClientSideDate({ timestamp }: ClientSideDateProps) {
  const [formattedDate, setFormattedDate] = useState<string>("");

  useEffect(() => {
    // Format date on the client side only
    setFormattedDate(new Date(timestamp).toLocaleString());
  }, [timestamp]);

  // Return empty during SSR to avoid hydration mismatch
  return <span>- {formattedDate}</span>;
}
