import { loadPatientServiceStats } from "@/lib/hosxpPatientServiceStats";
import type { PatientServiceStatsPayload } from "@/types/patient-service-stats";
import { NextRequest, NextResponse } from "next/server";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseDateParam(value: string | null, fallback: string): string {
  if (value && DATE_RE.test(value.trim())) return value.trim();
  return fallback;
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const now = new Date();
  const y = now.getFullYear();
  const mo = String(now.getMonth() + 1).padStart(2, "0");
  const da = String(now.getDate()).padStart(2, "0");
  const defaultEnd = `${y}-${mo}-${da}`;
  const defaultStart = `${y}-${mo}-01`;

  const start = parseDateParam(sp.get("start"), defaultStart);
  const end = parseDateParam(sp.get("end"), defaultEnd);

  if (start > end) {
    return NextResponse.json(
      { error: "ช่วงวันที่ไม่ถูกต้อง (วันเริ่มต้องไม่เกินวันสิ้นสุด)" } satisfies Partial<PatientServiceStatsPayload>,
      { status: 400 },
    );
  }

  try {
    const payload = await loadPatientServiceStats(start, end);
    return NextResponse.json(payload);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "โหลดสถิติบริการผู้ป่วยไม่สำเร็จ";
    return NextResponse.json(
      {
        start,
        end,
        periodLabel: "",
        summary: {
          fiscalYearBe: 0,
          label: "",
          start,
          end,
          isPartial: false,
          opdPersons: 0,
          opdVisits: 0,
          avgOpdPerDay: 0,
          ipdCases: 0,
          avgLos: 0,
          totalBedDays: 0,
          cmi: 0,
          bedOccupancyRate: 0,
          adjrw: 0,
        },
        yearlyComparison: [],
        error: msg,
      } satisfies PatientServiceStatsPayload,
      { status: 500 },
    );
  }
}
