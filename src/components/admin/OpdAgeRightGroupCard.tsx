"use client";

import { formatThaiBuddhistDate } from "@/components/ui/ThaiDatePicker";
import { useHydrationSafeTodayIso } from "@/hooks/useHydrationSafeTodayIso";
import { parseJsonResponse } from "@/lib/parseJsonResponse";
import type { OpdAgeRightGroupPayload, OpdAgeRightGroupRow } from "@/types/opd-age-right-group";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const TEXT_MAIN = "#1B2559";
const ACCENT = "#2F8F46";
const MUTED = "#64748b";

const COL_UC = {
  header: "bg-gradient-to-b from-emerald-400 via-emerald-500 to-emerald-600 text-white",
  sub: "bg-emerald-50 text-emerald-900",
  cell: "bg-emerald-50/70 text-emerald-950",
  cellAlt: "bg-emerald-100/50 text-emerald-950",
  total: "bg-emerald-100 text-emerald-950",
};

const COL_GOV = {
  header: "bg-gradient-to-b from-sky-400 via-sky-500 to-sky-600 text-white",
  sub: "bg-sky-50 text-sky-900",
  cell: "bg-sky-50/70 text-sky-950",
  cellAlt: "bg-sky-100/50 text-sky-950",
  total: "bg-sky-100 text-sky-950",
};

const COL_SSS = {
  header: "bg-gradient-to-b from-violet-400 via-violet-500 to-violet-600 text-white",
  sub: "bg-violet-50 text-violet-900",
  cell: "bg-violet-50/70 text-violet-950",
  cellAlt: "bg-violet-100/50 text-violet-950",
  total: "bg-violet-100 text-violet-950",
};

function currentFiscalBeStart(): number {
  const now = new Date();
  const y = now.getFullYear();
  return now.getMonth() >= 9 ? y + 543 : y + 542;
}

function fiscalYearRange(
  beStartYear: number,
  capEndIso: string,
): { beStart: number; start: string; end: string; label: string } {
  const ceStart = beStartYear - 543;
  const ceEnd = ceStart + 1;
  const start = `${ceStart}-10-01`;
  const fiscalEnd = `${ceEnd}-09-30`;
  const end = fiscalEnd > capEndIso ? capEndIso : fiscalEnd;
  return {
    beStart: beStartYear,
    start,
    end,
    label: `ปีงบ ${beStartYear}–${beStartYear + 1}`,
  };
}

function formatPeriodLabel(start: string, end: string): string {
  if (start === end) return formatThaiBuddhistDate(start);
  return `${formatThaiBuddhistDate(start)} – ${formatThaiBuddhistDate(end)}`;
}

function sumRows(rows: OpdAgeRightGroupRow[]) {
  return rows.reduce(
    (acc, r) => ({
      ucHn: acc.ucHn + r.ucHn,
      ucVisit: acc.ucVisit + r.ucVisit,
      govHn: acc.govHn + r.govHn,
      govVisit: acc.govVisit + r.govVisit,
      sssHn: acc.sssHn + r.sssHn,
      sssVisit: acc.sssVisit + r.sssVisit,
    }),
    { ucHn: 0, ucVisit: 0, govHn: 0, govVisit: 0, sssHn: 0, sssVisit: 0 },
  );
}

function numCell(v: number) {
  return v.toLocaleString("th-TH");
}

