import { loadAdmitByRoomKpi } from "@/lib/hosxpAdmitByRoom";
import { queryReadOnly } from "@/lib/db/queryReadOnly";
import type { ServiceStatsPayload } from "@/types/service-stats";
import { differenceInCalendarDays, endOfMonth, format, startOfMonth, subMonths } from "date-fns";
import { th } from "date-fns/locale";
import { NextRequest, NextResponse } from "next/server";

/** ฐานอ้างอิง ~30 วัน (ตัวเลขเดิมของหน้าจอ) */
const REF_DAYS = 30;
const BASE_TOTAL = 8420;
const BASE_OPD = 6120;
const BASE_ER = 980;
const BASE_IPD = 1320;
const BASE_NEW = 2180;
const BASE_TELEMED = 380;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseDateParam(value: string | null, fallback: string): string {
  if (value && DATE_RE.test(value.trim())) return value.trim();
  return fallback;
}

function isoToLocal(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toIsoDateLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatPeriodLabel(start: string, end: string): string {
  const a = isoToLocal(start);
  const b = isoToLocal(end);
  const beA = a.getFullYear() + 543;
  const beB = b.getFullYear() + 543;
  const left = `${format(a, "d MMMM", { locale: th })} พ.ศ. ${beA}`;
  const right = `${format(b, "d MMMM", { locale: th })} พ.ศ. ${beB}`;
  return `ช่วงวันที่ ${left} ถึง ${right}`;
}

function buildDemoPayload(
  patientRegistryCount: number | null,
  registryError: string | null,
  start: string,
  end: string,
  byExamRoomOverride?: { code?: string; name: string; personCount: number; visitCount: number }[],
  opdOverride?: number,
  opdHnOverride?: number,
  ipdOverride?: number,
  monthlyTrendOverride?: { month: string; value: number }[],
  monthlyComparisonOverride?: {
    yearNewer: number;
    yearOlder: number;
    points: { month: string; newer: number; older: number }[];
  } | null,
  telemedOverride?: number,
  wardBedOccupancyOverride?: ServiceStatsPayload["wardBedOccupancy"],
  wardBedOccupancyError?: string | null,
  admitByWardOverride?: ServiceStatsPayload["admitByWard"],
  admitTotalOverride?: number | null,
  admitErrorOverride?: string | null,
): ServiceStatsPayload {
  const dStart = isoToLocal(start);
  const dEnd = isoToLocal(end);
  const daySpan = Math.max(1, differenceInCalendarDays(dEnd, dStart) + 1);
  const scale = daySpan / REF_DAYS;

  const totalEncounters = Math.max(1, Math.round(BASE_TOTAL * scale));
  const opd =
    opdOverride != null
      ? Math.max(0, Math.round(opdOverride))
      : Math.max(0, Math.round(BASE_OPD * scale));
  const opdHn =
    opdHnOverride != null
      ? Math.max(0, Math.round(opdHnOverride))
      : Math.max(0, Math.round(opd * 0.82));
  const er = Math.max(0, Math.round(BASE_ER * scale));
  let ipd =
    ipdOverride != null
      ? Math.max(0, Math.round(ipdOverride))
      : Math.max(0, Math.round(BASE_IPD * scale));
  const sumPart = opd + er + ipd;
  if (sumPart !== totalEncounters && opdOverride == null && ipdOverride == null) {
    ipd = Math.max(0, totalEncounters - opd - er);
  }

  const telemed =
    telemedOverride != null
      ? Math.max(0, Math.round(telemedOverride))
      : Math.max(0, Math.round(BASE_TELEMED * scale));
  const newPatients = Math.max(0, Math.round(BASE_NEW * scale));
  const followUp = Math.max(0, totalEncounters - newPatients);

  let monthlyTrend: { month: string; value: number }[];
  if (monthlyTrendOverride && monthlyTrendOverride.length > 0) {
    monthlyTrend = monthlyTrendOverride;
  } else if (monthlyComparisonOverride && monthlyComparisonOverride.points.length > 0) {
    monthlyTrend = monthlyComparisonOverride.points.map((p) => ({
      month: p.month,
      value: p.newer,
    }));
  } else {
    monthlyTrend = [];
    const wave = [0.92, 0.98, 0.89, 1.0, 1.02, 1.05];
    for (let i = 0; i < 6; i++) {
      const d = subMonths(dEnd, 5 - i);
      const monthLabel = format(d, "MMM", { locale: th });
      const baseLine = (7200 + i * 120) * scale * wave[i];
      const value = Math.max(1, Math.round(baseLine));
      monthlyTrend.push({ month: monthLabel, value });
    }
  }

  let monthlyComparison: ServiceStatsPayload["monthlyComparison"] = null;
  if (monthlyComparisonOverride && monthlyComparisonOverride.points.length > 0) {
    monthlyComparison = monthlyComparisonOverride;
  }

  const wardBedDemo: ServiceStatsPayload["wardBedOccupancy"] = [
    {
      ward: "demo1",
      wardName: "อายุรกรรมชาย",
      totalBeds: 32,
      occupied: 24,
      available: 8,
      occupancyRate: 75,
    },
    {
      ward: "demo2",
      wardName: "ศัลยกรรมหญิง",
      totalBeds: 28,
      occupied: 21,
      available: 7,
      occupancyRate: 75,
    },
    {
      ward: "demo3",
      wardName: "สูติ-นรีเวช",
      totalBeds: 20,
      occupied: 18,
      available: 2,
      occupancyRate: 90,
    },
  ];

  /** fallback เมื่อ query ห้องตรวจจริงไม่สำเร็จ */
  const byExamRoom =
    byExamRoomOverride && byExamRoomOverride.length > 0
      ? byExamRoomOverride
      : [
          {
            name: "ห้องตรวจอายุรกรรม 1",
            visitCount: Math.max(0, Math.round(totalEncounters * 0.13)),
            personCount: Math.max(0, Math.round(totalEncounters * 0.13 * 0.82)),
          },
          {
            name: "ห้องตรวจอายุรกรรม 2",
            visitCount: Math.max(0, Math.round(totalEncounters * 0.1)),
            personCount: Math.max(0, Math.round(totalEncounters * 0.1 * 0.82)),
          },
          {
            name: "ห้องตรวจศัลยกรรมทั่วไป",
            visitCount: Math.max(0, Math.round(totalEncounters * 0.1)),
            personCount: Math.max(0, Math.round(totalEncounters * 0.1 * 0.82)),
          },
          {
            name: "ห้องตรวจสูติ-นรีเวช",
            visitCount: Math.max(0, Math.round(totalEncounters * 0.09)),
            personCount: Math.max(0, Math.round(totalEncounters * 0.09 * 0.82)),
          },
          {
            name: "ห้องตรวจกุมารเวช",
            visitCount: Math.max(0, Math.round(totalEncounters * 0.08)),
            personCount: Math.max(0, Math.round(totalEncounters * 0.08 * 0.82)),
          },
        ];

  return {
    patientRegistryCount,
    registryError,
    start,
    end,
    periodLabel: formatPeriodLabel(start, end),
    metrics: {
      totalEncounters,
      opd,
      opdHn,
      er,
      ipd,
      telemed,
      newPatients,
      followUp,
    },
    monthlyTrend,
    monthlyComparison,
    byExamRoom,
    wardBedOccupancy:
      wardBedOccupancyOverride !== undefined ? wardBedOccupancyOverride : wardBedDemo,
    wardBedOccupancyError: wardBedOccupancyError ?? null,
    admitByWard: admitByWardOverride ?? [],
    admitTotal: admitTotalOverride ?? null,
    admitError: admitErrorOverride ?? null,
  };
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const now = new Date();
  const y = now.getFullYear();
  const mo = String(now.getMonth() + 1).padStart(2, "0");
  const da = String(now.getDate()).padStart(2, "0");
  const defaultStart = `${y}-${mo}-01`;
  const defaultEnd = `${y}-${mo}-${da}`;

  const start = parseDateParam(sp.get("start"), defaultStart);
  const end = parseDateParam(sp.get("end"), defaultEnd);

  const trendYearRaw = sp.get("trendYear");
  let trendYear: number | null = null;
  if (trendYearRaw) {
    const ny = Number.parseInt(trendYearRaw.trim(), 10);
    if (Number.isFinite(ny) && ny >= 2000 && ny <= 2100) {
      trendYear = ny;
    }
  }

  if (start > end) {
    return NextResponse.json(
      { error: "ช่วงวันที่ไม่ถูกต้อง (วันเริ่มต้องไม่เกินวันสิ้นสุด)" },
      { status: 400 },
    );
  }

  let patientRegistryCount: number | null = null;
  let registryError: string | null = null;

  const { rows, error } = await queryReadOnly(
    "SELECT COUNT(*) AS c FROM patient",
  );

  if (error) {
    registryError = error;
  } else if (rows[0]?.c != null) {
    patientRegistryCount = Number(rows[0].c);
  }

  const examRoomSql = `
    SELECT
      o.main_dep AS room_code,
      d.department AS room_name,
      COUNT(o.vn) AS visit_count,
      COUNT(DISTINCT o.hn) AS person_count
    FROM ovst o
    LEFT JOIN kskdepartment d ON o.main_dep = d.depcode
    WHERE o.vstdate BETWEEN ? AND ?
    GROUP BY o.main_dep, d.department
    ORDER BY visit_count DESC
  `;
  const { rows: examRows } = await queryReadOnly(examRoomSql, [start, end]);
  const byExamRoom = examRows
    .map((r) => {
      const codeRaw = r.room_code != null ? String(r.room_code).trim() : "";
      return {
        ...(codeRaw ? { code: codeRaw } : {}),
        name: String(r.room_name ?? r.room_code ?? "ไม่ระบุห้องตรวจ"),
        visitCount: Number(r.visit_count ?? 0),
        personCount: Number(r.person_count ?? 0),
      };
    })
    .filter((x) => Number.isFinite(x.visitCount) && x.visitCount > 0);
  const opdTotalFromQuery = byExamRoom.reduce((sum, x) => sum + x.visitCount, 0);

  const opdRangeSql = `
    SELECT
      COUNT(*) AS visit_count,
      COUNT(DISTINCT hn) AS hn_count
    FROM ovst
    WHERE vstdate BETWEEN ? AND ?
  `;
  const { rows: opdRangeRows, error: opdRangeErr } = await queryReadOnly(opdRangeSql, [
    start,
    end,
  ]);
  const opdHnFromQuery =
    !opdRangeErr && opdRangeRows[0]?.hn_count != null
      ? Number(opdRangeRows[0].hn_count)
      : undefined;
  const opdVisitsFromRange =
    !opdRangeErr && opdRangeRows[0]?.visit_count != null
      ? Number(opdRangeRows[0].visit_count)
      : undefined;

  /** ผู้ป่วยในรายการที่ยังรับไว้ (ยังไม่จำหน่าย) — รูปแบบ HOSXP ตาราง ipt */
  const stillAdmitSql = `
    SELECT COUNT(*) AS c
    FROM ipt
    WHERE dchdate IS NULL
       OR dchdate = '0000-00-00'
       OR dchdate = '0000-00-00 00:00:00'
  `;
  const { rows: admitRows, error: admitError } = await queryReadOnly(stillAdmitSql);
  const stillAdmitCount =
    !admitError && admitRows[0]?.c != null ? Number(admitRows[0].c) : undefined;

  /** กราฟรายเดือน: ถ้ามี trendYear = 12 เดือน เปรียบเทียบปีที่เลือกกับปีก่อนหน้า; ไม่มี = 6 เดือนย้อนหลังจากวันสิ้นสุด */
  const dEnd = isoToLocal(end);
  const monthlyAggSql = `
    SELECT YEAR(o.vstdate) AS y, MONTH(o.vstdate) AS mo, COUNT(*) AS visit_count
    FROM ovst o
    INNER JOIN kskdepartment k ON o.main_dep = k.depcode
    WHERE o.vstdate BETWEEN ? AND ?
    GROUP BY YEAR(o.vstdate), MONTH(o.vstdate)
  `;

  let trendRangeStart: Date;
  let trendRangeEnd: Date;
  let monthSlots: { d: Date; ym: string }[];
  let monthlyComparisonReal: {
    yearNewer: number;
    yearOlder: number;
    points: { month: string; newer: number; older: number }[];
  } | null = null;

  if (trendYear != null) {
    const yearNewer = trendYear;
    const yearOlder = trendYear - 1;
    trendRangeStart = new Date(yearOlder, 0, 1);
    trendRangeEnd = new Date(yearNewer, 11, 31);
    monthSlots = [];
  } else {
    trendRangeStart = startOfMonth(subMonths(dEnd, 5));
    trendRangeEnd = endOfMonth(dEnd);
    monthSlots = [];
    for (let i = 0; i < 6; i++) {
      const d = subMonths(dEnd, 5 - i);
      monthSlots.push({
        d,
        ym: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      });
    }
  }

  const { rows: monthRows, error: monthAggError } = await queryReadOnly(monthlyAggSql, [
    toIsoDateLocal(trendRangeStart),
    toIsoDateLocal(trendRangeEnd),
  ]);
  const byYm = new Map<string, number>();
  if (!monthAggError) {
    for (const r of monthRows) {
      const yr = Number(r.y);
      const mo = Number(r.mo);
      const c = Number(r.visit_count ?? 0);
      if (Number.isFinite(yr) && Number.isFinite(mo) && Number.isFinite(c)) {
        byYm.set(`${yr}-${String(mo).padStart(2, "0")}`, c);
      }
    }
  }

  let monthlyTrendReal: { month: string; value: number }[];

  if (trendYear != null) {
    const yearNewer = trendYear;
    const yearOlder = trendYear - 1;
    const points: { month: string; newer: number; older: number }[] = [];
    for (let mo = 1; mo <= 12; mo++) {
      const d = new Date(yearNewer, mo - 1, 1);
      const ymN = `${yearNewer}-${String(mo).padStart(2, "0")}`;
      const ymO = `${yearOlder}-${String(mo).padStart(2, "0")}`;
      const newer = monthAggError ? 0 : (byYm.get(ymN) ?? 0);
      const older = monthAggError ? 0 : (byYm.get(ymO) ?? 0);
      points.push({
        month: format(d, "MMM", { locale: th }),
        newer,
        older,
      });
    }
    monthlyTrendReal = points.map(({ month, newer }) => ({ month, value: newer }));
    monthlyComparisonReal = { yearNewer, yearOlder, points };
  } else {
    monthlyTrendReal = monthSlots.map(({ d, ym }) => ({
      month: format(d, "MMM", { locale: th }),
      value: monthAggError ? 0 : (byYm.get(ym) ?? 0),
    }));
  }

  /** Telemed: ovstist = 09 — ยอดรวม COUNT(DISTINCT vn) ในช่วงวันที่ (เทียบกับรายงาน group by date) */
  const telemedSql = `
    SELECT COUNT(DISTINCT ov.vn) AS c
    FROM ovst ov
    LEFT JOIN vn_stat ov1 ON ov.vn = ov1.vn
    LEFT JOIN opitemrece op ON ov.vn = op.vn
    LEFT JOIN patient pt ON ov.hn = pt.hn
    LEFT JOIN ovstist vt ON ov.ovstist = vt.ovstist
    WHERE ov.vstdate BETWEEN ? AND ?
      AND ov.ovstist = '09'
  `;
  const { rows: teleRows, error: teleErr } = await queryReadOnly(telemedSql, [start, end]);
  const telemedFromQuery =
    !teleErr && teleRows[0]?.c != null ? Number(teleRows[0].c) : undefined;

  const wardBedSql = `
    SELECT
      w.ward,
      w.name AS ward_name,
      w.bedcount AS total_beds,
      COUNT(i.an) AS occupied,
      w.bedcount - COUNT(i.an) AS available,
      ROUND(COUNT(i.an) * 100.0 / NULLIF(w.bedcount, 0), 1) AS occupancy_rate
    FROM ward w
    LEFT JOIN ipt i ON w.ward = i.ward
      AND (i.dchdate IS NULL OR i.dchdate = '0000-00-00' OR i.dchdate = '0000-00-00 00:00:00')
    WHERE w.bedcount > 0
    GROUP BY w.ward, w.name, w.bedcount
    ORDER BY w.name ASC
  `;
  const { rows: wardRows, error: wardQueryError } = await queryReadOnly(wardBedSql);
  let wardBedOccupancyReal: ServiceStatsPayload["wardBedOccupancy"] | undefined;
  let wardBedOccupancyErr: string | null = null;
  if (wardQueryError) {
    wardBedOccupancyErr = wardQueryError;
    wardBedOccupancyReal = [];
  } else {
    wardBedOccupancyReal = wardRows.map((r) => {
      const totalBeds = Math.max(0, Number(r.total_beds ?? 0));
      const occupied = Math.max(0, Number(r.occupied ?? 0));
      const available = Math.max(0, Number(r.available ?? Math.max(0, totalBeds - occupied)));
      const occRate = Number(r.occupancy_rate);
      return {
        ward: String(r.ward ?? ""),
        wardName: String(r.ward_name ?? ""),
        totalBeds,
        occupied,
        available,
        occupancyRate: Number.isFinite(occRate) ? occRate : 0,
      };
    });
  }

  const admitByRoom = await loadAdmitByRoomKpi();

  return NextResponse.json(
    buildDemoPayload(
      patientRegistryCount,
      registryError,
      start,
      end,
      byExamRoom,
      opdVisitsFromRange ?? opdTotalFromQuery,
      opdHnFromQuery,
      stillAdmitCount,
      monthAggError ? undefined : monthlyTrendReal,
      monthlyComparisonReal,
      telemedFromQuery,
      wardBedOccupancyReal,
      wardBedOccupancyErr,
      admitByRoom.rows,
      admitByRoom.total,
      admitByRoom.error,
    ),
  );
}
