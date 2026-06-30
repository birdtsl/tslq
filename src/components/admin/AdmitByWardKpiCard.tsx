"use client";

import type { ReactNode } from "react";
import { useId, useMemo } from "react";

const CARD = {
  shell:
    "group relative overflow-hidden rounded-2xl border-2 border-emerald-400/52 bg-gradient-to-br from-emerald-300/70 via-emerald-50/98 to-teal-200/58 p-4 shadow-[0_4px_0_0_rgba(5,150,105,0.24),0_22px_56px_-16px_rgba(16,185,129,0.42),0_12px_32px_-12px_rgba(20,184,166,0.22),inset_0_2px_0_rgba(255,255,255,0.98),inset_0_-4px_12px_rgba(16,185,129,0.08)] ring-2 ring-emerald-200/55 ring-offset-0 transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5",
  glow: "pointer-events-none absolute -right-14 -top-16 h-48 w-48 rounded-full bg-gradient-to-br from-emerald-400/48 via-teal-300/30 to-lime-200/12 blur-2xl",
  bar: "bg-gradient-to-b from-emerald-400 via-teal-600 to-emerald-900 shadow-[0_4px_14px_-2px_rgba(16,185,129,0.52)]",
  titleTint: "text-emerald-950",
  skeleton: "bg-gradient-to-r from-emerald-100 to-emerald-50",
};

const IPD_ICON_BOX = {
  bg: "linear-gradient(145deg, #a7f3d0 0%, #34d399 32%, #10b981 58%, #059669 82%, #047857 100%)",
  shadow:
    "0 7px 0 #047857, 0 14px 28px -4px rgba(5,150,105,0.55), inset 0 2px 6px rgba(255,255,255,0.52), inset 0 -5px 10px rgba(4,120,87,0.4)",
  ring: "ring-2 ring-emerald-300/50",
};

function admitBuildingBucketFromRoomCode(roomCode: string): "b221" | "b220" | "b218" | "other" {
  const s = String(roomCode ?? "").trim();
  if (!s) return "other";
  if (s.startsWith("221")) return "b221";
  if (s.startsWith("220")) return "b220";
  if (s.startsWith("218")) return "b218";
  return "other";
}

const ADMIT_BY_WARD_BUILDING_TILE_CLASSES = {
  other: {
    wrap: "border-sky-400/45 bg-gradient-to-br from-sky-200/95 via-cyan-100/75 to-indigo-100/55 ring-1 ring-sky-300/65 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_10px_24px_-12px_rgba(56,189,248,0.42)]",
    label: "text-slate-900 drop-shadow-[0_1px_0_rgba(255,255,255,0.88)]",
    value: "text-slate-950 drop-shadow-[0_1px_0_rgba(255,255,255,0.92)]",
    unit: "text-sky-900/88",
  },
  "218": {
    wrap: "border-amber-400/45 bg-gradient-to-br from-amber-200/95 via-orange-50/88 to-rose-100/55 ring-1 ring-amber-300/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_10px_24px_-12px_rgba(251,191,36,0.4)]",
    label: "text-amber-950/95 drop-shadow-[0_1px_0_rgba(255,255,255,0.85)]",
    value: "text-amber-950 drop-shadow-[0_1px_0_rgba(255,255,255,0.9)]",
    unit: "text-amber-900/88",
  },
  "220": {
    wrap: "border-emerald-400/50 bg-gradient-to-br from-emerald-200/95 via-teal-100/78 to-cyan-100/58 ring-1 ring-emerald-300/65 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_10px_24px_-12px_rgba(16,185,129,0.42)]",
    label: "text-emerald-950/95 drop-shadow-[0_1px_0_rgba(255,255,255,0.88)]",
    value: "text-emerald-950 drop-shadow-[0_1px_0_rgba(255,255,255,0.92)]",
    unit: "text-emerald-900/88",
  },
  "221": {
    wrap: "border-violet-400/45 bg-gradient-to-br from-violet-200/95 via-fuchsia-50/82 to-indigo-100/58 ring-1 ring-violet-300/65 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_10px_24px_-12px_rgba(167,139,250,0.4)]",
    label: "text-violet-950/95 drop-shadow-[0_1px_0_rgba(255,255,255,0.88)]",
    value: "text-violet-950 drop-shadow-[0_1px_0_rgba(255,255,255,0.9)]",
    unit: "text-violet-900/88",
  },
} as const;

