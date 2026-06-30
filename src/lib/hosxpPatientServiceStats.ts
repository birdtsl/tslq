import { loadBedOccupancyByRoom } from "@/lib/hosxpBedOccupancyByRoom";
import { inclusiveIsoDayRangeDays } from "@/lib/inclusiveIsoDayRangeDays";
import { queryReadOnly } from "@/lib/db/queryReadOnly";
import type { PatientServiceStatsPayload, PatientServiceYearStats } from "@/types/patient-service-stats";

const THAI_MONTH_ABBR = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
] as const;

function num(v: unknown): number {
  if (v == null) return 0;
  if (typeof v === "bigint") return Number(v);
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function isoParts(iso: string): { y: number; m: number; d: number } {
  const [ys, ms, ds] = iso.split("-").map(Number);
  return { y: ys || 0, m: ms || 0, d: ds || 0 };
}

/** ปีงบ พ.ศ. เริ่มต้น (ต.ค.) จากวันที่ */
export function fiscalBeStartFromIso(iso: string): number {
  const { y, m } = isoParts(iso);
  return m >= 10 ? y + 543 : y + 542;
}

function fiscalYearRangeFromBe(beStart: number): { start: string; end: string } {
  const ceStart = beStart - 543;
  return { start: `${ceStart}-10-01`, end: `${ceStart + 1}-09-30` };
}

function capEnd(fiscalEnd: string, capIso: string): string {
  return fiscalEnd > capIso ? capIso : fiscalEnd;
}

function beShortYear(iso: string): string {
  const be = isoParts(iso).y + 543;
  return String(be).slice(-2);
}

function formatPartialFiscalLabel(beStart: number, end: string, isPartial: boolean): string {
  if (!isPartial) return String(beStart);
  const e = isoParts(end);
  const em = THAI_MONTH_ABBR[e.m - 1] ?? "";
  return `${beStart} (ต.ค.${beShortYear(fiscalYearRangeFromBe(beStart).start)}-${em}${beShortYear(end)})`;
}

async function loadOpdStats(start: string, end: string): Promise<{ persons: number; visits: number }> {
  const sql = `
    SELECT COUNT(*) AS visit_count, COUNT(DISTINCT hn) AS hn_count
    FROM ovst
    WHERE vstdate BETWEEN ? AND ?
  `;
  const { rows, error } = await queryReadOnly(sql, [start, end]);
  if (error || !rows[0]) return { persons: 0, visits: 0 };
  return { persons: num(rows[0].hn_count), visits: num(rows[0].visit_count) };
}

async function loadIpdStats(
  start: string,
  end: string,
): Promise<{ cases: number; bedDays: number; adjrw: number; cmi: number; avgLos: number }> {
  const sql = `
    SELECT
      COUNT(DISTINCT ipt.an) AS ipd_cases,
      SUM(COALESCE(ss.admdate, 0)) AS total_bed_days,
      ROUND(SUM(COALESCE(ipt.adjrw, 0)), 2) AS total_adjrw,
      ROUND(SUM(COALESCE(ipt.adjrw, 0)) / NULLIF(COUNT(DISTINCT ipt.an), 0), 4) AS cmi,
      ROUND(SUM(COALESCE(ss.admdate, 0)) / NULLIF(COUNT(DISTINCT ipt.an), 0), 2) AS avg_los
    FROM ipt
    INNER JOIN an_stat ss ON ipt.an = ss.an
    WHERE ipt.dchdate BETWEEN ? AND ?
      AND ipt.an <> ''
  `;
  const { rows, error } = await queryReadOnly(sql, [start, end]);
  if (error || !rows[0]) {
    return { cases: 0, bedDays: 0, adjrw: 0, cmi: 0, avgLos: 0 };
  }
  const r = rows[0];
  return {
    cases: num(r.ipd_cases),
    bedDays: num(r.total_bed_days),
    adjrw: num(r.total_adjrw),
    cmi: num(r.cmi),
    avgLos: num(r.avg_los),
  };
}

async function loadBedOccupancyRate(start: string, end: string): Promise<number> {
  const { rows, dayCount, error } = await loadBedOccupancyByRoom(start, end);
  if (error || rows.length === 0 || dayCount <= 0) return 0;
  const totalAdm = rows.reduce((s, r) => s + r.adm, 0);
  const totalBeds = rows.reduce((s, r) => s + r.bed_cc, 0);
  if (totalBeds <= 0) return 0;
  return Math.round((totalAdm * 10000) / (totalBeds * dayCount)) / 100;
}

async function loadRangeStats(
  start: string,
  end: string,
  beStart: number,
  isPartial: boolean,
): Promise<PatientServiceYearStats> {
  const dayCount = inclusiveIsoDayRangeDays(start, end);
  const [opd, ipd, occ] = await Promise.all([
    loadOpdStats(start, end),
    loadIpdStats(start, end),
    loadBedOccupancyRate(start, end),
  ]);
  return {
    fiscalYearBe: beStart,
    label: formatPartialFiscalLabel(beStart, end, isPartial),
    start,
    end,
    isPartial,
    opdPersons: opd.persons,
    opdVisits: opd.visits,
    avgOpdPerDay: dayCount > 0 ? Math.round(opd.visits / dayCount) : 0,
    ipdCases: ipd.cases,
    avgLos: ipd.avgLos,
    totalBedDays: ipd.bedDays,
    cmi: ipd.cmi,
    bedOccupancyRate: occ,
    adjrw: ipd.adjrw,
  };
}

function formatPeriodLabel(start: string, end: string): string {
  const s = isoParts(start);
  const e = isoParts(end);
  const sm = THAI_MONTH_ABBR[s.m - 1] ?? "";
  const em = THAI_MONTH_ABBR[e.m - 1] ?? "";
  return `${s.d} ${sm} พ.ศ. ${s.y + 543} ถึง ${e.d} ${em} พ.ศ. ${e.y + 543}`;
}

export async function loadPatientServiceStats(
  start: string,
  end: string,
): Promise<PatientServiceStatsPayload> {
  const currentBe = fiscalBeStartFromIso(end);
  const yearlyComparison: PatientServiceYearStats[] = [];

  for (let i = 3; i >= 0; i--) {
    const be = currentBe - i;
    const fy = fiscalYearRangeFromBe(be);
    const rangeEnd = capEnd(fy.end, end);
    const isPartial = rangeEnd < fy.end;
    yearlyComparison.push(await loadRangeStats(fy.start, rangeEnd, be, isPartial));
  }

  const summaryBe = fiscalBeStartFromIso(end);
  const fyRange = fiscalYearRangeFromBe(summaryBe);
  const summaryIsPartial = start > fyRange.start || end < fyRange.end;
  const summary = await loadRangeStats(start, end, summaryBe, summaryIsPartial);

  return {
    start,
    end,
    periodLabel: formatPeriodLabel(start, end),
    summary,
    yearlyComparison,
    error: null,
  };
}
