"use client";

import { useEffect, useState } from "react";

export type IsoMonthRange = { start: string; end: string };

export function computeCurrentMonthRange(): IsoMonthRange {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return { start: `${y}-${m}-01`, end: `${y}-${m}-${d}` };
}

/** วันเริ่มต้นและสิ้นสุดเป็นวันปัจจุบัน */
export function computeCurrentDayRange(): IsoMonthRange {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const today = `${y}-${m}-${d}`;
  return { start: today, end: today };
}

/** ค่า null จนกว่า client จะ mount — ตรงกันทั้ง SSR กับรอบ hydrate แรก */
export function useHydrationSafeMonthRange(): IsoMonthRange | null {
  const [range, setRange] = useState<IsoMonthRange | null>(null);
  useEffect(() => {
    setRange(computeCurrentMonthRange());
  }, []);
  return range;
}

export function useHydrationSafeDayRange(): IsoMonthRange | null {
  const [range, setRange] = useState<IsoMonthRange | null>(null);
  useEffect(() => {
    setRange(computeCurrentDayRange());
  }, []);
  return range;
}
