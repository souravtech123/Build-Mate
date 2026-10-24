"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";

export default function PageViewTracker() {
  const pathname = usePathname();
  const lastRecordedPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;
    // Avoid double firing on re-render of same path
    if (lastRecordedPath.current === pathname) return;
    lastRecordedPath.current = pathname;

    fetch(`${API_BASE}/api/v1/pageview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname }),
    }).catch(() => {
      // Non-blocking: fail silently if analytics service is down
    });
  }, [pathname]);

  return null;
}
