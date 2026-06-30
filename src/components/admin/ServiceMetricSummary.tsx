"use client";

import type { ServiceStatsPayload } from "@/types/service-stats";
import { useId } from "react";

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

export type ServiceMetricVariant = "opd" | "ipd" | "er" | "telemed";

export type ServiceMetricSummaryCardItem = {
  label: string;
  value: number;
  color: string;
  variant: ServiceMetricVariant;
  /** แสดง 2 ค่าแทนตัวเลขเดียว (เช่น จำนวนคน / จำนวนครั้ง) */
  dualMetrics?: { label: string; value: number }[];
};

/** เทียบรหัส main_dep แบบเดียวกับ 011 / 076 (รองรับ DB ส่ง 11, 76) */
function normalizeDepCode(raw: string | undefined): string {
  if (raw == null || raw === "") return "";
  const s = String(raw).trim();
  if (/^\d+$/.test(s)) return s.padStart(3, "0");
  return s;
}

export type BuildServiceMetricSummaryOptions = {
  /** ไม่รวมการ์ดตาม variant (เช่น หน้าผู้บริหารซ้ำกับ OPD / ผู้ป่วยในแล้ว) */
  excludeVariants?: ServiceMetricVariant[];
};

/** สร้างชุดการ์ด 4 ใบแบบเดียวกับหน้าภาพรวมโรงพยาบาล */
export function buildServiceMetricSummaryCardItems(
  data: ServiceStatsPayload,
  options?: BuildServiceMetricSummaryOptions,
): ServiceMetricSummaryCardItem[] {
  const m = data.metrics;
  const hasExamRoomCodes = data.byExamRoom.some((r) => r.code != null && String(r.code).trim() !== "");
  const visitsRoom011076 = data.byExamRoom.reduce((sum, r) => {
    const c = normalizeDepCode(r.code);
    if (c === "011" || c === "076") return sum + r.visitCount;
    return sum;
  }, 0);
  const kpiRoom011076 = hasExamRoomCodes ? visitsRoom011076 : m.er;
  const all: ServiceMetricSummaryCardItem[] = [
    {
      label: "ผู้ป่วยนอกทั้งหมด",
      value: m.opd,
      dualMetrics: [
        { label: "จำนวนคน", value: m.opdHn },
        { label: "จำนวนครั้ง", value: m.opd },
      ],
      color: "#4D7CFE",
      variant: "opd",
    },
    { label: "ผู้ป่วยในรายการที่ยัง admit อยู่", value: m.ipd, color: "#F59E0B", variant: "ipd" },
    {
      label: "ผู้ป่วย ER/ฉีดยา ทำแผล",
      value: kpiRoom011076,
      color: "#EC4899",
      variant: "er",
    },
    { label: "การให้บริการ Telemed", value: m.telemed, color: "#7C3AED", variant: "telemed" },
  ];
  const ex = options?.excludeVariants;
  if (!ex?.length) return all;
  const drop = new Set(ex);
  return all.filter((item) => !drop.has(item.variant));
}

function ServiceMetricIcon3D({ variant, gradId }: { variant: ServiceMetricVariant; gradId: string }) {
  const depth = "translate(3.8,4.2)";
  const body = (() => {
    switch (variant) {
      case "opd":
        return (
          <>
            <rect x="11" y="14" width="42" height="38" rx="8" />
            <path d="M32 26v14M26 32h12" fill="none" strokeWidth="2.2" />
            <path d="M18 14V10a14 14 0 0 1 28 0v4" fill="none" />
          </>
        );
      case "ipd":
        return (
          <>
            <path d="M8 44h48v5H8z" />
            <path d="M8 44V32l10-8h28l10 8v12" fill="none" />
            <rect x="14" y="20" width="16" height="12" rx="3" />
            <path d="M36 28h12" fill="none" strokeWidth="2" strokeLinecap="round" />
          </>
        );
      case "er":
        return <path d="M38 4L18 34h14l-6 26 26-36H44l-6-20z" strokeLinejoin="round" />;
      case "telemed":
        return (
          <>
            <rect x="7" y="12" width="50" height="34" rx="5" />
            <path d="M32 46v7M22 53h20" fill="none" strokeLinecap="round" />
            <circle cx="46" cy="20" r="3.2" />
            <path d="M10 24q11 8 22 0t22 0" fill="none" strokeLinecap="round" opacity="0.88" />
          </>
        );
      default:
        return null;
    }
  })();

  return (
    <svg
      width="52"
      height="52"
      viewBox="0 0 64 64"
      className="shrink-0 drop-shadow-[3px_5px_10px_rgba(0,0,0,0.38)]"
      aria-hidden
    >
      <defs>
        <linearGradient id={gradId} x1="6" y1="6" x2="58" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.98" />
          <stop offset="45%" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.18" />
        </linearGradient>
      </defs>
      <g
        transform={depth}
        fill="#020617"
        stroke="#020617"
        strokeWidth="1.65"
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity="0.36"
      >
        {body}
      </g>
      <g
        fill={`url(#${gradId})`}
        stroke="rgba(255,255,255,0.93)"
        strokeWidth="1.65"
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        {body}
      </g>
    </svg>
  );
}

export function ServiceMetricSummaryCard({
  label,
  value,
  dualMetrics,
  color,
  variant,
}: {
  label: string;
  value: number;
  dualMetrics?: { label: string; value: number }[];
  color: string;
  variant: ServiceMetricVariant;
}) {
  const uid = useId().replace(/:/g, "");
  const gradId = `svc-metric-3d-${variant}-${uid}`;
  const top = mixWithWhite(color, 0.42);
  const mid = color;
  const bot = mixWithBlack(color, 0.22);
  const rgb = hexToRgb(color);
  const glowRgb = rgb ? `${rgb.r},${rgb.g},${rgb.b}` : "77,124,254";

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-white/30 px-4 py-3.5 text-white"
      style={{
        background: `linear-gradient(148deg, ${top} 0%, ${mid} 48%, ${bot} 100%)`,
        boxShadow: `0 18px 40px -10px rgba(${glowRgb},0.55), 0 8px 20px -8px rgba(15,23,42,0.28), inset 0 1px 0 rgba(255,255,255,0.42), inset 0 -1px 0 rgba(0,0,0,0.08)`,
      }}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-12 h-36 w-36 rounded-full bg-white/30 blur-2xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-14 -left-10 h-32 w-40 rounded-full bg-black/12 blur-2xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent"
        aria-hidden
      />
      <div className="relative flex items-center gap-3">
        <ServiceMetricIcon3D variant={variant} gradId={gradId} />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase leading-snug tracking-wide text-white/95 drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]">
            {label}
          </p>
          {dualMetrics && dualMetrics.length > 0 ? (
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              {dualMetrics.map((m) => (
                <div key={m.label} className="min-w-0">
                  <p className="text-[10px] font-semibold leading-tight text-white/88">{m.label}</p>
                  <p className="mt-0.5 text-xl font-extrabold tabular-nums tracking-tight text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.25)] sm:text-2xl">
                    {m.value.toLocaleString("th-TH")}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-1.5 text-2xl font-extrabold tabular-nums tracking-tight text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.25)]">
              {value.toLocaleString("th-TH")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
