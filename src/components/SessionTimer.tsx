"use client";

import { useEffect } from "react";

// Sends the visitor back to the cover when their 30-minute password session runs out, even if the
// page is still open. Also checks when the tab comes back into view or the page is restored by the
// back button, since background timers can be paused. The server enforces the same expiry.

export default function SessionTimer({ msLeft }: { msLeft: number }) {
  useEffect(() => {
    const deadline = Date.now() + msLeft;
    const out = () => window.location.replace("/");
    const check = () => {
      if (Date.now() >= deadline) out();
    };
    const t = window.setTimeout(out, msLeft);
    window.addEventListener("pageshow", check);
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", check);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("pageshow", check);
      window.removeEventListener("focus", check);
      document.removeEventListener("visibilitychange", check);
    };
  }, [msLeft]);
  return null;
}
