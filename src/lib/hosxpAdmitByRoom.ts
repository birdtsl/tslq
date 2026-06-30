import { queryReadOnly } from "@/lib/db/queryReadOnly";
import type { AdmitByWardRow } from "@/types/executive-kpi";

export type AdmitByRoomKpiResult = {
  rows: AdmitByWardRow[];
  total: number | null;
  error: string | null;
};

/**
 * ผู้ป่วยในรับไว้ แยกตามห้อง (roomno) — bedno / iptadm / an_stat
 * ยังรับไว้: an_stat.dchdate ว่างหรือวันที่ศูนย์
 * ใช้ร่วมกับ /api/executive-kpi และการ์ด AdmitByWardKpiCard ในสถิติผู้รับบริการ
 */
export async function loadAdmitByRoomKpi(): Promise<AdmitByRoomKpiResult> {
  const admitByRoomSql = `
    SELECT
      agg.room_code,
      MAX(agg.room_name) AS room_name,
      COUNT(*) AS occupied,
      SUM(agg.admdate_val) AS total_bed_days
    FROM (
      SELECT
        r.roomno AS room_code,
        TRIM(COALESCE(MAX(r.name), '')) AS room_name,
        i.an,
        COALESCE(MAX(a.admdate), 0) AS admdate_val
      FROM bedno b
      LEFT JOIN roomno r ON b.roomno = r.roomno
      LEFT JOIN iptadm i ON b.bedno = i.bedno
      LEFT JOIN an_stat a ON i.an = a.an
      LEFT JOIN ipt_ward_stat iw ON i.an = iw.an
      LEFT JOIN ward w ON iw.ward = w.ward
      LEFT JOIN ipt i2 ON i2.an = i.an
      WHERE a.dchdate IS NULL
         OR a.dchdate = ''
         OR a.dchdate = '0000-00-00'
         OR a.dchdate = '0000-00-00 00:00:00'
      GROUP BY r.roomno, i.an
      HAVING i.an IS NOT NULL AND TRIM(COALESCE(i.an, '')) <> ''
    ) agg
    GROUP BY agg.room_code
    HAVING COUNT(*) > 0
    ORDER BY occupied DESC, room_name ASC
  `.trim();

  const { rows: roomRows, error: admitErr } = await queryReadOnly(admitByRoomSql);
  if (admitErr) {
    return { rows: [], total: null, error: admitErr };
  }

  const list: AdmitByWardRow[] = roomRows.map((r) => {
    const code = r.room_code != null ? String(r.room_code).trim() : "";
    const name = String(r.room_name ?? "").trim();
    return {
      ward: code,
      wardName: name || code || "ไม่ระบุห้อง",
      count: Math.max(0, Number(r.occupied ?? 0)),
      totalBedDays: Math.max(0, Number(r.total_bed_days ?? 0)),
    };
  });

  return {
    rows: list,
    total: list.reduce((s, x) => s + x.count, 0),
    error: null,
  };
}
