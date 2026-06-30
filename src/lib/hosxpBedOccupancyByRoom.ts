import { inclusiveIsoDayRangeDays } from "@/lib/inclusiveIsoDayRangeDays";
import { queryReadOnly } from "@/lib/db/queryReadOnly";
import type { BedOccupancyByRoomRow } from "@/types/bed-occupancy-by-room";

/**
 * สรุปรายห้องจาก HOSxP — คิวรีเดียวกับรายงาน (กรอง an_stat.dchdate)
 * GROUP BY r.roomno ตามรายงาน HOSxP
 */
export async function loadBedOccupancyByRoom(
  start: string,
  end: string,
): Promise<{ rows: BedOccupancyByRoomRow[]; dayCount: number; error?: string }> {
  const dayCount = inclusiveIsoDayRangeDays(start, end);

  const sql = `
SELECT
  r.name AS room_name,
  COUNT(DISTINCT b.bedno) AS bed_cc,
  COUNT(DISTINCT iw.an) AS an_cc,
  SUM(COALESCE(iw.admdate, 0)) AS adm,
  (SUM(COALESCE(iw.admdate, 0)) * 100) / NULLIF(COUNT(DISTINCT b.bedno) * ?, 0) AS occupancy_pct,
  COUNT(DISTINCT i2.an) AS dch_an,
  SUM(COALESCE(a.admdate, 0)) AS admdate,
  SUM(COALESCE(i2.adjrw, 0)) AS adjrw,
  SUM(COALESCE(i2.rw, 0)) AS rw
FROM bedno b
LEFT JOIN roomno r ON b.roomno = r.roomno
LEFT JOIN iptadm i ON b.bedno = i.bedno
LEFT JOIN an_stat a ON i.an = a.an
LEFT JOIN ipt_ward_stat iw ON i.an = iw.an
LEFT JOIN ward w ON iw.ward = w.ward
LEFT JOIN ipt i2 ON i2.an = a.an
WHERE a.dchdate BETWEEN ? AND ?
GROUP BY r.roomno
ORDER BY MAX(r.name)
`.trim();

  const { rows, error } = await queryReadOnly(sql, [dayCount, start, end]);
  if (error) return { rows: [], dayCount, error };

  const mapped: BedOccupancyByRoomRow[] = rows.map((r) => {
    const rawOcc = r.occupancy_pct;
    const occ =
      rawOcc != null && rawOcc !== ""
        ? Number(rawOcc)
        : NaN;
    return {
      room_name: r.room_name != null ? String(r.room_name) : "",
      bed_cc: Number(r.bed_cc ?? 0),
      an_cc: Number(r.an_cc ?? 0),
      adm: Number(r.adm ?? 0),
      occupancy_pct: Number.isFinite(occ) ? occ : null,
      dch_an: Number(r.dch_an ?? 0),
      admdate: Number(r.admdate ?? 0),
      adjrw: Number(r.adjrw ?? 0),
      rw: Number(r.rw ?? 0),
    };
  });

  return { rows: mapped, dayCount };
}
