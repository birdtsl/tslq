/** แถวผู้ป่วยในรับไว้ — ward = roomno, wardName = ชื่อห้องจาก roomno.name */
export type AdmitByWardRow = {
  ward: string;
  wardName: string;
  count: number;
  totalBedDays: number;
};
