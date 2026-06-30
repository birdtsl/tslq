/** สถิติบริการผู้ป่วยต่อช่วงวันที่ / ปีงบ */
export type PatientServiceYearStats = {
  /** ปีงบ พ.ศ. เริ่มต้น (ต.ค.) */
  fiscalYearBe: number;
  /** ป้ายคอลัมน์ เช่น "2569 (ต.ค.68-พ.ค.69)" */
  label: string;
  start: string;
  end: string;
  isPartial: boolean;
  opdPersons: number;
  opdVisits: number;
  avgOpdPerDay: number;
  ipdCases: number;
  avgLos: number;
  totalBedDays: number;
  cmi: number;
  bedOccupancyRate: number;
  adjrw: number;
};

export type PatientServiceStatsPayload = {
  start: string;
  end: string;
  periodLabel: string;
  /** สรุปช่วงวันที่ที่เลือก — ใช้แสดงการ์ด 4 ใบด้านบน */
  summary: PatientServiceYearStats;
  /** เปรียบเทียบ 4 ปีงบล่าสุด */
  yearlyComparison: PatientServiceYearStats[];
  error?: string | null;
};
