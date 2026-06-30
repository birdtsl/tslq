"use client";

import { formatThaiBuddhistDate, ThaiDatePicker } from "@/components/ui/ThaiDatePicker";
import {
  computeCurrentDayRange,
  useHydrationSafeDayRange,
  type IsoMonthRange,
} from "@/hooks/useHydrationSafeMonthRange";
import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { parseJsonResponse } from "@/lib/parseJsonResponse";
import type { ServiceStatsPayload } from "@/types/service-stats";
import { AdmitByWardKpiCard } from "@/components/admin/AdmitByWardKpiCard";
import {
  ServiceMetricSummaryCard,
  buildServiceMetricSummaryCardItems,
} from "./ServiceMetricSummary";
import { PatientServiceStatsCard } from "./PatientServiceStatsCard";
import { OpdAgeRightGroupCard } from "./OpdAgeRightGroupCard";

const ACCENT = "#4D5EFE";
const MUTED = "#A3AED0";
const TEXT_MAIN = "#1B2559";
const CARD_RADIUS = "22px";
const CARD_SHADOW = "0 4px 24px rgba(0, 0, 0, 0.04)";

function yearFromIso(iso: string): number {
  const y = Number.parseInt(iso.slice(0, 4), 10);
  return Number.isFinite(y) ? y : new Date().getFullYear();
}

const COMPARE_OLDER = "#64748B";

/** สีสำหรับวงแบ่งสัดส่วนเตียงที่ครองไว้ตาม ward */
const WARD_OCCUPIED_COLORS = [
  "#4D5EFE",
  "#50D1AA",
  "#FF5B5B",
  "#F59E0B",
  "#7C3AED",
  "#EC4899",
  "#06B6D4",
  "#84CC16",
  "#6366F1",
  "#F97316",
  "#14B8A6",
  "#A855F7",
];

