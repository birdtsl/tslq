/** จำนวนวันแบบรวมปลายทางสำหรับสตริงวันที่ YYYY-MM-DD */
export function inclusiveIsoDayRangeDays(isoStart: string, isoEnd: string): number {
  const parts = (s: string) => s.split("-").map((x) => Number.parseInt(x, 10));
  const [ys, ms, ds] = parts(isoStart);
  const [ye, me, de] = parts(isoEnd);
  if (![ys, ms, ds, ye, me, de].every((n) => Number.isFinite(n))) return 1;
  const s = Date.UTC(ys, ms - 1, ds);
  const e = Date.UTC(ye, me - 1, de);
  const diff = Math.floor((e - s) / 86400000);
  return Math.max(1, diff + 1);
}