export function OpdAgeRightGroupCard() {
  const todayIso = useHydrationSafeTodayIso();
  const capEnd = todayIso ?? new Date().toISOString().slice(0, 10);

  const fiscalOptions = useMemo(
    () =>
      Array.from({ length: 5 }, (_, i) =>
        fiscalYearRange(currentFiscalBeStart() - (4 - i), capEnd),
      ),
    [capEnd],
  );

  const latestFiscalBe = currentFiscalBeStart();
  const [selectedBe, setSelectedBe] = useState<number | null>(latestFiscalBe);
  const [queryStart, setQueryStart] = useState("");
  const [queryEnd, setQueryEnd] = useState("");
  const [payload, setPayload] = useState<OpdAgeRightGroupPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRange = useCallback(async (start: string, end: string) => {
    if (!start || !end || start > end) {
      setPayload(null);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams({ start, end });
      const res = await fetch(`/api/opd-age-right-group?${q}`, { cache: "no-store" });
      const json = await parseJsonResponse<OpdAgeRightGroupPayload>(res);
      if (!res.ok) {
        setPayload(null);
        setError(json.error ?? `HTTP ${res.status}`);
        return;
      }
      setPayload(json);
      if (json.error) setError(json.error);
    } catch (e) {
      setPayload(null);
      setError(e instanceof Error ? e.message : "โหลดไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadFiscalYear = useCallback(
    async (beStart: number) => {
      const fy = fiscalYearRange(beStart, capEnd);
      setSelectedBe(beStart);
      setQueryStart(fy.start);
      setQueryEnd(fy.end);
      await fetchRange(fy.start, fy.end);
    },
    [capEnd, fetchRange],
  );

  const autoLoadedRef = useRef(false);
  useEffect(() => {
    if (!todayIso || autoLoadedRef.current) return;
    autoLoadedRef.current = true;
    void loadFiscalYear(currentFiscalBeStart());
  }, [todayIso, loadFiscalYear]);

  const rows = payload?.rows ?? [];
  const totals = useMemo(() => sumRows(rows), [rows]);
  const hasData = rows.some(
    (r) => r.ucHn + r.ucVisit + r.govHn + r.govVisit + r.sssHn + r.sssVisit > 0,
  );
  const periodLabel =
    queryStart && queryEnd ? formatPeriodLabel(queryStart, queryEnd) : "…";

  return (
    <div
      className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm font-[family-name:var(--font-kanit)]"
      style={{ fontFamily: "var(--font-kanit), Kanit, sans-serif" }}
    >
      <div
        className="flex flex-wrap items-center justify-between gap-3 border-b border-teal-700/15 px-4 py-3"
        style={{ background: "linear-gradient(90deg, #ecfdf5 0%, #f0fdfa 45%, #fff 100%)" }}
      >
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-bold text-teal-950 sm:text-lg">
            ผู้ป่วยนอกจำแนกตามวัยและสิทธิ
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-teal-900/75">
            บัตรทอง · ข้าราชการ · ประกันสังคม — จำนวนคน (HN) และจำนวนครั้ง (visit)
          </p>
          {!loading && queryStart && queryEnd ? (
            <p className="mt-1 text-sm font-medium text-teal-800/80">{periodLabel}</p>
          ) : loading ? (
            <p className="mt-1 text-sm text-teal-800/60">กำลังโหลดข้อมูล…</p>
          ) : null}
        </div>
      </div>

      <div className="border-b border-slate-100 bg-slate-50/90 px-3 py-3 sm:px-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-slate-700">ปีงบประมาณ:</span>
          {fiscalOptions.map((fy) => {
            const active = selectedBe === fy.beStart;
            return (
              <button
                key={fy.beStart}
                type="button"
                disabled={loading}
                onClick={() => void loadFiscalYear(fy.beStart)}
                className="rounded-full px-4 py-2 text-sm font-semibold transition hover:opacity-95 disabled:cursor-wait disabled:opacity-60"
                style={
                  active
                    ? { backgroundColor: ACCENT, color: "#fff", boxShadow: "0 2px 8px rgba(47, 143, 70, 0.35)" }
                    : {
                        backgroundColor: "#fff",
                        color: TEXT_MAIN,
                        border: "1px solid #d1d5db",
                      }
                }
              >
                {fy.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-3 sm:p-4">
        {loading ? (
          <div className="space-y-2" aria-hidden>
            <div className="h-12 animate-pulse rounded-lg bg-[#E8ECF8]" />
            <div className="h-12 animate-pulse rounded-lg bg-[#E8ECF8]" />
            <div className="h-12 animate-pulse rounded-lg bg-[#E8ECF8]" />
          </div>
        ) : error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm leading-relaxed text-red-800">
            {error}
          </p>
        ) : !hasData ? (
          <p
            className="rounded-lg border border-dashed border-slate-200 px-4 py-10 text-center text-sm leading-relaxed"
            style={{ color: MUTED }}
          >
            ไม่มีข้อมูลในช่วงวันที่นี้
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200/80 shadow-sm">
            <table className="min-w-[720px] w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th
                    rowSpan={2}
                    className="border-b border-r border-slate-200/80 bg-gradient-to-b from-slate-500 to-slate-600 px-4 py-3 text-left text-sm font-bold text-white"
                  >
                    กลุ่มวัย
                  </th>
                  <th
                    colSpan={2}
                    className={`border-b border-r border-white/20 px-3 py-2.5 text-center text-sm font-bold ${COL_UC.header}`}
                  >
                    บัตรทอง
                  </th>
                  <th
                    colSpan={2}
                    className={`border-b border-r border-white/20 px-3 py-2.5 text-center text-sm font-bold ${COL_GOV.header}`}
                  >
                    ข้าราชการ
                  </th>
                  <th
                    colSpan={2}
                    className={`border-b px-3 py-2.5 text-center text-sm font-bold ${COL_SSS.header}`}
                  >
                    ประกันสังคม
                  </th>
                </tr>
                <tr>
                  <th className={`border-b border-r border-emerald-200/80 px-3 py-2 text-center text-xs font-semibold ${COL_UC.sub}`}>
                    คน
                  </th>
                  <th className={`border-b border-r border-emerald-200/80 px-3 py-2 text-center text-xs font-semibold ${COL_UC.sub}`}>
                    ครั้ง
                  </th>
                  <th className={`border-b border-r border-sky-200/80 px-3 py-2 text-center text-xs font-semibold ${COL_GOV.sub}`}>
                    คน
                  </th>
                  <th className={`border-b border-r border-sky-200/80 px-3 py-2 text-center text-xs font-semibold ${COL_GOV.sub}`}>
                    ครั้ง
                  </th>
                  <th className={`border-b border-r border-violet-200/80 px-3 py-2 text-center text-xs font-semibold ${COL_SSS.sub}`}>
                    คน
                  </th>
                  <th className={`border-b border-violet-200/80 px-3 py-2 text-center text-xs font-semibold ${COL_SSS.sub}`}>
                    ครั้ง
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => {
                  const even = idx % 2 === 0;
                  return (
                    <tr key={r.ageGroup}>
                      <td
                        className={`border-b border-r border-slate-100 px-4 py-3 text-sm font-semibold leading-snug ${
                          even ? "bg-white text-slate-800" : "bg-slate-50/80 text-slate-800"
                        }`}
                      >
                        {r.ageGroup}
                      </td>
                      <td className={`border-b border-r border-emerald-100/80 px-3 py-3 text-right text-sm font-medium tabular-nums ${even ? COL_UC.cell : COL_UC.cellAlt}`}>
                        {numCell(r.ucHn)}
                      </td>
                      <td className={`border-b border-r border-emerald-100/80 px-3 py-3 text-right text-sm font-medium tabular-nums ${even ? COL_UC.cell : COL_UC.cellAlt}`}>
                        {numCell(r.ucVisit)}
                      </td>
                      <td className={`border-b border-r border-sky-100/80 px-3 py-3 text-right text-sm font-medium tabular-nums ${even ? COL_GOV.cell : COL_GOV.cellAlt}`}>
                        {numCell(r.govHn)}
                      </td>
                      <td className={`border-b border-r border-sky-100/80 px-3 py-3 text-right text-sm font-medium tabular-nums ${even ? COL_GOV.cell : COL_GOV.cellAlt}`}>
                        {numCell(r.govVisit)}
                      </td>
                      <td className={`border-b border-r border-violet-100/80 px-3 py-3 text-right text-sm font-medium tabular-nums ${even ? COL_SSS.cell : COL_SSS.cellAlt}`}>
                        {numCell(r.sssHn)}
                      </td>
                      <td className={`border-b border-violet-100/80 px-3 py-3 text-right text-sm font-medium tabular-nums ${even ? COL_SSS.cell : COL_SSS.cellAlt}`}>
                        {numCell(r.sssVisit)}
                      </td>
                    </tr>
                  );
                })}
                <tr className="font-bold">
                  <td className="border-t-2 border-r border-slate-300 bg-slate-700 px-4 py-3 text-sm text-white">
                    รวม
                  </td>
                  <td className={`border-t-2 border-r border-emerald-200 px-3 py-3 text-right text-sm tabular-nums ${COL_UC.total}`}>
                    {numCell(totals.ucHn)}
                  </td>
                  <td className={`border-t-2 border-r border-emerald-200 px-3 py-3 text-right text-sm tabular-nums ${COL_UC.total}`}>
                    {numCell(totals.ucVisit)}
                  </td>
                  <td className={`border-t-2 border-r border-sky-200 px-3 py-3 text-right text-sm tabular-nums ${COL_GOV.total}`}>
                    {numCell(totals.govHn)}
                  </td>
                  <td className={`border-t-2 border-r border-sky-200 px-3 py-3 text-right text-sm tabular-nums ${COL_GOV.total}`}>
                    {numCell(totals.govVisit)}
                  </td>
                  <td className={`border-t-2 border-r border-violet-200 px-3 py-3 text-right text-sm tabular-nums ${COL_SSS.total}`}>
                    {numCell(totals.sssHn)}
                  </td>
                  <td className={`border-t-2 border-violet-200 px-3 py-3 text-right text-sm tabular-nums ${COL_SSS.total}`}>
                    {numCell(totals.sssVisit)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