type DonutSegment = { label: string; value: number; color: string };

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = Number.parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (x: number) => Math.max(0, Math.min(255, Math.round(x)));
  return `#${[clamp(r), clamp(g), clamp(b)].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
}

function mixWithWhite(hex: string, t: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return rgbToHex(rgb.r + (255 - rgb.r) * t, rgb.g + (255 - rgb.g) * t, rgb.b + (255 - rgb.b) * t);
}

function mixWithBlack(hex: string, t: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return rgbToHex(rgb.r * (1 - t), rgb.g * (1 - t), rgb.b * (1 - t));
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) };
}

function arcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const sweep = endAngle - startAngle;
  const largeArcFlag = sweep >= 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
}

const DONUT_GAP_DEG = 1.2;

function DonutChart({
  segments,
  size = 280,
  strokeWidth = 38,
  onHover,
  centerValue,
  centerSubtext = "เตียงครองไว้",
}: {
  segments: DonutSegment[];
  size?: number;
  strokeWidth?: number;
  onHover?: (label: string | null) => void;
  /** ถ้าไม่ส่ง จะใช้ผลรวมจาก segments */
  centerValue?: number;
  centerSubtext?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const total = segments.reduce((s, x) => s + x.value, 0);
  const displayTotal = centerValue ?? total;
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const k = segments.filter((s) => s.value > 0).length;
  const gapTotal = k > 0 ? k * DONUT_GAP_DEG : 0;
  const availDeg = Math.max(0, 360 - gapTotal);

  const innerHoleR = Math.max(0, r - strokeWidth / 2);
  const centerFont = innerHoleR > 52 ? 28 : innerHoleR > 42 ? 24 : innerHoleR > 34 ? 20 : 17;
  const subFont = Math.max(9, Math.round(centerFont * 0.4));

  let rot = 0;
  const arcs: { s: DonutSegment; idx: number; start: number; end: number }[] = [];
  if (total > 0) {
    segments.forEach((s, idx) => {
      if (s.value <= 0) return;
      const sweep = (s.value / total) * availDeg;
      const start = rot;
      const end = rot + sweep;
      arcs.push({ s, idx, start, end });
      rot = end + DONUT_GAP_DEG;
    });
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      onMouseLeave={() => onHover?.(null)}
      className="shrink-0 overflow-visible"
      role="img"
      aria-label={`แผนภูมิวงแหวน ${centerSubtext} ${displayTotal.toLocaleString()} เตียง`}
    >
      <defs>
        <filter id={`${uid}-donut-shadow`} x="-35%" y="-35%" width="170%" height="170%">
          <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#1B2559" floodOpacity="0.12" />
        </filter>
        <linearGradient id={`${uid}-donut-track`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F0F3FA" />
          <stop offset="100%" stopColor="#D8DEEA" />
        </linearGradient>
        {segments.map((s, idx) => (
          <linearGradient key={`ward-seg-grad-${uid}-${idx}`} id={`${uid}-seg-${idx}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={mixWithWhite(s.color, 0.32)} />
            <stop offset="50%" stopColor={s.color} />
            <stop offset="100%" stopColor={mixWithBlack(s.color, 0.18)} />
          </linearGradient>
        ))}
      </defs>

      <circle
        cx={cx}
        cy={cy}
        r={r}
        stroke={`url(#${uid}-donut-track)`}
        strokeWidth={strokeWidth}
        fill="none"
        filter={`url(#${uid}-donut-shadow)`}
      />

      {arcs.map(({ s, idx, start, end }) => {
        const pct = total > 0 ? Math.round((s.value / total) * 100) : 0;
        return (
          <g key={`donut-seg-${idx}`}>
            <title>{`${s.label} — ครองไว้ ${s.value.toLocaleString()} เตียง (${pct}%)`}</title>
            <path
              d={arcPath(cx, cy, r, start, end)}
              stroke={`url(#${uid}-seg-${idx})`}
              strokeWidth={strokeWidth}
              fill="none"
              strokeLinecap="butt"
              className={onHover ? "cursor-pointer transition-opacity duration-200 hover:opacity-90" : undefined}
              onMouseEnter={() => onHover?.(s.label)}
            />
          </g>
        );
      })}

      {arcs.map(({ s, idx, start, end }) => {
        const sweepDeg = end - start;
        if (sweepDeg < 11) return null;
        const midAngle = (start + end) / 2;
        const { x: lx, y: ly } = polarToCartesian(cx, cy, r, midAngle);
        const labelSize =
          sweepDeg < 22 ? 9 : sweepDeg < 50 ? 10 : sweepDeg < 90 ? 11 : 12;
        return (
          <text
            key={`donut-seg-lbl-${idx}`}
            x={lx}
            y={ly}
            textAnchor="middle"
            dominantBaseline="central"
            className="pointer-events-none select-none font-sans font-bold tabular-nums"
            fill={TEXT_MAIN}
            stroke="rgba(255, 255, 255, 0.92)"
            strokeWidth={labelSize >= 11 ? 0.55 : 0.45}
            paintOrder="stroke fill"
            style={{ fontSize: labelSize }}
          >
            {s.value.toLocaleString()}
          </text>
        );
      })}

      <text
        x={cx}
        y={cy - subFont * 0.35}
        textAnchor="middle"
        dominantBaseline="middle"
        className="pointer-events-none select-none font-sans font-bold tabular-nums"
        style={{ fontSize: centerFont, fill: TEXT_MAIN }}
      >
        {displayTotal.toLocaleString()}
      </text>
      <text
        x={cx}
        y={cy + centerFont * 0.42}
        textAnchor="middle"
        dominantBaseline="middle"
        className="pointer-events-none select-none font-sans"
        style={{ fontSize: subFont, fill: MUTED }}
      >
        {centerSubtext}
      </text>
    </svg>
  );
}

