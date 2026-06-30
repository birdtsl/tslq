"use client";

import { useEffect, useState } from "react";

/** วันนี้เป็น YYYY-MM-DD หลัง mount เท่านั้น — หลีกเลี่ยง hydration mismatch */
export function useHydrationSafeTodayIso(): string | null {
  const [iso, setIso] = useState<string | null>(null);
  useEffect(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    setIso(`${y}-${m}-${d}`);
  }, []);
  return iso;
}
