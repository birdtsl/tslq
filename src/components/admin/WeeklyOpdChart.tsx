"use client";

import { useMemo, useState } from "react";

export type WeeklyOpdPoint = {
  day: string;
  label: string;
  count: number;
};

type WeeklyOpdChartProps = {
  data: WeeklyOpdPoint[];
};

const W = 560;
const H = 200;
const PAD = { top: 20, right: 12, bottom: 32, left: 44 };

function niceMax(value: number) {
  return Math.ceil(value / 20) * 20;
}

function smoothPath(points: { x: number; y: number }[]) {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

export default function WeeklyOpdChart({ data }: WeeklyOpdChartProps) {
  const peakIndex = data.reduce(
    (maxIdx, item, idx) => (item.count > data[maxIdx].count ? idx : maxIdx),
    0,
  );
  const [activeIndex, setActiveIndex] = useState(peakIndex);

  const chartMax = niceMax(Math.max(...data.map((d) => d.count)));
  const chartWidth = W - PAD.left - PAD.right;
  const chartHeight = H - PAD.top - PAD.bottom;
  const baseline = PAD.top + chartHeight;

  const points = useMemo(
    () =>
      data.map((item, i) => ({
        ...item,
        x: PAD.left + (i / Math.max(data.length - 1, 1)) * chartWidth,
        y: PAD.top + chartHeight - (item.count / chartMax) * chartHeight,
      })),
    [data, chartMax, chartWidth, chartHeight],
  );

  const linePath = smoothPath(points);
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${baseline} L ${points[0].x} ${baseline} Z`;

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => ({
    ratio,
    value: Math.round(chartMax * ratio),
    y: PAD.top + chartHeight - ratio * chartHeight,
  }));

  const active = points[activeIndex];

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label="กราฟผู้ป่วยนอกรายสัปดาห์"
        onMouseLeave={() => setActiveIndex(peakIndex)}
      >
        <defs>
          <linearGradient id="opd-area-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary-500)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--primary-500)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="opd-line-gradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--primary-400)" />
            <stop offset="100%" stopColor="var(--primary-600)" />
          </linearGradient>
          <filter id="opd-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {yTicks.map((tick) => (
          <g key={tick.ratio}>
            <line
              x1={PAD.left}
              y1={tick.y}
              x2={W - PAD.right}
              y2={tick.y}
              stroke="var(--divider)"
              strokeWidth="1"
            />
            <text
              x={PAD.left - 8}
              y={tick.y + 4}
              textAnchor="end"
              className="fill-muted text-[10px]"
            >
              {tick.value.toLocaleString("th-TH")}
            </text>
          </g>
        ))}

        <path d={areaPath} fill="url(#opd-area-gradient)" />
        <path
          d={linePath}
          fill="none"
          stroke="url(#opd-line-gradient)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#opd-glow)"
        />

        {points.map((point, i) => (
          <g key={point.day}>
            <rect
              x={point.x - chartWidth / data.length / 2}
              y={PAD.top}
              width={chartWidth / data.length}
              height={chartHeight}
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => setActiveIndex(i)}
            />
            <text
              x={point.x}
              y={H - 8}
              textAnchor="middle"
              className="fill-muted text-[11px]"
            >
              {point.day}
            </text>
          </g>
        ))}

        {active && (
          <>
            <line
              x1={active.x}
              y1={PAD.top}
              x2={active.x}
              y2={baseline}
              stroke="var(--primary-500)"
              strokeWidth="1"
              strokeDasharray="4 4"
              opacity="0.4"
            />
            <circle
              cx={active.x}
              cy={active.y}
              r="5"
              fill="var(--foreground)"
              stroke="var(--primary-500)"
              strokeWidth="2.5"
            />
          </>
        )}
      </svg>

      {active && (
        <div
          className="pointer-events-none absolute z-10 rounded-2xl bg-[var(--card-bg)] px-3 py-2 shadow-[var(--card-shadow-sm)]"
          style={{
            left: `${(active.x / W) * 100}%`,
            top: `${((active.y - 12) / H) * 100}%`,
            transform: "translate(-50%, calc(-100% - 8px))",
          }}
        >
          <p className="text-[11px] text-muted">{active.label}</p>
          <p className="text-sm font-semibold text-foreground">
            {active.count.toLocaleString("th-TH")} ราย
          </p>
        </div>
      )}
    </div>
  );
}