function MonthlyComparisonBarChart({
  points,
}: {
  points: { month: string; newer: number; older: number }[];
}) {
  const uid = useId().replace(/:/g, "");
  const w = 560;
  const h = 200;
  const pad = { l: 44, r: 14, t: 18, b: 30 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;
  const flat = points.flatMap((p) => [p.newer, p.older]);
  const maxV = Math.max(1, ...flat) * 1.05;
  const yBase = pad.t + innerH;
  const yScale = (v: number) => yBase - (v / maxV) * innerH;
  const n = Math.max(1, points.length);
  const slotW = innerW / n;
  const pairW = slotW * 0.72;
  const gap = 3;
  const barW = Math.max(6, (pairW - gap) / 2);
  const barRx = 5;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-[13rem] w-full max-w-full overflow-visible">
      <defs>
        <filter id={`${uid}-bar-drop`} x="-35%" y="-35%" width="170%" height="170%">
          <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#1B2559" floodOpacity="0.1" />
        </filter>
        <linearGradient id={`${uid}-newer`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={mixWithWhite(ACCENT, 0.38)} />
          <stop offset="50%" stopColor={ACCENT} />
          <stop offset="100%" stopColor={mixWithBlack(ACCENT, 0.2)} />
        </linearGradient>
        <linearGradient id={`${uid}-older`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#A8B4C8" />
          <stop offset="45%" stopColor={COMPARE_OLDER} />
          <stop offset="100%" stopColor="#4A5568" />
        </linearGradient>
        <linearGradient id={`${uid}-panel`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FCFDFF" />
          <stop offset="100%" stopColor="#F4F7FE" />
        </linearGradient>
      </defs>

      <rect
        x={pad.l - 6}
        y={pad.t - 6}
        width={innerW + 12}
        height={innerH + 12}
        rx={10}
        fill={`url(#${uid}-panel)`}
      />
      {/* subtle edge */}
      <rect
        x={pad.l - 6}
        y={pad.t - 6}
        width={innerW + 12}
        height={innerH + 12}
        rx={10}
        fill="none"
        stroke="#E2E8F3"
        strokeWidth="1"
      />

      {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
        const tickVal = maxV * t;
        const y = yScale(tickVal);
        return (
          <g key={i}>
            <line
              x1={pad.l}
              y1={y}
              x2={w - pad.r}
              y2={y}
              stroke="#E2E8F0"
              strokeWidth="1"
              strokeDasharray={i === 0 ? "0" : "4 6"}
              opacity={i === 0 ? 1 : 0.85}
            />
            <text x={2} y={y + 4} className="fill-[#A3AED0] text-[9px] tabular-nums">
              {Math.round(tickVal).toLocaleString()}
            </text>
          </g>
        );
      })}

      {points.map((p, i) => {
        const cx = pad.l + i * slotW + slotW / 2;
        const xOlder = cx - pairW / 2;
        const xNewer = xOlder + barW + gap;
        const yOlder = yScale(p.older);
        const yNewer = yScale(p.newer);
        const hOlder = Math.max(0, yBase - yOlder);
        const hNewer = Math.max(0, yBase - yNewer);
        const cxOlder = xOlder + barW / 2;
        const cxNewer = xNewer + barW / 2;
        const labelOlderY = Math.max(pad.t + 2, yOlder - 4);
        const labelNewerY = Math.max(pad.t + 2, yNewer - 4);
        return (
          <g key={`pair-${i}`}>
            <g filter={`url(#${uid}-bar-drop)`}>
              <rect
                x={xOlder}
                y={yOlder}
                width={barW}
                height={hOlder}
                rx={barRx}
                fill={`url(#${uid}-older)`}
              />
              <rect
                x={xNewer}
                y={yNewer}
                width={barW}
                height={hNewer}
                rx={barRx}
                fill={`url(#${uid}-newer)`}
              />
            </g>
            <text
              x={cxOlder}
              y={labelOlderY}
              textAnchor="middle"
              dominantBaseline="auto"
              fill="#475569"
              fontSize={7}
              fontWeight={700}
            >
              {Math.round(p.older).toLocaleString()}
            </text>
            <text
              x={cxNewer}
              y={labelNewerY}
              textAnchor="middle"
              dominantBaseline="auto"
              fill={mixWithBlack(ACCENT, 0.15)}
              fontSize={7}
              fontWeight={700}
            >
              {Math.round(p.newer).toLocaleString()}
            </text>
          </g>
        );
      })}

      <line
        x1={pad.l}
        y1={yBase}
        x2={w - pad.r}
        y2={yBase}
        stroke="#CBD5E1"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {points.map((p, i) => (
        <text
          key={p.month}
          x={pad.l + i * slotW + slotW / 2}
          y={h - 8}
          textAnchor="middle"
          className="fill-[#64748B] text-[8px] font-medium"
        >
          {p.month}
        </text>
      ))}
    </svg>
  );
}

function MonthlyBarChart({ data }: { data: { month: string; value: number }[] }) {
  const uid = useId().replace(/:/g, "");
  const w = 400;
  const h = 168;
  const pad = { l: 40, r: 12, t: 16, b: 28 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;
  const vals = data.map((d) => d.value);
  const maxV = Math.max(1, ...vals) * 1.05;
  const yBase = pad.t + innerH;
  const yScale = (v: number) => yBase - (v / maxV) * innerH;
  const n = Math.max(1, data.length);
  const slotW = innerW / n;
  const barW = Math.max(9, slotW * 0.56);
  const barRx = 6;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-44 w-full max-w-full overflow-visible">
      <defs>
        <filter id={`${uid}-mono-bar-shadow`} x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#1B2559" floodOpacity="0.11" />
        </filter>
        <linearGradient id={`${uid}-mono-fill`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={mixWithWhite(ACCENT, 0.4)} />
          <stop offset="48%" stopColor={ACCENT} />
          <stop offset="100%" stopColor={mixWithBlack(ACCENT, 0.22)} />
        </linearGradient>
        <linearGradient id={`${uid}-mono-panel`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FCFDFF" />
          <stop offset="100%" stopColor="#F4F7FE" />
        </linearGradient>
      </defs>

      <rect
        x={pad.l - 6}
        y={pad.t - 6}
        width={innerW + 12}
        height={innerH + 12}
        rx={10}
        fill={`url(#${uid}-mono-panel)`}
      />
      <rect
        x={pad.l - 6}
        y={pad.t - 6}
        width={innerW + 12}
        height={innerH + 12}
        rx={10}
        fill="none"
        stroke="#E2E8F3"
        strokeWidth="1"
      />

      {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
        const tickVal = maxV * t;
        const y = yScale(tickVal);
        return (
          <g key={i}>
            <line
              x1={pad.l}
              y1={y}
              x2={w - pad.r}
              y2={y}
              stroke="#E2E8F0"
              strokeWidth="1"
              strokeDasharray={i === 0 ? "0" : "4 6"}
              opacity={i === 0 ? 1 : 0.88}
            />
            <text x={4} y={y + 4} className="fill-[#A3AED0] text-[10px] tabular-nums">
              {Math.round(tickVal).toLocaleString()}
            </text>
          </g>
        );
      })}

      {data.map((d, i) => {
        const cx = pad.l + i * slotW + slotW / 2;
        const x = cx - barW / 2;
        const yTop = yScale(d.value);
        const bh = Math.max(0, yBase - yTop);
        return (
          <g key={`bar-${i}`} filter={`url(#${uid}-mono-bar-shadow)`}>
            <rect
              x={x}
              y={yTop}
              width={barW}
              height={bh}
              rx={barRx}
              fill={`url(#${uid}-mono-fill)`}
            />
          </g>
        );
      })}

      {data.map((d, i) => {
        const cx = pad.l + i * slotW + slotW / 2;
        const yTop = yScale(d.value);
        const labelY = Math.max(pad.t + 2, yTop - 5);
        return (
          <text
            key={`bar-val-${i}`}
            x={cx}
            y={labelY}
            textAnchor="middle"
            dominantBaseline="auto"
            fill={TEXT_MAIN}
            fontSize={10}
            fontWeight={700}
            className="tabular-nums"
          >
            {Math.round(d.value).toLocaleString()}
          </text>
        );
      })}

      <line
        x1={pad.l}
        y1={yBase}
        x2={w - pad.r}
        y2={yBase}
        stroke="#CBD5E1"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {data.map((d, i) => (
        <text
          key={d.month}
          x={pad.l + i * slotW + slotW / 2}
          y={h - 8}
          textAnchor="middle"
          className={
            n > 8 ? "fill-[#64748B] text-[8px] font-medium" : "fill-[#64748B] text-[11px] font-medium"
          }
        >
          {d.month}
        </text>
      ))}
    </svg>
  );
}

function ClinicBars({
  rows,
}: {
  rows: { name: string; personCount: number; visitCount: number }[];
}) {
  const max = Math.max(...rows.map((r) => r.visitCount), 1);
  const colSize = Math.max(1, Math.ceil(rows.length / 3));
  const columns = [
    rows.slice(0, colSize),
    rows.slice(colSize, colSize * 2),
    rows.slice(colSize * 2),
  ].filter((x) => x.length > 0);

  const fillGradient = `linear-gradient(180deg, ${mixWithWhite(ACCENT, 0.32)} 0%, ${ACCENT} 48%, ${mixWithBlack(ACCENT, 0.18)} 100%)`;

  return (
    <div
      className="max-h-[min(17rem,38vh)] overflow-y-auto overscroll-y-contain rounded-lg border border-[#E8ECF8] bg-gradient-to-b from-[#FCFDFF] to-[#F4F7FE] p-2.5 md:max-h-[min(19rem,42vh)] md:p-2.5"
      style={{
        boxShadow:
          "0 1px 3px rgba(27, 37, 89, 0.05), 0 0 0 1px rgba(255,255,255,0.6) inset, inset 0 1px 0 rgba(255,255,255,0.95)",
      }}
    >
      <div className="grid grid-cols-1 gap-x-3 gap-y-0 md:grid-cols-3">
        {columns.map((col, idx) => (
          <ul key={idx} className="space-y-2">
            {col.map((r) => {
              const pct = Math.round((r.visitCount / max) * 100);
              return (
                <li key={r.name} className="min-w-0">
                  <div className="mb-0.5 flex items-start justify-between gap-1.5 text-[11px] leading-snug md:text-xs">
                    <span className="line-clamp-2 min-w-0 flex-1 font-medium" style={{ color: TEXT_MAIN }}>
                      {r.name}
                    </span>
                    <div className="shrink-0 text-right text-[10px] leading-tight md:text-[11px]">
                      <div className="tabular-nums">
                        <span style={{ color: MUTED }}>คน </span>
                        <span className="font-bold" style={{ color: ACCENT }}>
                          {r.personCount.toLocaleString("th-TH")}
                        </span>
                      </div>
                      <div className="tabular-nums">
                        <span style={{ color: MUTED }}>ครั้ง </span>
                        <span className="font-bold" style={{ color: ACCENT }}>
                          {r.visitCount.toLocaleString("th-TH")}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div
                    className="relative h-1.5 overflow-hidden rounded-full"
                    style={{
                      background: "linear-gradient(180deg, #D1D9E8 0%, #E8ECF8 100%)",
                      boxShadow: "inset 0 1px 3px rgba(27, 37, 89, 0.08)",
                    }}
                  >
                    <div
                      className="h-full rounded-full transition-[width] duration-300 ease-out"
                      style={{
                        width: `${pct}%`,
                        background: fillGradient,
                        boxShadow:
                          "0 1px 4px rgba(77, 94, 254, 0.28), inset 0 1px 0 rgba(255,255,255,0.4)",
                      }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        ))}
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  hint,
  highlight,
}: {
  label: string;
  value: string;
  hint?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className="p-5 transition-shadow hover:shadow-[0_8px_30px_rgba(77,94,254,.12)]"
      style={{
        borderRadius: CARD_RADIUS,
        backgroundColor: highlight ? ACCENT : "#fff",
        boxShadow: highlight ? "0 12px 40px rgba(77, 94, 254, 0.25)" : CARD_SHADOW,
      }}
    >
      <p className={`text-xs font-medium ${highlight ? "text-white/80" : ""}`} style={!highlight ? { color: MUTED } : undefined}>
        {label}
      </p>
      <p
        className={`mt-2 text-2xl font-bold tabular-nums ${highlight ? "text-white" : ""}`}
        style={!highlight ? { color: TEXT_MAIN } : undefined}
      >
        {value}
      </p>
      {hint ? (
        <p className={`mt-2 text-xs ${highlight ? "text-white/70" : ""}`} style={!highlight ? { color: MUTED } : undefined}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function ServiceStatsView() {
  const baseRange = useHydrationSafeDayRange();
  const [range, setRange] = useState<IsoMonthRange | null>(() => baseRange ?? computeCurrentDayRange());

  const start = range?.start ?? "";
  const end = range?.end ?? "";
  const [trendYear, setTrendYear] = useState<number | null>(() =>
    yearFromIso((baseRange ?? computeCurrentDayRange()).end),
  );

  const [pickerOpen, setPickerOpen] = useState<null | "start" | "end">(null);
  const [data, setData] = useState<ServiceStatsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const trendYearOptions = useMemo(() => {
    if (!range) return [] as number[];
    const cy = yearFromIso(range.end);
    const list: number[] = [];
    for (let y = cy + 1; y >= cy - 12; y--) list.push(y);
    return list;
  }, [range]);

  const load = useCallback(async () => {
    if (!start || !end || trendYear == null) return;
    setLoading(true);
    setLoadError(null);
    try {
      const q = new URLSearchParams({
        start,
        end,
        trendYear: String(trendYear),
      });
      const res = await fetch(`/api/service-stats?${q.toString()}`, {
        cache: "no-store",
      });
      const json = await parseJsonResponse<ServiceStatsPayload & { error?: string }>(res);
      if (!res.ok) {
        setLoadError(json.error ?? `HTTP ${res.status}`);
        return;
      }
      setData(json);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "โหลดไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [start, end, trendYear]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => void load(), [load]);

  const admitByWardFromStats = useMemo(() => {
    if (!data) {
      return {
        rows: [] as { ward: string; wardName: string; count: number; totalBedDays?: number }[],
        total: null as number | null,
        error: null as string | null,
      };
    }
    return {
      rows: data.admitByWard ?? [],
      total: data.admitTotal,
      error: data.admitError,
    };
  }, [data]);

  if (!range || trendYear == null) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-24 rounded-[22px] bg-[#E8ECF8]" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-28 rounded-[22px] bg-[#E8ECF8]" />
          ))}
        </div>
      </div>
    );
  }

  if (loadError && !data) {
    return (
      <div
        className="rounded-[16px] border p-4 text-sm"
        style={{ borderColor: "rgba(255, 91, 91, 0.35)", backgroundColor: "rgba(255, 91, 91, 0.08)", color: "#b91c1c" }}
      >
        ไม่สามารถโหลดสถิติได้: {loadError}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-24 rounded-[22px] bg-[#E8ECF8]" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-28 rounded-[22px] bg-[#E8ECF8]" />
          ))}
        </div>
      </div>
    );
  }

  const cardItems = buildServiceMetricSummaryCardItems(data);

  return (
    <div className={`space-y-4 ${loading ? "opacity-90" : ""}`}>
      {loadError ? (
        <div
          className="rounded-[14px] border px-3 py-2 text-sm"
          style={{ borderColor: "rgba(255, 91, 91, 0.35)", backgroundColor: "rgba(255, 91, 91, 0.08)", color: "#b91c1c" }}
        >
          {loadError}
        </div>
      ) : null}

      <div
        className="rounded-lg px-4 py-2 text-white"
        style={{ backgroundColor: "#2F8F46" }}
      >
        <h1 className="text-base font-semibold">
          ภาพรวมโรงพยาบาลทุ่งเสลี่ยม
        </h1>
      </div>

      <div
        className="space-y-3 rounded-lg border bg-white p-3"
        style={{ borderColor: "#E5E7EB" }}
      >
        <div className="flex flex-nowrap items-end gap-3 overflow-x-auto pb-1">
          <div className="dash-filter-bar min-w-max flex flex-row flex-nowrap items-end gap-2 [&>.relative]:w-auto [&>.relative]:shrink-0 [&>button]:w-auto [&>button]:shrink-0">
            <ThaiDatePicker
              id="svc-stats-start"
              label="วันที่เริ่มต้น"
              value={start}
              onChange={(iso) => setRange((r) => ({ ...(r ?? range), start: iso }))}
              isOpen={pickerOpen === "start"}
              onOpenChange={(open) => setPickerOpen(open ? "start" : null)}
            />
            <ThaiDatePicker
              id="svc-stats-end"
              label="ถึงวันที่สิ้นสุด"
              value={end}
              onChange={(iso) => setRange((r) => ({ ...(r ?? range), end: iso }))}
              isOpen={pickerOpen === "end"}
              onOpenChange={(open) => setPickerOpen(open ? "end" : null)}
            />
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              className="rounded px-5 py-2 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-60"
              style={{ backgroundColor: "#2F8F46" }}
            >
              {loading ? "กำลังโหลด…" : "แสดงผล"}
            </button>
            <button
              type="button"
              onClick={() => {
                const d = computeCurrentDayRange();
                setRange(d);
                setTrendYear(yearFromIso(d.end));
              }}
              className="rounded bg-gray-100 px-5 py-2 text-sm font-semibold text-gray-700"
            >
              Reset
            </button>
          </div>
          <p className="whitespace-nowrap text-xs" style={{ color: MUTED }}>
            {data.periodLabel} ({formatThaiBuddhistDate(data.start)} - {formatThaiBuddhistDate(data.end)})
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cardItems.map((x) =>
          x.variant === "ipd" ? (
            <div key="admit-by-ward" className="sm:col-span-2 xl:col-span-2">
              <AdmitByWardKpiCard
                loading={loading}
                error={admitByWardFromStats.error}
                total={admitByWardFromStats.total}
                rows={admitByWardFromStats.rows}
                showRoomGrid={false}
                className="h-full min-h-[7.5rem]"
              />
            </div>
          ) : (
            <ServiceMetricSummaryCard
              key={x.label}
              label={x.label}
              value={x.value}
              dualMetrics={x.dualMetrics}
              color={x.color}
              variant={x.variant}
            />
          ),
        )}
      </div>

      <PatientServiceStatsCard />

      <OpdAgeRightGroupCard />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border bg-white p-3" style={{ borderColor: "#E5E7EB" }}>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold" style={{ color: TEXT_MAIN }}>
              จำนวนผู้มารับบริการรายเดือน
            </h2>
            <label className="flex items-center gap-2 text-xs" style={{ color: MUTED }}>
              <span className="whitespace-nowrap">ปีหลัก (พ.ศ.)</span>
              <select
                value={trendYear}
                onChange={(e) => {
                  setTrendYear(Number(e.target.value));
                }}
                className="min-w-[9rem] rounded border border-gray-200 bg-white px-2 py-1.5 text-sm font-medium shadow-sm"
                style={{ color: TEXT_MAIN }}
              >
                {trendYearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y + 543} (ค.ศ. {y})
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p className="mb-1 text-[11px]" style={{ color: MUTED }}>
            เปรียบเทียบ 12 เดือน (ม.ค.–ธ.ค.) ระหว่าง พ.ศ. {trendYear + 543} กับ พ.ศ.{" "}
            {trendYear - 1 + 543} — โหลดอัตโนมัติเมื่อเปลี่ยนปี
          </p>
          {data.monthlyComparison ? (
            <>
              <div className="mb-2 flex flex-wrap gap-4 text-[11px]" style={{ color: MUTED }}>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-4 rounded-sm" style={{ background: ACCENT }} />
                  <span style={{ color: TEXT_MAIN }} className="font-medium">
                    พ.ศ. {data.monthlyComparison.yearNewer + 543}
                  </span>
                  <span>(ค.ศ. {data.monthlyComparison.yearNewer})</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-4 rounded-sm" style={{ background: COMPARE_OLDER }} />
                  <span style={{ color: TEXT_MAIN }} className="font-medium">
                    พ.ศ. {data.monthlyComparison.yearOlder + 543}
                  </span>
                  <span>(ค.ศ. {data.monthlyComparison.yearOlder})</span>
                </span>
              </div>
              <MonthlyComparisonBarChart points={data.monthlyComparison.points} />
            </>
          ) : (
            <MonthlyBarChart data={data.monthlyTrend} />
          )}
        </div>
        <div className="rounded-lg border bg-white p-2.5 md:p-3" style={{ borderColor: "#E5E7EB" }}>
          <h2 className="mb-1 text-xs font-semibold md:text-sm" style={{ color: TEXT_MAIN }}>
            จำนวนผู้มารับบริการรายห้องตรวจ
          </h2>
          <p className="mb-2 text-[10px] leading-snug md:text-[11px]" style={{ color: MUTED }}>
            จำนวนคน = HN ไม่ซ้ำ · จำนวนครั้ง = จำนวน visit (แถบกราฟอ้างอิงจำนวนครั้ง)
          </p>
          <ClinicBars rows={data.byExamRoom} />
        </div>
      </div>

      <div className="rounded-lg border bg-white p-3" style={{ borderColor: "#E5E7EB" }}>
        <h2 className="mb-1 text-sm font-semibold" style={{ color: TEXT_MAIN }}>
          สถานะเตียงผู้ป่วยใน (ราย Ward)
        </h2>
        {data.wardBedOccupancyError ? (
          <p className="text-sm" style={{ color: "#b91c1c" }}>
            ไม่สามารถโหลดข้อมูล ward ได้: {data.wardBedOccupancyError}
          </p>
        ) : data.wardBedOccupancy.length === 0 ? (
          <p className="text-sm" style={{ color: MUTED }}>
            ไม่มี ward ที่มีเตียง (bedcount &gt; 0)
          </p>
        ) : (
          (() => {
            const totalOccupied = data.wardBedOccupancy.reduce((s, r) => s + r.occupied, 0);
            const segments: DonutSegment[] = [...data.wardBedOccupancy]
              .filter((r) => r.occupied > 0)
              .sort((a, b) => b.occupied - a.occupied)
              .map((r, i) => ({
                label: (r.wardName || r.ward || "Ward").trim(),
                value: r.occupied,
                color: WARD_OCCUPIED_COLORS[i % WARD_OCCUPIED_COLORS.length],
              }));
            return (
              <div className="mb-4 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:justify-center">
                {totalOccupied <= 0 || segments.length === 0 ? (
                  <p className="w-full text-center text-sm" style={{ color: MUTED }}>
                    ยังไม่มีเตียงที่ครองไว้ (ครองไว้รวม 0 เตียง)
                  </p>
                ) : (
                  <>
                    <div className="flex flex-col items-center">
                      <DonutChart
                        segments={segments}
                        size={280}
                        strokeWidth={38}
                        centerValue={totalOccupied}
                        centerSubtext="รวมครองไว้"
                      />
                    </div>
                    <ul className="w-full max-w-md space-y-2 text-xs sm:w-auto">
                      {segments.map((s, idx) => (
                        <li key={`ward-leg-${idx}`} className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: s.color }}
                          />
                          <span className="min-w-0 flex-1 leading-snug" style={{ color: TEXT_MAIN }}>
                            {s.label}
                          </span>
                          <span className="tabular-nums font-semibold" style={{ color: TEXT_MAIN }}>
                            {s.value.toLocaleString()}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            );
          })()
        )}
      </div>

    </div>
  );
}
