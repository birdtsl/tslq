"use client";

import { useHydrationSafeTodayIso } from "@/hooks/useHydrationSafeTodayIso";
import { parseJsonResponse } from "@/lib/parseJsonResponse";
import type { PatientServiceStatsPayload, PatientServiceYearStats } from "@/types/patient-service-stats";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

const TEXT_MAIN = "#1B2559";
const ACCENT = "#2F8F46";

function currentFiscalBeStart(): number {
  const now = new Date();
  const y = now.getFullYear();
  return now.getMonth() >= 9 ? y + 543 : y + 542;
}

/** ช่วงปีงบ พ.ศ. แบบเดียวกับปุ่มเลือกปี (เช่น 2568–2569) */
function chartFiscalYearRangeLabel(beStart: number): string {
  return `${beStart}–${beStart + 1}`;
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

const SUMMARY_CARDS = [
  { key: "ipdCases" as const, title: "จำนวนผู้ป่วยใน", unit: "ราย", color: "#8b5cf6", light: "#ede9fe" },
  { key: "totalBedDays" as const, title: "วันนอนทั้งหมด", unit: "วัน", color: "#f97316", light: "#ffedd5" },
] as const;

const CHART_CARDS = [
  ...SUMMARY_CARDS,
  { key: "opdPersons" as const, title: "จำนวนผู้ป่วยนอก/คน", color: "#14b8a6" },
  { key: "opdVisits" as const, title: "จำนวนผู้ป่วยนอก/ครั้ง", color: "#3b82f6" },
] as const;

const TABLE_ROWS: {
  key: keyof Pick<
    PatientServiceYearStats,
    "opdPersons" | "opdVisits" | "avgOpdPerDay" | "ipdCases" | "avgLos" | "totalBedDays" | "cmi" | "bedOccupancyRate" | "adjrw"
  >;
  label: string;
  format: (v: number) => string;
}[] = [
  { key: "opdPersons", label: "จำนวนผู้ป่วยนอก/คน", format: (v) => v.toLocaleString("th-TH") },
  { key: "opdVisits", label: "จำนวนผู้ป่วยนอก/ครั้ง", format: (v) => v.toLocaleString("th-TH") },
  { key: "avgOpdPerDay", label: "จำนวนผู้ป่วยนอกเฉลี่ยต่อวัน", format: (v) => v.toLocaleString("th-TH") },
  { key: "ipdCases", label: "จำนวนผู้ป่วยใน", format: (v) => v.toLocaleString("th-TH") },
  { key: "avgLos", label: "วันนอนเฉลี่ย", format: (v) => v.toLocaleString("th-TH", { maximumFractionDigits: 1 }) },
  { key: "totalBedDays", label: "วันนอนทั้งหมด", format: (v) => v.toLocaleString("th-TH") },
  { key: "cmi", label: "CMI", format: (v) => v.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
  { key: "bedOccupancyRate", label: "อัตราการครองเตียง (%)", format: (v) => v.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
  { key: "adjrw", label: "AdjRW", format: (v) => v.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
];

/** โทนสีคอลัมน์ปีงบ — ปีล่าสุดเน้นสีเข้มขึ้น */
const YEAR_COL_STYLES = [
  {
    th: "bg-gradient-to-b from-slate-500 via-slate-600 to-slate-700 text-white shadow-sm",
    td: "bg-slate-50/90 text-slate-800",
    tdLast: "bg-slate-100 font-bold text-slate-900",
  },
  {
    th: "bg-gradient-to-b from-sky-400 via-sky-500 to-sky-600 text-white shadow-sm",
    td: "bg-sky-50/95 text-sky-950",
    tdLast: "bg-sky-100/95 font-bold text-sky-950",
  },
  {
    th: "bg-gradient-to-b from-violet-400 via-violet-500 to-violet-600 text-white shadow-sm",
    td: "bg-violet-50/95 text-violet-950",
    tdLast: "bg-violet-100/95 font-bold text-violet-950",
  },
  {
    th: "bg-gradient-to-b from-emerald-400 via-emerald-500 to-emerald-600 text-white shadow-sm",
    td: "bg-emerald-50/95 text-emerald-950",
    tdLast: "bg-emerald-100 font-bold text-emerald-950 ring-1 ring-inset ring-emerald-200/80",
  },
] as const;

const ROW_LABEL_BG = ["bg-white", "bg-slate-50/70"] as const;

function SummaryMiniCard({
  title,
  value,
  unit,
  period,
  color,
  light,
}: {
  title: string;
  value: string;
  unit: string;
  period: string;
  color: string;
  light: string;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-xl p-4 text-white shadow-md"
      style={{ background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)` }}
    >
      <div
        className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full opacity-40 blur-xl"
        style={{ backgroundColor: light }}
        aria-hidden
      />
      <div className="relative flex items-start gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20 shadow-inner"
          aria-hidden
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="8" r="3.5" />
            <path d="M5 20c0-3.5 3.1-6 7-6s7 2.5 7 6" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold leading-snug opacity-95">{title}</p>
          <p className="mt-1 text-2xl font-extrabold tabular-nums tracking-tight sm:text-[1.65rem]">
            {value}
            <span className="ml-1 text-sm font-bold opacity-90">{unit}</span>
          </p>
          <p className="mt-1 text-[10px] font-medium opacity-80">{period}</p>
        </div>
      </div>
    </div>
  );
}

function YearTrendBarChart({
  title,
  fiscalYears,
  values,
  color,
  animKey,
  formatValue,
}: {
  title: string;
  fiscalYears: number[];
  values: number[];
  color: string;
  animKey: string;
  formatValue?: (v: number) => string;
}) {
  const uid = useId().replace(/:/g, "");
  const w = 400;
  const h = 220;
  const pad = { l: 12, r: 12, t: 28, b: 58 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;
  const maxV = Math.max(1, ...values) * 1.08;
  const n = fiscalYears.length;
  const slotW = n > 0 ? innerW / n : innerW;
  const barW = Math.max(22, Math.min(56, slotW * 0.58));
  const yBase = pad.t + innerH;
  const fmt = formatValue ?? ((v: number) => v.toLocaleString("th-TH"));

  return (
    <div className="flex h-full min-h-[11.5rem] flex-col rounded-lg border border-slate-100 bg-slate-50/60 p-3">
      <p className="mb-2 shrink-0 truncate text-[13px] font-bold leading-tight" style={{ color: TEXT_MAIN }}>
        {title}
      </p>
      <div className="relative min-h-0 flex-1">
        <svg
          viewBox={`0 0 ${w} ${h}`}
          className="absolute inset-0 h-full w-full"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={title}
        >
          <defs>
            <linearGradient id={`${uid}-bar`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.95" />
              <stop offset="100%" stopColor={color} stopOpacity="0.65" />
            </linearGradient>
          </defs>
          {values.map((v, i) => {
            const cx = pad.l + i * slotW + slotW / 2;
            const barH = Math.max(0, (v / maxV) * innerH);
            const y = yBase - barH;
            const isLast = i === n - 1;
            const valueLabelY = Math.max(pad.t + 6, y - 12);
            const delay = `${i * 0.1}s`;
            return (
              <g key={`${fiscalYears[i]}-${animKey}-${i}`}>
                <rect
                  x={cx - barW / 2}
                  y={yBase}
                  width={barW}
                  height={0}
                  rx={5}
                  fill={isLast ? `url(#${uid}-bar)` : color}
                  opacity={isLast ? 1 : 0.72}
                >
                  <animate
                    attributeName="height"
                    from="0"
                    to={String(barH)}
                    dur="0.65s"
                    begin={delay}
                    fill="freeze"
                    calcMode="spline"
                    keySplines="0.22 1 0.36 1"
                    keyTimes="0;1"
                  />
                  <animate
                    attributeName="y"
                    from={String(yBase)}
                    to={String(y)}
                    dur="0.65s"
                    begin={delay}
                    fill="freeze"
                    calcMode="spline"
                    keySplines="0.22 1 0.36 1"
                    keyTimes="0;1"
                  />
                </rect>
                <text
                  x={cx}
                  y={valueLabelY}
                  textAnchor="middle"
                  dominantBaseline="auto"
                  fill="#0f172a"
                  fontSize={17}
                  fontWeight={700}
                  className="tabular-nums"
                  opacity={0}
                >
                  {fmt(v)}
                  <animate
                    attributeName="opacity"
                    from="0"
                    to="1"
                    dur="0.35s"
                    begin={`${0.45 + i * 0.1}s`}
                    fill="freeze"
                  />
                  <animate
                    attributeName="y"
                    from={String(yBase - 6)}
                    to={String(valueLabelY)}
                    dur="0.35s"
                    begin={`${0.45 + i * 0.1}s`}
                    fill="freeze"
                  />
                </text>
                <text x={cx} y={h - 34} textAnchor="middle" fill="#0f172a" fontSize={11} fontWeight={600}>
                  <tspan x={cx} dy={0}>
                    ปีงบ
                  </tspan>
                  <tspan x={cx} dy={14} fontSize={12} fontWeight={700}>
                    {chartFiscalYearRangeLabel(fiscalYears[i])}
                  </tspan>
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

export function PatientServiceStatsCard() {
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
  const [payload, setPayload] = useState<PatientServiceStatsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFiscalYear = useCallback(
    async (beStart: number) => {
      const fy = fiscalYearRange(beStart, capEnd);
      setSelectedBe(beStart);
      setLoading(true);
      setError(null);
      try {
        const q = new URLSearchParams({ start: fy.start, end: fy.end });
        const res = await fetch(`/api/patient-service-stats?${q}`, { cache: "no-store" });
        const json = await parseJsonResponse<PatientServiceStatsPayload>(res);
        if (!res.ok) {
          setError(json.error ?? `HTTP ${res.status}`);
          setPayload(null);
          return;
        }
        setPayload(json);
        if (json.error) setError(json.error);
      } catch (e) {
        setError(e instanceof Error ? e.message : "โหลดไม่สำเร็จ");
        setPayload(null);
      } finally {
        setLoading(false);
      }
    },
    [capEnd],
  );

  const autoLoadedRef = useRef(false);
  useEffect(() => {
    if (!todayIso || autoLoadedRef.current) return;
    autoLoadedRef.current = true;
    void loadFiscalYear(currentFiscalBeStart());
  }, [todayIso, loadFiscalYear]);

  const summary = payload?.summary;
  const years = payload?.yearlyComparison ?? [];
  const periodLabel = summary?.label ?? "…";
  const hasData = payload != null && !loading;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div
        className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-700/20 px-4 py-3"
        style={{ background: "linear-gradient(90deg, #ecfdf5 0%, #f0fdf4 50%, #fff 100%)" }}
      >
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold text-emerald-900 sm:text-base">
            สถิติบริการผู้ป่วย โรงพยาบาลทุ่งเสลี่ยม
          </h2>
          {payload?.periodLabel ? (
            <p className="mt-0.5 text-[11px] text-emerald-800/70">{payload.periodLabel}</p>
          ) : loading ? (
            <p className="mt-0.5 text-[11px] text-emerald-800/60">กำลังโหลดปีงบประมาณล่าสุด…</p>
          ) : null}
        </div>
      </div>

      <div className="border-b border-slate-100 bg-slate-50/80 px-3 py-2.5 sm:px-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-600">ปีงบประมาณ:</span>
          {fiscalOptions.map((fy) => {
            const active = selectedBe === fy.beStart;
            return (
              <button
                key={fy.beStart}
                type="button"
                disabled={loading}
                onClick={() => void loadFiscalYear(fy.beStart)}
                className="rounded-full px-3.5 py-1.5 text-xs font-semibold transition hover:opacity-95 disabled:cursor-wait disabled:opacity-60"
                style={
                  active
                    ? { backgroundColor: ACCENT, color: "#fff" }
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
          {loading ? (
            <span className="text-[11px] font-medium text-slate-500">กำลังโหลด…</span>
          ) : null}
        </div>
      </div>

      <div className="space-y-4 p-3 sm:p-4">
        {error ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            {error}
          </div>
        ) : null}

        {hasData || loading ? (
        <>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {SUMMARY_CARDS.map((c) => (
            <SummaryMiniCard
              key={c.key}
              title={c.title}
              value={
                loading || !summary
                  ? "…"
                  : summary[c.key].toLocaleString("th-TH")
              }
              unit={c.unit}
              period={loading ? "…" : periodLabel}
              color={c.color}
              light={c.light}
            />
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-2 lg:items-stretch">
          <div className="overflow-hidden rounded-xl border border-slate-200/80 shadow-sm">
            <h3 className="border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 px-3 py-2.5 text-xs font-bold text-emerald-900">
              สรุปสถิติบริการผู้ป่วย จำแนกตามรายการ
            </h3>
            {loading ? (
              <div className="animate-pulse space-y-2 p-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-7 rounded-lg bg-slate-100" />
                ))}
              </div>
            ) : years.length === 0 ? (
              <p className="p-4 text-sm text-slate-500">ไม่มีข้อมูล</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[32rem] border-collapse text-xs">
                  <thead>
                    <tr>
                      <th className="sticky left-0 z-10 border-b border-r border-slate-200 bg-gradient-to-b from-slate-100 to-slate-200 px-2.5 py-2.5 text-center font-bold text-slate-600">
                        #
                      </th>
                      <th className="sticky left-[2.25rem] z-10 min-w-[10.5rem] border-b border-r border-slate-200 bg-gradient-to-b from-slate-100 to-slate-200 px-3 py-2.5 text-left font-bold text-slate-700">
                        สถิติบริการ
                      </th>
                      {years.map((y, colIdx) => {
                        const tone = YEAR_COL_STYLES[colIdx % YEAR_COL_STYLES.length];
                        return (
                          <th
                            key={y.fiscalYearBe}
                            className={`border-b border-slate-200/60 px-2.5 py-2.5 text-right text-[11px] font-bold leading-snug ${tone.th}`}
                          >
                            {y.label}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {TABLE_ROWS.map((row, idx) => (
                      <tr key={row.key} className="border-b border-slate-100/80">
                        <td className="sticky left-0 z-[1] border-r border-slate-100 bg-slate-50 px-2.5 py-2.5 text-center font-semibold tabular-nums text-slate-500">
                          {idx + 1}
                        </td>
                        <td
                          className={`sticky left-[2.25rem] z-[1] border-r border-slate-100 px-3 py-2.5 font-semibold text-slate-800 ${ROW_LABEL_BG[idx % 2]}`}
                        >
                          {row.label}
                        </td>
                        {years.map((y, colIdx) => {
                          const val = y[row.key];
                          const isLast = colIdx === years.length - 1;
                          const tone = YEAR_COL_STYLES[colIdx % YEAR_COL_STYLES.length];
                          return (
                            <td
                              key={`${y.fiscalYearBe}-${row.key}`}
                              className={`px-3 py-2.5 text-right tabular-nums ${isLast ? tone.tdLast : tone.td}`}
                            >
                              {row.format(val)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="flex min-h-0 flex-col rounded-lg border border-slate-100">
            <h3 className="shrink-0 border-b border-slate-100 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800">
              ภาพรวมบริการผู้ป่วย
            </h3>
            {loading ? (
              <div className="grid flex-1 grid-cols-1 gap-3 p-3 sm:grid-cols-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={`chart-skel-${i}`} className="min-h-[11.5rem] animate-pulse rounded-lg bg-slate-100" />
                ))}
              </div>
            ) : (
              <div className="grid flex-1 auto-rows-fr grid-cols-1 gap-3 p-3 sm:grid-cols-2">
                {CHART_CARDS.map((c) => (
                  <YearTrendBarChart
                    key={`${c.key}-${selectedBe ?? "none"}`}
                    animKey={`${c.key}-${selectedBe ?? "none"}`}
                    title={c.title}
                    fiscalYears={years.map((y) => y.fiscalYearBe)}
                    values={years.map((y) => y[c.key])}
                    color={c.color}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
        </>
        ) : null}
      </div>
    </div>
  );
}
