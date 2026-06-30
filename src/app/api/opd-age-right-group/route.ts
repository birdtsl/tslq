import { loadOpdAgeRightGroupForRange } from "@/lib/hosxpOpdAgeRightGroup";
import type { OpdAgeRightGroupPayload } from "@/types/opd-age-right-group";
import { NextRequest, NextResponse } from "next/server";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseDateParam(value: string | null, fallback: string): string {
  if (value && DATE_RE.test(value.trim())) return value.trim();
  return fallback;
}

function todayIsoLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** OPD จำแนกตามวัยและกลุ่มสิทธิ์ (บัตรทอง / ข้าราชการ / ประกันสังคม) */
export async function GET(req: NextRequest) {
  const today = todayIsoLocal();
  const sp = req.nextUrl.searchParams;
  const start = parseDateParam(sp.get("start"), today);
  const end = parseDateParam(sp.get("end"), today);

  if (start > end) {
    const body: OpdAgeRightGroupPayload = {
      start,
      end,
      rows: [],
      error: "ช่วงวันที่ไม่ถูกต้อง (วันเริ่มต้องไม่เกินวันสิ้นสุด)",
    };
    return NextResponse.json(body, { status: 400 });
  }

  const { rows, error } = await loadOpdAgeRightGroupForRange(start, end);
  return NextResponse.json({
    start,
    end,
    rows,
    error,
  } satisfies OpdAgeRightGroupPayload);
}