function RoomTileMiniLogo({ roomName }: { roomName: string }) {
  const n = roomName.toLowerCase();
  const wrap = (tint: string, svg: ReactNode) => (
    <span
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${tint} shadow-[0_4px_0_rgba(15,118,110,0.18),inset_0_2px_0_rgba(255,255,255,0.9),0_6px_12px_-4px_rgba(16,185,129,0.35)] ring-1 ring-white/80`}
      aria-hidden
    >
      <svg
        viewBox="0 0 24 24"
        className="h-[15px] w-[15px] text-emerald-950/88"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.85"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {svg}
      </svg>
    </span>
  );

  if (n.includes("คลอด") || n.includes("delivery") || n.includes("labor"))
    return wrap(
      "from-rose-100/95 to-pink-200/70",
      <>
        <path d="M12 21s-6-3.8-6-9.2A4.2 4.2 0 0 1 12 7.8a4.2 4.2 0 0 1 6 3.9c0 5.4-6 9.3-6 9.3z" />
        <path d="M12 11v3M10.5 12.5h3" />
      </>,
    );
  if (n.includes("หญิง") || n.includes("female"))
    return wrap(
      "from-fuchsia-100/90 to-pink-200/65",
      <>
        <circle cx="12" cy="6.5" r="3" />
        <path d="M8 21v-1.2a5 5 0 0 1 3.4-4.7L12 15l.6.1A5 5 0 0 1 16 19.8V21" />
        <path d="M9 12h6" />
      </>,
    );
  if (n.includes("ชาย") || n.includes("male"))
    return wrap(
      "from-sky-100/90 to-blue-200/65",
      <>
        <circle cx="12" cy="7" r="3.2" />
        <path d="M6.5 20.5v-1.3a5.5 5.5 0 0 1 11 0v1.3" />
      </>,
    );
  if (n.includes("พิเศษ") || n.includes("vip") || n.includes("private"))
    return wrap(
      "from-amber-100/95 to-orange-200/70",
      <>
        <path d="M12 3.5 14.2 9l5.8.5-4.4 3.8 1.4 5.7L12 16.9 6.9 19l1.4-5.7L4 9.5l5.8-.5L12 3.5z" />
      </>,
    );
  if (n.includes("homeward") || n.includes("ยาเสพติด") || n.includes("rehab"))
    return wrap(
      "from-violet-100/90 to-indigo-200/65",
      <>
        <rect x="5" y="5" width="14" height="14" rx="3" />
        <path d="M12 9v6M9 12h6" />
      </>,
    );
  if (n.includes("แยกโรค") || n.includes("isolation") || n.includes("ติดเชื้อ"))
    return wrap(
      "from-lime-100/85 to-emerald-300/60",
      <>
        <path d="M12 3l8 4v10l-8 4-8-4V7l8-4z" />
        <path d="M9 12h6M12 9v6" />
      </>,
    );
  if (n.includes("ธัญญา") || n.includes("fertility"))
    return wrap(
      "from-teal-100/90 to-cyan-200/65",
      <>
        <path d="M12 21s-5.5-4-5.5-9A3.5 3.5 0 0 1 12 8.5 3.5 3.5 0 0 1 17.5 12c0 5-5.5 9-5.5 9z" />
        <circle cx="12" cy="11" r="1.2" fill="currentColor" stroke="none" />
      </>,
    );
  if (n.includes("home ward") || (n.includes("home") && n.includes("ward")))
    return wrap(
      "from-emerald-100/90 to-teal-200/65",
      <>
        <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5z" />
      </>,
    );
  return wrap(
    "from-white/95 to-emerald-200/55",
    <>
      <path d="M4 17V9l8-4 8 4v8" />
      <path d="M4 17h16" />
      <path d="M9 17v-4h6v4" />
    </>,
  );
}

export function AdmitByWardKpiCard({
  loading,
  error,
  total,
  rows,
  className,
  showRoomGrid = true,
}: {
  loading: boolean;
  error: string | null;
  total: number | null;
  rows: { ward: string; wardName: string; count: number; totalBedDays?: number }[];
  className?: string;
  /** แสดงกริดรายห้องด้านล่าง (ปิดได้เมื่อพื้นที่แคบ เช่น การ์ดในแถว KPI IPD) */
  showRoomGrid?: boolean;
}) {
  const roomPanelPatternId = `ipd-room-grid-${useId().replace(/:/g, "")}`;
  const admitByBuilding = useMemo(() => {
    let b218 = 0;
    let b220 = 0;
    let b221 = 0;
    let other = 0;
    for (const r of rows) {
      const bucket = admitBuildingBucketFromRoomCode(r.ward);
      if (bucket === "b220") b220 += r.count;
      else if (bucket === "b221") b221 += r.count;
      else if (bucket === "b218") b218 += r.count;
      else other += r.count;
    }
    return { b218, b220, b221, other };
  }, [rows]);

  return (
    <div className={`${CARD.shell} flex min-h-[8.5rem] flex-col ${className ?? ""}`}>
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_65%_at_92%_8%,rgba(255,255,255,0.52),transparent_58%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_92%,rgba(16,185,129,0.36),transparent_52%)]"
        aria-hidden
      />
      <div className={CARD.glow} aria-hidden />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[40%] rounded-t-2xl bg-gradient-to-b from-white/50 to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-10 -left-12 h-36 w-36 rounded-full bg-gradient-to-tr from-teal-400/30 via-emerald-300/16 to-transparent blur-2xl"
        aria-hidden
      />
      <div className="relative z-[1] flex min-h-0 flex-1 gap-3">
        {!loading ? (
          <div
            className={`mt-2 flex h-[3.25rem] w-[3.25rem] shrink-0 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-[1.05] ${IPD_ICON_BOX.ring}`}
            style={{ background: IPD_ICON_BOX.bg, boxShadow: IPD_ICON_BOX.shadow }}
          >
            <svg
              viewBox="0 0 64 64"
              className="h-9 w-9 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M8 44h48v5H8z" />
              <path d="M8 44V32l10-8h28l10 8v12" />
              <rect x="14" y="20" width="16" height="12" rx="3" />
              <path d="M36 28h12" strokeWidth="2" />
            </svg>
          </div>
        ) : null}
        <span className={`mt-2 h-11 w-1.5 shrink-0 rounded-full ${CARD.bar}`} aria-hidden />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <p className={`text-xs font-bold uppercase tracking-wide ${CARD.titleTint}`}>
            ผู้ป่วยในรับไว้ (แยกตามห้อง)
          </p>
          {loading ? (
            <div className="mt-2 flex flex-1 flex-col gap-2">
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 sm:gap-2" aria-hidden>
                <div className={`h-16 animate-pulse rounded-lg ${CARD.skeleton}`} />
                <div className={`h-16 animate-pulse rounded-lg ${CARD.skeleton}`} />
                <div className={`h-16 animate-pulse rounded-lg ${CARD.skeleton}`} />
                <div className={`h-16 animate-pulse rounded-lg ${CARD.skeleton}`} />
              </div>
              {showRoomGrid ? (
                <div className="min-h-[4.5rem] flex-1 animate-pulse rounded-xl bg-white/50 ring-1 ring-emerald-100/60" aria-hidden />
              ) : null}
            </div>
          ) : error ? (
            <p className="mt-2 rounded-lg bg-red-50/90 px-2 py-1.5 text-[11px] leading-snug text-red-700 ring-1 ring-red-100">
              {error.length > 120 ? `${error.slice(0, 120)}…` : error}
            </p>
          ) : (
            <>
              <div
                className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-4 sm:gap-2"
                title="แยกตามรหัสห้อง (roomno): Admit Ward, 218, 220, 221"
              >
                {(
                  [
                    { key: "other", label: "Admit Ward", n: admitByBuilding.other },
                    { key: "218", label: "Homeward ทั่วไป", n: admitByBuilding.b218 },
                    { key: "220", label: "Homeward ยาเสพติด", n: admitByBuilding.b220 },
                    { key: "221", label: "Homeward จิตเวช", n: admitByBuilding.b221 },
                  ] as const
                ).map((cell) => {
                  const tile = ADMIT_BY_WARD_BUILDING_TILE_CLASSES[cell.key];
                  return (
                    <div
                      key={cell.key}
                      className={`min-w-0 rounded-lg px-1 py-1.5 text-center backdrop-blur-[6px] sm:px-1.5 ${tile.wrap}`}
                    >
                      <p
                        className={`line-clamp-2 min-h-[2rem] text-[9px] font-bold leading-tight tracking-wide ${tile.label}`}
                      >
                        {cell.label}
                      </p>
                      <p
                        className={`mt-0.5 text-lg font-extrabold tabular-nums tracking-tight sm:text-xl ${tile.value}`}
                      >
                        {cell.n.toLocaleString()}
                        <span className={`block text-[10px] font-bold leading-tight ${tile.unit}`}>ราย</span>
                      </p>
                    </div>
                  );
                })}
              </div>
              <p className="mt-1.5 text-center text-[10px] font-semibold tabular-nums text-emerald-900/75">
                รวมทั้งหมด {(total ?? 0).toLocaleString()} ราย
              </p>
              {showRoomGrid ? (
                <div className="relative mt-2 max-h-[8.5rem] flex-1 overflow-hidden rounded-xl border-2 border-emerald-300/45 shadow-[0_8px_24px_-8px_rgba(16,185,129,0.35),inset_0_1px_0_rgba(255,255,255,0.95)] ring-1 ring-white/70 [scrollbar-gutter:stable]">
                  <div
                    className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-100/95 via-cyan-50/50 to-teal-200/55"
                    aria-hidden
                  />
                  <div
                    className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_85%_70%_at_100%_0%,rgba(52,211,153,0.35),transparent_55%),radial-gradient(ellipse_70%_60%_at_0%_100%,rgba(45,212,191,0.28),transparent_50%)]"
                    aria-hidden
                  />
                  <div
                    className="pointer-events-none absolute inset-0 opacity-[0.14] mix-blend-multiply [background-image:repeating-linear-gradient(128deg,rgba(5,150,105,0.45)_0,rgba(5,150,105,0.45)_1px,transparent_1px,transparent_7px)]"
                    aria-hidden
                  />
                  <svg
                    className="pointer-events-none absolute inset-0 h-full w-full text-emerald-700/25"
                    aria-hidden
                  >
                    <defs>
                      <pattern
                        id={roomPanelPatternId}
                        width="14"
                        height="14"
                        patternUnits="userSpaceOnUse"
                      >
                        <path
                          d="M14 0H0V14"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="0.55"
                          vectorEffect="non-scaling-stroke"
                        />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill={`url(#${roomPanelPatternId})`} />
                  </svg>
                  <div className="relative z-[1] grid max-h-[8.5rem] grid-cols-3 gap-x-1.5 gap-y-1.5 overflow-y-auto overscroll-contain p-2 text-[10px] leading-tight">
                    {rows.length === 0 ? (
                      <p className="col-span-3 px-1 py-2 text-center font-medium text-slate-600">
                        ไม่มีผู้ป่วยรับไว้ตามเงื่อนไข หรือไม่มีข้อมูลห้อง
                      </p>
                    ) : (
                      rows.map((r) => {
                        const tip = r.ward ? `roomno: ${r.ward}` : r.wardName;
                        const countStr = r.count.toLocaleString();
                        return (
                          <div
                            key={r.ward ? `room:${r.ward}` : `room:_${r.wardName}`}
                            className="flex min-w-0 flex-col items-center gap-1 rounded-lg border border-white/55 bg-gradient-to-b from-white/75 to-emerald-50/45 px-1 py-1.5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_3px_10px_-3px_rgba(15,118,110,0.25)] backdrop-blur-[6px]"
                          >
                            <RoomTileMiniLogo roomName={r.wardName} />
                            <span
                              className="line-clamp-2 min-h-[1.75rem] w-full px-0.5 text-[9px] font-semibold leading-tight text-slate-900 drop-shadow-[0_1px_0_rgba(255,255,255,0.7)]"
                              title={tip}
                            >
                              {r.wardName}
                              {r.ward && r.wardName !== r.ward ? (
                                <span className="font-medium text-emerald-900/75"> ({r.ward})</span>
                              ) : null}
                            </span>
                            <div className="flex w-full flex-1 flex-col justify-end">
                              <div className="flex w-full justify-center pt-0.5">
                                <span className="grid place-items-center [grid-template-areas:'stack']">
                                  <span
                                    aria-hidden
                                    className="[grid-area:stack] translate-x-[3px] translate-y-[3px] whitespace-nowrap rounded-lg border border-emerald-900/20 bg-gradient-to-b from-emerald-800/35 to-teal-900/45 px-2.5 py-1 text-lg font-black tabular-nums text-emerald-950/35 shadow-inner"
                                  >
                                    {countStr}
                                  </span>
                                  <span
                                    className="[grid-area:stack] whitespace-nowrap rounded-lg bg-gradient-to-b from-white via-emerald-50/95 to-teal-100/90 px-2.5 py-1 text-lg font-black tabular-nums tracking-tight text-emerald-950 shadow-[0_4px_0_0_rgba(5,100,72,0.42),0_6px_16px_-4px_rgba(16,185,129,0.48),inset_0_2px_0_rgba(255,255,255,0.98),inset_0_-1px_0_rgba(5,80,60,0.08)] ring-2 ring-emerald-300/60"
                                  >
                                    {countStr}
                                  </span>
                                </span>
                              </div>
                              {(r.totalBedDays ?? 0) > 0 ? (
                                <p className="mt-0.5 text-center text-[8px] font-semibold tabular-nums leading-tight text-emerald-900/80">
                                  วันนอน{" "}
                                  {(r.totalBedDays ?? 0).toLocaleString("th-TH", {
                                    maximumFractionDigits: 1,
                                  })}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
