import type { AdmitByWardRow } from "@/types/executive-kpi";

export type ServiceStatsPayload = {
  patientRegistryCount: number | null;
  registryError: string | null;
  /** YYYY-MM-DD */
  start: string;
  /** YYYY-MM-DD */
  end: string;
  periodLabel: string;
  metrics: {
    totalEncounters: number;
    /** จำนวนครั้ง OPD ในช่วงวันที่ */
    opd: number;
    /** จำนวนคน (HN) OPD ในช่วงวันที่ */
    opdHn: number;
    er: number;
    ipd: number;
    /** การให้บริการ Telemed (ครั้ง) — ovstist = 09, COUNT(DISTINCT vn) ในช่วงวันที่ */
    telemed: number;
    newPatients: number;
    followUp: number;
  };
  monthlyTrend: { month: string; value: number }[];
  /** เปรียบเทียบปีที่เลือกกับปีก่อนหน้า (ม.ค.–ธ.ค.) — มีเมื่อส่ง trendYear */
  monthlyComparison: {
    yearNewer: number;
    yearOlder: number;
    points: { month: string; newer: number; older: number }[];
  } | null;
  /** จำนวนรับบริการแยกตามห้องตรวจที่ลงทะเบียน (code = main_dep / depcode) */
  byExamRoom: { code?: string; name: string; personCount: number; visitCount: number }[];
  /** สถานะเตียงผู้ป่วยในราย Ward (ยังไม่จำหน่าย) — จาก ward + ipt */
  wardBedOccupancy: {
    ward: string;
    wardName: string;
    totalBeds: number;
    occupied: number;
    available: number;
    occupancyRate: number;
  }[];
  wardBedOccupancyError: string | null;
  /** ผู้ป่วยในรับไว้แยกตามห้อง (roomno) — SQL เดียวกับ /api/executive-kpi สำหรับ AdmitByWardKpiCard */
  admitByWard: AdmitByWardRow[];
  admitTotal: number | null;
  admitError: string | null;
};
